import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import type { CachePort } from '@clipforge/core';

export const REDIS = Symbol('REDIS');
export const CACHE = Symbol('CACHE');

/** Redis-backed CachePort adapter (#19): transcripts, metadata, thumbnails, hot projects. */
class RedisCache implements CachePort {
  constructor(private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSec?: number): Promise<void> {
    const raw = JSON.stringify(value);
    if (ttlSec) await this.redis.set(key, raw, 'EX', ttlSec);
    else await this.redis.set(key, raw);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async wrap<T>(key: string, ttlSec: number, compute: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await compute();
    await this.set(key, fresh, ttlSec);
    return fresh;
  }
}

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new Redis(config.get<string>('redis.url')!, {
        maxRetriesPerRequest: null,
      }),
    },
    {
      provide: CACHE,
      inject: [REDIS],
      useFactory: (redis: Redis) => new RedisCache(redis),
    },
  ],
  exports: [REDIS, CACHE],
})
export class CacheModule {}
