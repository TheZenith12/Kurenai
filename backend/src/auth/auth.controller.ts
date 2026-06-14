import {
  Controller, Get, Post, Body, HttpCode, HttpStatus, Req, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('Auth - Нэвтрэх / Бүртгүүлэх')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Шинэ хэрэглэгч бүртгүүлэх' })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const ip = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress;
    return this.authService.register(dto, ip);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Нэвтрэх' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress;
    return this.authService.login(dto, ip);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Access token шинэчлэх' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Нууц үг мартсан — reset код авах' })
  async forgotPassword(@Body() body: { emailOrUsername: string }) {
    return this.authService.forgotPassword(body.emailOrUsername);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Нууц үг шинэчлэх' })
  async resetPassword(@Body() body: { resetCode: string; newPassword: string }) {
    return this.authService.resetPassword(body.resetCode, body.newPassword);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Гарах' })
  async logout(@Body() dto: RefreshTokenDto, @Req() req: any) {
    const userId = req.user?.id;
    await this.authService.logout(userId, dto.refreshToken);
    return { message: 'Амжилттай гарлаа' };
  }

  @Get('streak')
  @UseGuards(JwtAuthGuard)
  async getStreak(@Req() req: any) {
    return this.authService.getStreak(req.user.id);
  }

  @Post('send-verification')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Имэйл баталгаажуулах код илгээх' })
  async sendVerification(@Req() req: any) {
    return this.authService.sendVerificationCode(req.user.id);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Имэйл баталгаажуулах' })
  async verifyEmail(@Req() req: any, @Body() body: { code: string }) {
    return this.authService.verifyEmail(req.user.id, body.code);
  }
}
