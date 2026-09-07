import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfigService } from '../config/config.service';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(config: AppConfigService) {
    this.client = new Redis(config.get('REDIS_URL'), {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    });
    this.client.on('error', (error) => this.logger.error(`Redis error: ${error.message}`));
  }

  get raw(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Sliding-free fixed window counter. Returns the count after increment so the
   * caller can decide whether the limit was breached.
   */
  async incrementWithTtl(key: string, ttlSeconds: number): Promise<number> {
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, ttlSeconds);
    }
    return count;
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async ping(): Promise<boolean> {
    try {
      return (await this.client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
