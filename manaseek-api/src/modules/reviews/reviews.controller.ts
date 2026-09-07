import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import {
  createReviewSchema,
  listReviewsSchema,
  updateReviewSchema,
  type CreateReviewDto,
  type ListReviewsDto,
  type UpdateReviewDto,
} from './dto/reviews.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@ApiBearerAuth('access-token')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Reviews for a mutawif' })
  list(@Query(new ZodValidationPipe(listReviewsSchema)) query: ListReviewsDto) {
    return this.reviews.listForMutawif(query);
  }

  @Post()
  @ApiOperation({ summary: 'Rate a completed booking' })
  create(
    @CurrentUser('id') jamaahId: string,
    @Body(new ZodValidationPipe(createReviewSchema)) dto: CreateReviewDto,
  ) {
    return this.reviews.create(jamaahId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit your own review within 7 days' })
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateReviewSchema)) dto: UpdateReviewDto,
  ) {
    return this.reviews.update(actor, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a review (author or admin)' })
  remove(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.reviews.remove(actor, id);
  }
}
