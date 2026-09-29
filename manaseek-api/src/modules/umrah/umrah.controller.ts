import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { paginationSchema, type PaginationDto } from '@/common/dto/pagination.dto';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { createUmrahOrderSchema, type CreateUmrahOrderDto } from './dto/umrah.dto';
import { UmrahService } from './umrah.service';

@ApiTags('umrah')
@ApiBearerAuth('access-token')
@Controller('umrah')
export class UmrahController {
  constructor(private readonly umrah: UmrahService) {}

  @Get('packages')
  @ApiOperation({ summary: 'Demo umrah packages with future departures' })
  listPackages() { return this.umrah.listPackages(); }

  @Get('packages/:slug')
  @ApiOperation({ summary: 'Flights, hotels, itinerary and prices for a demo package' })
  getPackage(@Param('slug') slug: string) { return this.umrah.getPackage(slug); }

  @Get('orders')
  @ApiOperation({ summary: 'Paginated umrah orders owned by the authenticated user' })
  listOrders(@CurrentUser('id') userId: string, @Query(new ZodValidationPipe(paginationSchema)) query: PaginationDto) {
    return this.umrah.listOrders(userId, query);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Owned order with package snapshot, travelers and dummy receipt' })
  getOrder(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.umrah.getOrder(userId, id);
  }

  @Post('orders')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Atomically reserve demo seats and save an immediately successful dummy payment' })
  createOrder(@CurrentUser('id') userId: string, @Body(new ZodValidationPipe(createUmrahOrderSchema)) dto: CreateUmrahOrderDto) {
    return this.umrah.createOrder(userId, dto);
  }
}
