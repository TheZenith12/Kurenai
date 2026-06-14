import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (config: ConfigService) => {
        const Redis = (await import('ioredis')).default;
        const client = new Redis({
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
          retryStrategy: (times) => Math.min(times * 50, 2000),
          enableReadyCheck: true,
          maxRetriesPerRequest: 3,
        });
        client.on('connect', () => console.log('[Redis] Connected'));
        client.on('error', (err) => console.error('[Redis] Error:', err));
        return client;
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
