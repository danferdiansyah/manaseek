import { Module } from '@nestjs/common';
import { AppConfigService } from '@/common/config/config.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { FcmPushProvider } from './providers/fcm-push.provider';
import { NoopPushProvider } from './providers/noop-push.provider';
import { PUSH_PROVIDER } from './providers/push.provider';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NoopPushProvider,
    FcmPushProvider,
    {
      provide: PUSH_PROVIDER,
      inject: [AppConfigService, NoopPushProvider, FcmPushProvider],
      useFactory: (config: AppConfigService, noop: NoopPushProvider, fcm: FcmPushProvider) =>
        config.get('PUSH_PROVIDER') === 'fcm' ? fcm : noop,
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
