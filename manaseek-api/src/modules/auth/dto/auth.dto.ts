import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const googleLoginSchema = z.object({
  idToken: z.string().min(20),
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
export type DevLoginDto = z.infer<typeof devLoginSchema>;
export type RefreshDto = z.infer<typeof refreshSchema>;

// Swagger-only shapes. Zod owns validation; these describe the contract.
export class GoogleLoginBody {
  @ApiProperty({ description: 'The ID token returned by Google Sign-In on the client' })
  idToken!: string;
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
