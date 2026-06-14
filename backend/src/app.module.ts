import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CharactersModule } from './characters/characters.module';
import { ChatModule } from './chat/chat.module';
import { AttackEventModule } from './attack-event/attack-event.module';
import { SeasonsModule } from './seasons/seasons.module';
import { MiniGamesModule } from './mini-games/mini-games.module';
import { PaymentModule } from './payment/payment.module';
import { AdminModule } from './admin/admin.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { GuildsModule } from './guilds/guilds.module';
import { ModerationModule } from './moderation/moderation.module';
import { EnergyModule } from './energy/energy.module';
import { ReputationModule } from './reputation/reputation.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CosmeticsModule } from './cosmetics/cosmetics.module';
import { QuestsModule } from './quests/quests.module';
import { AchievementsModule } from './achievements/achievements.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LoginStreakModule } from './login-streak/login-streak.module';
import { GachaModule } from './gacha/gacha.module';
import { GuildWarsModule } from './guild-wars/guild-wars.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('RATE_LIMIT_TTL', 60),
          limit: config.get<number>('RATE_LIMIT_MAX', 100),
        },
      ],
    }),

    ScheduleModule.forRoot(),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        },
      }),
    }),

    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    CharactersModule,
    ChatModule,
    AttackEventModule,
    SeasonsModule,
    MiniGamesModule,
    PaymentModule,
    AdminModule,
    LeaderboardModule,
    GuildsModule,
    ModerationModule,
    EnergyModule,
    ReputationModule,
    AnalyticsModule,
    CosmeticsModule,
    QuestsModule,
    AchievementsModule,
    NotificationsModule,
    LoginStreakModule,
    GachaModule,
    GuildWarsModule,
  ],
})
export class AppModule {}
