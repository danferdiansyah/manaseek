import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import { BookingService } from './booking.service';
import {
  cancelBookingSchema,
  createBookingSchema,
  listBookingsSchema,
  rejectBookingSchema,
  updatePaymentSchema,
  type CancelBookingDto,
  type CreateBookingDto,
  type ListBookingsDto,
  type RejectBookingDto,
  type UpdatePaymentDto,
} from './dto/booking.dto';

@ApiTags('bookings')
@ApiBearerAuth('access-token')
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookings: BookingService) {}

  @Post()
  @ApiOperation({ summary: 'Request a mutawif' })
  create(
    @CurrentUser('id') jamaahId: string,
    @Body(new ZodValidationPipe(createBookingSchema)) dto: CreateBookingDto,
  ) {
    return this.bookings.create(jamaahId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List bookings visible to the caller' })
  list(
    @CurrentUser() actor: AuthenticatedUser,
    @Query(new ZodValidationPipe(listBookingsSchema)) query: ListBookingsDto,
  ) {
    return this.bookings.list(actor, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Booking detail with its full event history' })
  getById(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookings.getById(actor, id);
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mutawif accepts a request' })
  accept(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookings.accept(actor, id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mutawif declines a request' })
  reject(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(rejectBookingSchema)) dto: RejectBookingDto,
  ) {
    return this.bookings.reject(actor, id, dto);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark the accompaniment as started' })
  start(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookings.start(actor, id);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark the accompaniment as finished' })
  complete(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookings.complete(actor, id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a booking that has not finished' })
  cancel(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(cancelBookingSchema)) dto: CancelBookingDto,
  ) {
    return this.bookings.cancel(actor, id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/payment')
  @ApiOperation({ summary: 'Record offline settlement (admin)' })
  updatePayment(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updatePaymentSchema)) dto: UpdatePaymentDto,
  ) {
    return this.bookings.updatePayment(adminId, id, dto);
  }
}
