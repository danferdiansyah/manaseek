import { Module } from '@nestjs/common';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { MutawifController } from './mutawif.controller';
import { MutawifService } from './mutawif.service';

@Module({
  imports: [NotificationsModule],
  controllers: [MutawifController],
  providers: [MutawifService],
  exports: [MutawifService],
})
export class MutawifModule {}
