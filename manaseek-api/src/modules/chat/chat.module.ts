import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AiAccessGuard } from './ai-access.guard';
import { ChatAnswerProvider } from './chat-answer.provider';
import { OpenRouterAnswerProvider } from './openrouter.provider';

@Module({
  controllers: [ChatController],
  providers: [ChatService, AiAccessGuard, { provide: ChatAnswerProvider, useClass: OpenRouterAnswerProvider }],
})
export class ChatModule {}
