import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginStreakService } from '../login-streak/login-streak.service';
import { AchievementsService } from '../achievements/achievements.service';
import { EmailService } from '../email/email.service';

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly loginStreakService: LoginStreakService,
    private readonly achievementsService: AchievementsService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string): Promise<AuthTokens & { user: object }> {
    // Duplicate шалгах
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (existing) {
      if (existing.email === dto.email) {
        throw new ConflictException('Энэ имэйл аль хэдийн бүртгэгдсэн байна');
      }
      throw new ConflictException('Энэ хэрэглэгчийн нэр аль хэдийн бүртгэгдсэн байна');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        username: dto.username,
        displayName: dto.displayName ?? dto.username,
        passwordHash,
        ipAddress,
      },
    });

    this.logger.log(`New user registered: ${user.username} (${user.id})`);

    const tokens = await this.generateTokens(user.id, user.username, user.role);

    return {
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        reputation: user.reputation,
        characterPoints: user.characterPoints,
        activeCharacterId: user.activeCharacterId,
      },
    };
  }

  async login(dto: LoginDto, ipAddress?: string): Promise<AuthTokens & { user: object }> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.emailOrUsername.toLowerCase() },
          { username: dto.emailOrUsername },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Хэрэглэгчийн нэр эсвэл нууц үг буруу байна');
    }

    if (user.isBanned) {
      const banMsg = user.banUntil
        ? `Таны бүртгэл ${user.banUntil.toLocaleDateString('mn-MN')} хүртэл хориглогдсон. Шалтгаан: ${user.banReason}`
        : `Таны бүртгэл хориглогдсон. Шалтгаан: ${user.banReason}`;
      throw new UnauthorizedException(banMsg);
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Таны бүртгэл идэвхгүй байна');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Хэрэглэгчийн нэр эсвэл нууц үг буруу байна');
    }

    // Update last login + IP
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), ipAddress },
    });

    const tokens = await this.generateTokens(user.id, user.username, user.role);

    // Login streak + achievement (fire-and-forget)
    this.loginStreakService.processLogin(user.id).then(({ streak, isNewDay }) => {
      if (isNewDay) {
        if (streak >= 7) this.achievementsService.increment(user.id, 'streak_7').catch(() => {});
        if (streak >= 30) this.achievementsService.increment(user.id, 'streak_30').catch(() => {});
      }
    }).catch(() => {});

    const freshUser = await this.prisma.user.findUnique({ where: { id: user.id }, select: { characterPoints: true, isEmailVerified: true } });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        reputation: user.reputation,
        characterPoints: freshUser?.characterPoints ?? user.characterPoints,
        activeCharacterId: user.activeCharacterId,
        isEmailVerified: freshUser?.isEmailVerified ?? false,
      },
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      // Blacklist шалгах
      const isBlacklisted = await this.redis.exists(`blacklist:${refreshToken}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Токен хүчингүй болсон байна');
      }

      // Хуучин refresh token-г blacklist-д оруулах (rotation)
      const ttl = payload.exp! - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.redis.set(`blacklist:${refreshToken}`, '1', ttl);
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, username: true, role: true, isBanned: true, isActive: true },
      });

      if (!user || user.isBanned || !user.isActive) {
        throw new UnauthorizedException('Хэрэглэгч олдсонгүй');
      }

      return this.generateTokens(user.id, user.username, user.role);
    } catch {
      throw new UnauthorizedException('Refresh token хүчингүй байна');
    }
  }

  async forgotPassword(emailOrUsername: string): Promise<{ message: string; devCode?: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername.toLowerCase() },
          { username: emailOrUsername },
        ],
      },
    });

    // Аюулгүй байдлын үүднээс хэрэглэгч олдсон эсэхийг харуулахгүй
    if (!user) {
      return { message: 'Хэрэв бүртгэлтэй бол 6 оронтой код үүсэх болно' };
    }

    // 6 оронтой тоон код үүсгэх
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `reset:${resetCode}`;

    // Redis-д 15 минут хадгалах
    await this.redis.set(key, user.id, 900);

    this.logger.log(`[RESET] ${user.username} (${user.email}) → code: ${resetCode}`);
    this.emailService.sendPasswordReset(user.email, user.username, resetCode).catch(() => {});

    return {
      message: '6 оронтой reset код имэйлд илгээлээ. 15 минут хүчинтэй.',
      ...(this.config.get<string>('NODE_ENV') !== 'production' ? { devCode: resetCode } : {}),
    };
  }

  async resetPassword(resetCode: string, newPassword: string): Promise<{ message: string }> {
    const key = `reset:${resetCode}`;
    const userId = await this.redis.get(key);

    if (!userId) {
      throw new BadRequestException('Reset код буруу эсвэл хугацаа дууссан байна');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('Нууц үг доод тал нь 8 тэмдэгт байна');
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      throw new BadRequestException('Нууц үгэнд том үсэг, жижиг үсэг, тоо байх ёстой');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Кодыг устгах (нэг удаа л хэрэглэнэ)
    await this.redis.del(key);

    this.logger.log(`[RESET] User ${userId} нууц үгийг амжилттай шинэчлэлээ`);

    return { message: 'Нууц үг амжилттай шинэчлэгдлээ!' };
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      try {
        const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
          secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        });
        const ttl = payload.exp! - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await this.redis.set(`blacklist:${refreshToken}`, '1', ttl);
        }
      } catch {}
    }
    await this.redis.deleteSession(userId);
  }

  async getStreak(userId: string) {
    return this.loginStreakService.getStreak(userId);
  }

  async sendVerificationCode(userId: string): Promise<{ message: string; devCode?: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Хэрэглэгч олдсонгүй');
    if (user.isEmailVerified) throw new BadRequestException('Имэйл аль хэдийн баталгаажсан байна');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.set(`email_verify:${userId}`, code, 900);

    this.logger.log(`[EMAIL VERIFY] ${user.username} → code: ${code}`);
    this.emailService.sendEmailVerification(user.email, user.username, code).catch(() => {});

    return {
      message: '6 оронтой баталгаажуулах код үүслээ. 15 минут хүчинтэй.',
      ...(this.config.get<string>('NODE_ENV') !== 'production' ? { devCode: code } : {}),
    };
  }

  async verifyEmail(userId: string, code: string): Promise<{ message: string }> {
    const stored = await this.redis.get(`email_verify:${userId}`);
    if (!stored || stored !== code) {
      throw new BadRequestException('Код буруу эсвэл хугацаа дууссан байна');
    }

    await this.prisma.user.update({ where: { id: userId }, data: { isEmailVerified: true } });
    await this.redis.del(`email_verify:${userId}`);

    return { message: 'Имэйл амжилттай баталгаажлаа!' };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        isBanned: true,
        isActive: true,
        reputation: true,
        characterPoints: true,
        activeCharacterId: true,
      },
    });
  }

  private async generateTokens(userId: string, username: string, role: string): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, username, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return { accessToken, refreshToken, expiresIn: 900 };
  }
}
