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
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import {
  createDocumentSchema,
  createTripSchema,
  listUsersSchema,
  updateAccountSchema,
  updateDocumentSchema,
  updateProfileSchema,
  updateTripSchema,
  updateUserStatusSchema,
  type CreateDocumentDto,
  type CreateTripDto,
  type ListUsersDto,
  type UpdateAccountDto,
  type UpdateDocumentDto,
  type UpdateProfileDto,
  type UpdateTripDto,
  type UpdateUserStatusDto,
} from './dto/users.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch('me')
  @ApiOperation({ summary: 'Update the current account' })
  updateAccount(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(updateAccountSchema)) dto: UpdateAccountDto,
  ) {
    return this.users.updateAccount(userId, dto);
  }

  @Get('me/profile')
  @ApiOperation({ summary: 'Jamaah profile of the current user' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.users.getProfile(userId);
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Update the jamaah profile' })
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileDto,
  ) {
    return this.users.updateProfile(userId, dto);
  }

  @Get('me/documents')
  @ApiOperation({ summary: 'List travel documents' })
  listDocuments(@CurrentUser('id') userId: string) {
    return this.users.listDocuments(userId);
  }

  @Post('me/documents')
  @ApiOperation({ summary: 'Add a travel document' })
  createDocument(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createDocumentSchema)) dto: CreateDocumentDto,
  ) {
    return this.users.createDocument(userId, dto);
  }

  @Patch('me/documents/:id')
  @ApiOperation({ summary: 'Update a travel document' })
  updateDocument(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateDocumentSchema)) dto: UpdateDocumentDto,
  ) {
    return this.users.updateDocument(userId, id, dto);
  }

  @Delete('me/documents/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a travel document' })
  deleteDocument(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.users.deleteDocument(userId, id);
  }

  @Get('me/trips')
  @ApiOperation({ summary: 'List trips' })
  listTrips(@CurrentUser('id') userId: string) {
    return this.users.listTrips(userId);
  }

  @Post('me/trips')
  @ApiOperation({ summary: 'Register a trip' })
  createTrip(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createTripSchema)) dto: CreateTripDto,
  ) {
    return this.users.createTrip(userId, dto);
  }

  @Patch('me/trips/:id')
  @ApiOperation({ summary: 'Update a trip' })
  updateTrip(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateTripSchema)) dto: UpdateTripDto,
  ) {
    return this.users.updateTrip(userId, id, dto);
  }

  @Delete('me/trips/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a trip' })
  deleteTrip(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.users.deleteTrip(userId, id);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  @ApiOperation({ summary: 'List users (admin)' })
  list(@Query(new ZodValidationPipe(listUsersSchema)) query: ListUsersDto) {
    return this.users.list(query);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate or suspend a user (admin)' })
  updateStatus(
    @CurrentUser('id') actorId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateUserStatusSchema)) dto: UpdateUserStatusDto,
  ) {
    return this.users.updateStatus(actorId, id, dto);
  }
}
