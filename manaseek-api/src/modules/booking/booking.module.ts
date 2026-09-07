import { Module } from '@nestjs/common';
import { MutawifModule } from '@/modules/mutawif/mutawif.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

@Module({
  imports: [MutawifModule, NotificationsModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
