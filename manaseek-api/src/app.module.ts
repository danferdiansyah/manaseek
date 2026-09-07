import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './common/config/config.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggerModule } from './common/logger/logger.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookingModule } from './modules/booking/booking.module';
import { HealthModule } from './modules/health/health.module';
import { MutawifModule } from './modules/mutawif/mutawif.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    PrismaModule,
    RedisModule,
    AuditModule,
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    ScheduleModule.forRoot(),
    HealthModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    MutawifModule,
    BookingModule,
    ReviewsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Order matters: throttle, then authenticate, then authorise.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
