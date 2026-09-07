import { Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
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

  // GET as well as POST: platform schedulers such as Vercel Cron only issue GET.
  @Get('expire-bookings')
  @Post('expire-bookings')
  @HttpCode(HttpStatus.OK)
  async expireBookings() {
    const expired = await this.bookings.expireStaleRequests();
    return { expired };
  }
}
