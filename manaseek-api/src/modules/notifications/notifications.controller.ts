import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { paginate, toSkipTake } from '@/common/dto/pagination.dto';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import {
  listNotificationsSchema,
  registerDeviceSchema,
  unregisterDeviceSchema,
  type ListNotificationsDto,
  type RegisterDeviceDto,
  type UnregisterDeviceDto,
} from './dto/notifications.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Notification history for the current user' })
  async list(
    @CurrentUser('id') userId: string,
    @Query(new ZodValidationPipe(listNotificationsSchema)) query: ListNotificationsDto,
  ) {
    const { skip, take } = toSkipTake(query);
    const { items, total } = await this.notifications.listForUser(userId, skip, take);

    return paginate(items, total, query);
  }

  @Post('devices')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Register a push device token' })
  register(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(registerDeviceSchema)) dto: RegisterDeviceDto,
  ) {
    return this.notifications.registerDevice(userId, dto.token, dto.platform);
  }

  @Delete('devices')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a push device token on logout' })
  unregister(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(unregisterDeviceSchema)) dto: UnregisterDeviceDto,
  ) {
    return this.notifications.unregisterDevice(userId, dto.token);
  }
}
