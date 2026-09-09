import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const googleLoginSchema = z.object({
  idToken: z.string().min(20),
});

export const onboardingSchema = z.object({
  // ADMIN is intentionally not a self-selectable role.
  role: z.nativeEnum(UserRole).refine((role) => role !== UserRole.ADMIN, 'Choose Jamaah or Mutawif'),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(8).max(20).optional(),
  city: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(1000).optional(),
  languages: z.array(z.string().trim().min(2).max(20)).max(8).optional(),
  yearsExperience: z.number().int().min(0).max(60).optional(),
});

export const devLoginSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(80).optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20),
});

export type GoogleLoginDto = z.infer<typeof googleLoginSchema>;
export type OnboardingDto = z.infer<typeof onboardingSchema>;
export type DevLoginDto = z.infer<typeof devLoginSchema>;
export type RefreshDto = z.infer<typeof refreshSchema>;

// Swagger-only shapes. Zod owns validation; these describe the contract.
export class GoogleLoginBody {
  @ApiProperty({ description: 'The ID token returned by Google Sign-In on the client' })
  idToken!: string;
}

export class OnboardingBody {
  @ApiProperty({ enum: [UserRole.JAMAAH, UserRole.MUTAWIF] })
  role!: UserRole;

  @ApiProperty({ example: 'Ahmad Fauzi' })
  name!: string;

  @ApiProperty({ required: false, example: '+628123456789' })
  phone?: string;

  @ApiProperty({ example: 'Surabaya' })
  city!: string;

  @ApiProperty({ required: false, example: 'Siap membantu jamaah dengan aman dan nyaman.' })
  bio?: string;

  @ApiProperty({ required: false, example: ['id', 'ar'] })
  languages?: string[];

  @ApiProperty({ required: false, example: 2 })
  yearsExperience?: number;
}

export class DevLoginBody {
  @ApiProperty({ example: 'ahmad@example.com' })
  email!: string;

  @ApiProperty({ required: false, example: 'Ahmad Fauzi' })
  name?: string;

  @ApiProperty({ required: false, enum: UserRole, description: 'Only honoured on first creation' })
  role?: UserRole;
}

export class RefreshBody {
  @ApiProperty()
  refreshToken!: string;
}
