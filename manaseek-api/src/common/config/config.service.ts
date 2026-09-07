import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './configuration';

/**
 * Thin typed wrapper over ConfigService so feature code never touches raw
 * `process.env` and never has to deal with `string | undefined`.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get<K extends keyof Env>(key: K): Env[K] {
    return this.config.get(key, { infer: true }) as Env[K];
  }

  get isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  get isDevelopment(): boolean {
    return this.get('NODE_ENV') === 'development';
  }

  get corsOrigins(): string[] | boolean {
    const raw = this.get('CORS_ORIGINS');
    if (raw === '*') return true;
    return raw.split(',').map((origin) => origin.trim()).filter(Boolean);
  }
}
