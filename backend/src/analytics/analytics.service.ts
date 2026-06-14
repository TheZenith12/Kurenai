import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async track(eventType: string, payload: object, userId?: string, ipAddress?: string) {
    await this.prisma.analyticsEvent.create({
      data: { eventType, payload, userId, ipAddress },
    });
  }

  async getActiveUserCount(): Promise<number> {
    const val = await this.redis.get('online:count');
    return parseInt(val ?? '0');
  }

  async getDailyActiveUsers() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.prisma.user.count({
      where: { lastLoginAt: { gte: since } },
    });
  }

  async getEventStats(eventType: string, since: Date) {
    return this.prisma.analyticsEvent.count({
      where: { eventType, createdAt: { gte: since } },
    });
  }
}
