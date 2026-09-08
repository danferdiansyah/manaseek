import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { ChatService } from './chat.service';
import { sendMessageSchema, type SendMessageDto } from './dto/chat.dto';

@ApiTags('chat')
@ApiBearerAuth('access-token')
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('sessions')
  @ApiOperation({ summary: 'Recent chat sessions for the current user' })
  listSessions(@CurrentUser('id') userId: string) {
    return this.chat.listSessions(userId);
  }

  @Get('sessions/:id/messages')
  @ApiOperation({ summary: 'Messages in one chat session' })
  getMessages(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.chat.getMessages(userId, id);
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
