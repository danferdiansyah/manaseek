import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '@/common/types/authenticated-user';
import { AuthService } from './auth.service';
import {
  DevLoginBody,
  GoogleLoginBody,
  OnboardingBody,
  RefreshBody,
  devLoginSchema,
  googleLoginSchema,
  onboardingSchema,
  refreshSchema,
  type DevLoginDto,
  type GoogleLoginDto,
  type OnboardingDto,
  type RefreshDto,
} from './dto/auth.dto';
import type { SessionContext } from './token.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a Google ID token for a session (also registers new users)' })
  @ApiBody({ type: GoogleLoginBody })
  loginWithGoogle(
    @Body(new ZodValidationPipe(googleLoginSchema)) dto: GoogleLoginDto,
    @Req() req: Request,
  ) {
    return this.auth.loginWithGoogle(dto, this.sessionContext(req));
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('dev-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mint a session from an email address (development only, requires AUTH_DEV_LOGIN)',
  })
  @ApiBody({ type: DevLoginBody })
  devLogin(
    @Body(new ZodValidationPipe(devLoginSchema)) dto: DevLoginDto,
    @Req() req: Request,
  ) {
    return this.auth.devLogin(dto, this.sessionContext(req));
  }

  @ApiBearerAuth('access-token')
  @Post('onboarding')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Choose a role and save the first-time profile details' })
  @ApiBody({ type: OnboardingBody })
  completeOnboarding(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(onboardingSchema)) dto: OnboardingDto,
    @Req() req: Request,
  ) {
    return this.auth.completeOnboarding(userId, dto, this.sessionContext(req));
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a refresh token for a new token pair' })
  @ApiBody({ type: RefreshBody })
  refresh(@Body(new ZodValidationPipe(refreshSchema)) dto: RefreshDto, @Req() req: Request) {
    return this.auth.refresh(dto.refreshToken, this.sessionContext(req));
  }

  @ApiBearerAuth('access-token')
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the presented refresh token' })
  @ApiBody({ type: RefreshBody })
  async logout(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(refreshSchema)) dto: RefreshDto,
    @Req() req: Request,
  ): Promise<void> {
    await this.auth.logout(userId, dto.refreshToken, req.ip);
  }

  @ApiBearerAuth('access-token')
  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke every session for the current user' })
  async logoutAll(@CurrentUser('id') userId: string): Promise<void> {
    await this.auth.logoutAll(userId);
  }

  @ApiBearerAuth('access-token')
  @Get('me')
  @ApiOperation({ summary: 'Current authenticated user' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.me(user.id);
  }

  private sessionContext(req: Request): SessionContext {
    return { userAgent: req.headers['user-agent'] ?? null, ipAddress: req.ip ?? null };
  }
}
