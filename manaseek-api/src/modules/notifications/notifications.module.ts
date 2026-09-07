import { Module } from '@nestjs/common';
import { AppConfigService } from '@/common/config/config.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { FcmPushProvider } from './providers/fcm-push.provider';
import { FonnteSmsProvider } from './providers/fonnte-sms.provider';
import { NoopPushProvider } from './providers/noop-push.provider';
import { NoopSmsProvider } from './providers/noop-sms.provider';
import { PUSH_PROVIDER } from './providers/push.provider';
import { SMS_PROVIDER } from './providers/sms.provider';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NoopPushProvider,
    NoopSmsProvider,
    FcmPushProvider,
    FonnteSmsProvider,
    {
      provide: PUSH_PROVIDER,
      inject: [AppConfigService, NoopPushProvider, FcmPushProvider],
      useFactory: (config: AppConfigService, noop: NoopPushProvider, fcm: FcmPushProvider) =>
        config.get('PUSH_PROVIDER') === 'fcm' ? fcm : noop,
    },
    {
      provide: SMS_PROVIDER,
      inject: [AppConfigService, NoopSmsProvider, FonnteSmsProvider],
      useFactory: (config: AppConfigService, noop: NoopSmsProvider, fonnte: FonnteSmsProvider) =>
        config.get('SMS_PROVIDER') === 'fonnte' ? fonnte : noop,
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
