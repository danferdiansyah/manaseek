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
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import {
  addDocumentSchema,
  applySchema,
  listMutawifSchema,
  nearbySchema,
  reviewApplicationSchema,
  setRatesSchema,
  setSlotsSchema,
  updateAvailabilitySchema,
  updateLocationSchema,
  updateMutawifSchema,
  type AddDocumentDto,
  type ApplyDto,
  type ListMutawifDto,
  type NearbyDto,
  type ReviewApplicationDto,
  type SetRatesDto,
  type SetSlotsDto,
  type UpdateAvailabilityDto,
  type UpdateLocationDto,
  type UpdateMutawifDto,
} from './dto/mutawif.dto';
import { MutawifService } from './mutawif.service';

@ApiTags('mutawif')
@ApiBearerAuth('access-token')
@Controller('mutawif')
export class MutawifController {
  constructor(private readonly mutawif: MutawifService) {}

  @Get('nearby')
  @ApiOperation({ summary: 'Verified mutawif who are online near a point' })
  nearby(@Query(new ZodValidationPipe(nearbySchema)) query: NearbyDto) {
    return this.mutawif.findNearby(query);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Start a mutawif application for the current user' })
  apply(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(applySchema)) dto: ApplyDto,
  ) {
    return this.mutawif.apply(userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Own mutawif profile including documents, rates and schedule' })
  getOwn(@CurrentUser('id') userId: string) {
    return this.mutawif.getOwn(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own mutawif details' })
  updateOwn(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(updateMutawifSchema)) dto: UpdateMutawifDto,
  ) {
    return this.mutawif.updateOwn(userId, dto);
  }

  @Post('me/documents')
  @ApiOperation({ summary: 'Attach a verification document' })
  addDocument(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(addDocumentSchema)) dto: AddDocumentDto,
  ) {
    return this.mutawif.addDocument(userId, dto);
  }

  @Delete('me/documents/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a verification document' })
  deleteDocument(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.mutawif.deleteDocument(userId, id);
  }

  @Post('me/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit the application for verification' })
  submit(@CurrentUser('id') userId: string) {
    return this.mutawif.submitForReview(userId);
  }

  @Put('me/rates')
  @ApiOperation({ summary: 'Set hourly rates per service type' })
  setRates(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(setRatesSchema)) dto: SetRatesDto,
  ) {
    return this.mutawif.setRates(userId, dto);
  }

  @Put('me/slots')
  @ApiOperation({ summary: 'Replace the weekly availability schedule' })
  setSlots(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(setSlotsSchema)) dto: SetSlotsDto,
  ) {
    return this.mutawif.setSlots(userId, dto);
  }

  @Patch('me/availability')
  @ApiOperation({ summary: 'Go online, busy or offline' })
  updateAvailability(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(updateAvailabilitySchema)) dto: UpdateAvailabilityDto,
  ) {
    return this.mutawif.updateAvailability(userId, dto);
  }

  @Patch('me/location')
  @ApiOperation({ summary: 'Report the current location' })
  updateLocation(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(updateLocationSchema)) dto: UpdateLocationDto,
  ) {
    return this.mutawif.updateLocation(userId, dto);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  @ApiOperation({ summary: 'List mutawif applications (admin)' })
  list(@Query(new ZodValidationPipe(listMutawifSchema)) query: ListMutawifDto) {
    return this.mutawif.list(query);
  }

  @Roles(UserRole.ADMIN)
  @Post(':id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve, reject or reopen an application (admin)' })
  review(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(reviewApplicationSchema)) dto: ReviewApplicationDto,
  ) {
    return this.mutawif.reviewApplication(adminId, id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Public profile of a verified mutawif' })
  getPublic(@Param('id', ParseUUIDPipe) id: string) {
    return this.mutawif.getPublicProfile(id);
  }
}
