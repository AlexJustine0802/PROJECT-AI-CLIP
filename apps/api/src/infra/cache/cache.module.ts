import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CachePort } from '@clipforge/core';

export const CACHE = Symbol('CACHE');

/**
 * In-memory CachePort (default, CACHE_DRIVER=memory) — no Redis, no Docker. Values expire via
 * per-key timers. Good for single-process dev; for multi-instance prod use the Redis driver.
 */
class MemoryCache implements CachePort {
  private readonly store = new Map<string, { value: unknown; expires?: number }>();

  async get<T>(key: string): Promise<T | null> {
    const hit = this.store.get(key);
    if (!hit) return null;
    if (hit.expires && hit.expires < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return hit.value as T;
  }

  async set<T>(key: string, value: T, ttlSec?: number): Promise<void> {
    this.store.set(key, { value, expires: ttlSec ? Date.now() + ttlSec * 1000 : undefined });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async wrap<T>(key: string, ttlSec: number, compute: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await compute();
    await this.set(key, fresh, ttlSec);
    return fresh;
  }
}

/**
 * Redis-backed CachePort (CACHE_DRIVER=redis) — lazy-loads ioredis so the default memory path
 * never requires it. Use for horizontally-scaled deployments.
 */
class RedisCache implements CachePort {
  private readonly redis: any;

  constructor(redisUrl: string) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Redis } = require('ioredis');
    this.redis = new Redis(redisUrl, { maxRetriesPerRequest: null });
  }

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
      provide: CACHE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): CachePort =>
        config.get<string>('cache.driver') === 'redis'
          ? new RedisCache(config.get<string>('redis.url')!)
          : new MemoryCache(),
    },
  ],
  exports: [CACHE],
})
export class CacheModule {}
