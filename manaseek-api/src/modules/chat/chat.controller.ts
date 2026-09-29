import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { PaginationDto } from '@/common/dto/pagination.dto';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { ChatService } from './chat.service';
import { chatMessagesQuerySchema, chatSessionsQuerySchema, sendMessageSchema, type SendMessageDto } from './dto/chat.dto';

@ApiTags('chat')
@ApiBearerAuth('access-token')
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('sessions')
  @ApiOperation({ summary: 'Paginated chat history for the current user, newest activity first' })
  listSessions(
    @CurrentUser('id') userId: string,
    @Query(new ZodValidationPipe(chatSessionsQuerySchema)) query: PaginationDto,
  ) {
    return this.chat.listSessions(userId, query);
  }

  @Get('sessions/:id/messages')
  @ApiOperation({ summary: 'Messages in an owned session; page 1 contains the latest messages in chronological order' })
  getMessages(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query(new ZodValidationPipe(chatMessagesQuerySchema)) query: PaginationDto,
  ) {
    return this.chat.getMessages(userId, id, query);
  }

  // Each answer costs a model call, so the limit is per user, not per IP.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ask the assistant; creates a session when none is given' })
  sendMessage(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(sendMessageSchema)) dto: SendMessageDto,
  ) {
    return this.chat.sendMessage(userId, dto);
  }
}
