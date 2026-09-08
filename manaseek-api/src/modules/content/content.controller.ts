import { Body, Controller, Get, Param, ParseUUIDPipe, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { ContentService } from './content.service';
import {
  listTopicsSchema,
  toggleChecklistSchema,
  type ListTopicsDto,
  type ToggleChecklistDto,
} from './dto/content.dto';

@ApiTags('content')
@ApiBearerAuth('access-token')
@Controller('content')
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('topics')
  @ApiOperation({ summary: 'Guidance topics, filtered by category, phase or search' })
  listTopics(@Query(new ZodValidationPipe(listTopicsSchema)) query: ListTopicsDto) {
    return this.content.listTopics(query);
  }

  @Get('topics/:slug')
  @ApiOperation({ summary: 'One guidance topic with its steps, prayers and prohibitions' })
  getTopic(@Param('slug') slug: string) {
    return this.content.getTopic(slug);
  }

  @Get('prayers')
  @ApiOperation({ summary: 'Standalone prayer collection' })
  listPrayers() {
    return this.content.listPrayers();
  }

  @Get('checklist')
  @ApiOperation({ summary: 'Departure checklist with this jamaah progress' })
  getChecklist(@CurrentUser('id') userId: string) {
    return this.content.getChecklist(userId);
  }

  @Put('checklist/:itemId')
  @ApiOperation({ summary: 'Tick or untick one checklist item' })
  setChecklistItem(
    @CurrentUser('id') userId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body(new ZodValidationPipe(toggleChecklistSchema)) dto: ToggleChecklistDto,
  ) {
    return this.content.setChecklistItem(userId, itemId, dto.completed);
  }
}
