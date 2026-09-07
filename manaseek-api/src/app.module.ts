import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppConfigModule } from './common/config/config.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggerModule } from './common/logger/logger.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [AppConfigModule, LoggerModule, PrismaModule, RedisModule, HealthModule],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
