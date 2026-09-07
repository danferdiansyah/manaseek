import { Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { BookingService } from '@/modules/booking/booking.service';
import { InternalTokenGuard } from './internal-token.guard';

@ApiExcludeController()
@Public()
@UseGuards(InternalTokenGuard)
@Controller('internal/tasks')
export class InternalController {
  constructor(private readonly bookings: BookingService) {}

  @Post('expire-bookings')
  @HttpCode(HttpStatus.OK)
  async expireBookings() {
    const expired = await this.bookings.expireStaleRequests();
    return { expired };
  }
}
