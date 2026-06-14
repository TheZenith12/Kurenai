import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  // ─── Энгийн key-value ───────────────────────────────────────────

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redis.setex(key, ttlSeconds, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) === 1;
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    const val = await this.redis.incr(key);
    if (ttlSeconds && val === 1) {
      await this.redis.expire(key, ttlSeconds);
    }
    return val;
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  // ─── JSON helpers ───────────────────────────────────────────────

  async getJson<T>(key: string): Promise<T | null> {
    const val = await this.redis.get(key);
    return val ? (JSON.parse(val) as T) : null;
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  // ─── Sorted Set (leaderboard) ───────────────────────────────────

  async zadd(key: string, score: number, member: string): Promise<void> {
    await this.redis.zadd(key, score, member);
  }

  async zincrby(key: string, increment: number, member: string): Promise<number> {
    return parseFloat(await this.redis.zincrby(key, increment, member));
  }

  async zrevrank(key: string, member: string): Promise<number | null> {
    return this.redis.zrevrank(key, member);
  }

  async zrevrange(key: string, start: number, stop: number, withScores = false): Promise<string[]> {
    if (withScores) {
      return this.redis.zrevrange(key, start, stop, 'WITHSCORES');
    }
    return this.redis.zrevrange(key, start, stop);
  }

  async zscore(key: string, member: string): Promise<number | null> {
    const s = await this.redis.zscore(key, member);
    return s !== null ? parseFloat(s) : null;
  }

  async zcard(key: string): Promise<number> {
    return this.redis.zcard(key);
  }

  // ─── Rate Limiting (Sliding Window) ─────────────────────────────

  async isRateLimited(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    const pipeline = this.redis.pipeline();
    pipeline.zremrangebyscore(key, '-inf', windowStart);
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    pipeline.zcard(key);
    pipeline.expire(key, windowSeconds);

    const results = await pipeline.exec();
    const count = results?.[2]?.[1] as number;
    return count > limit;
  }

  // ─── Pub/Sub helpers ────────────────────────────────────────────

  getClient(): Redis {
    return this.redis;
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.redis.publish(channel, message);
  }

  // ─── Energy System ───────────────────────────────────────────────

  async getEnergy(userId: string): Promise<number> {
    const key = `user:${userId}:energy`;
    const val = await this.redis.get(key);
    return val ? parseInt(val) : 100;
  }

  async setEnergy(userId: string, amount: number): Promise<void> {
    await this.redis.set(`user:${userId}:energy`, amount.toString());
  }

  async deductEnergy(userId: string, amount: number): Promise<{ success: boolean; remaining: number }> {
    const key = `user:${userId}:energy`;
    const current = await this.getEnergy(userId);
    if (current < amount) return { success: false, remaining: current };
    const newVal = current - amount;
    await this.redis.set(key, newVal.toString());
    return { success: true, remaining: newVal };
  }

  // ─── Skill Cooldown ──────────────────────────────────────────────

  async isSkillOnCooldown(userId: string, skillId: string): Promise<boolean> {
    return this.exists(`skill:cd:${userId}:${skillId}`);
  }

  async setSkillCooldown(userId: string, skillId: string, seconds: number): Promise<void> {
    await this.redis.setex(`skill:cd:${userId}:${skillId}`, seconds, '1');
  }

  async getSkillCooldown(userId: string, skillId: string): Promise<number> {
    return this.ttl(`skill:cd:${userId}:${skillId}`);
  }

  // ─── Session ─────────────────────────────────────────────────────

  async setSession(userId: string, data: object, ttlSeconds = 86400): Promise<void> {
    await this.setJson(`session:${userId}`, data, ttlSeconds);
  }

  async getSession<T>(userId: string): Promise<T | null> {
    return this.getJson<T>(`session:${userId}`);
  }

  async deleteSession(userId: string): Promise<void> {
    await this.del(`session:${userId}`);
  }

  // ─── HP Cache (Season) ───────────────────────────────────────────

  async getHp(seasonId: string, userId: string): Promise<number | null> {
    const val = await this.redis.get(`season:${seasonId}:hp:${userId}`);
    return val !== null ? parseInt(val) : null;
  }

  async setHp(seasonId: string, userId: string, hp: number): Promise<void> {
    await this.redis.set(`season:${seasonId}:hp:${userId}`, hp.toString());
  }

  async deductHp(seasonId: string, userId: string, damage: number): Promise<number> {
    const key = `season:${seasonId}:hp:${userId}`;
    const current = parseInt((await this.redis.get(key)) ?? '1000');
    const newHp = Math.max(0, current - damage);
    await this.redis.set(key, newHp.toString());
    return newHp;
  }
}
