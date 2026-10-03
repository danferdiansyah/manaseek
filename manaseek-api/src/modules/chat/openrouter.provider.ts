import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@/common/config/config.service';
import { AiProviderError, ChatAnswerProvider, type ChatAnswerRequest } from './chat-answer.provider';
import { OpenRouterClient } from './openrouter.client';

@Injectable()
export class OpenRouterAnswerProvider extends ChatAnswerProvider {
  constructor(private readonly config: AppConfigService) { super(); }

  ensureConfigured(): void {
    if (!this.config.get('OPENROUTER_API_KEY')) throw new AiProviderError('configuration');
  }

  generate(request: ChatAnswerRequest) {
    this.ensureConfigured();
    return OpenRouterClient.generateAnswer({
      ...request,
      apiKey: this.config.get('OPENROUTER_API_KEY')!,
      model: this.config.get('OPENROUTER_MODEL'),
    });
  }
}
