import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const requestOtpSchema = z.object({
  phone: z.string().min(8).max(20),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(8).max(20),
  code: z.string().regex(/^\d{4,8}$/, 'OTP code must be 4-8 digits'),
  name: z.string().min(2).max(80).optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20),
});

export type RequestOtpDto = z.infer<typeof requestOtpSchema>;
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
export type RefreshDto = z.infer<typeof refreshSchema>;

// Swagger-only shapes. Zod owns validation; these describe the contract.
export class RequestOtpBody {
  @ApiProperty({ example: '081234567890', description: 'Local or E.164 phone number' })
  phone!: string;
}

export class VerifyOtpBody {
  @ApiProperty({ example: '081234567890' })
  phone!: string;

  @ApiProperty({ example: '123456' })
  code!: string;

  @ApiProperty({ required: false, example: 'Ahmad Fauzi', description: 'Set on first login' })
  name?: string;
}

export class RefreshBody {
  @ApiProperty()
  refreshToken!: string;
}
