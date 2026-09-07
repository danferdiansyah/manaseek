import { Module } from '@nestjs/common';
import { BookingModule } from '@/modules/booking/booking.module';
import { InternalController } from './internal.controller';
import { InternalTokenGuard } from './internal-token.guard';

@Module({
  imports: [BookingModule],
  controllers: [InternalController],
  providers: [InternalTokenGuard],
})
export class InternalModule {}
