import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
import { AppConfigService } from '@/common/config/config.service';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';

@Module({
  imports: [
    NotificationsModule,
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.get('JWT_ACCESS_SECRET'),
        // Validated by the env schema to match `<number><s|m|h|d>`.
        signOptions: {
          expiresIn: config.get('JWT_ACCESS_TTL') as SignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, TokenService],
  exports: [JwtModule, TokenService],
})
export class AuthModule {}
