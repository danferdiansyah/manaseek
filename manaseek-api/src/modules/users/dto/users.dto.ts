import { z } from 'zod';
import {
  Gender,
  MobilityNeed,
  TravelDocumentType,
  TripStatus,
  TripType,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { paginationSchema } from '@/common/dto/pagination.dto';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected an ISO date (YYYY-MM-DD)');

export const updateAccountSchema = z
  .object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    avatarUrl: z.string().url(),
  })
  .partial();

export const updateProfileSchema = z
  .object({
    gender: z.nativeEnum(Gender),
    birthDate: isoDate,
    address: z.string().max(255),
    city: z.string().max(80),
    province: z.string().max(80),
    emergencyContactName: z.string().max(80),
    emergencyContactPhone: z.string().min(8).max(20),
    mobilityNeed: z.nativeEnum(MobilityNeed),
    medicalNotes: z.string().max(1000),
    preferredLanguage: z.enum(['id', 'en', 'ar']),
  })
  .partial();

export const createDocumentSchema = z.object({
  type: z.nativeEnum(TravelDocumentType),
  number: z.string().max(60).optional(),
  issuedAt: isoDate.optional(),
  expiresAt: isoDate.optional(),
  fileUrl: z.string().url().optional(),
});

export const updateDocumentSchema = createDocumentSchema.partial();

export const createTripSchema = z
  .object({
    type: z.nativeEnum(TripType),
    packageName: z.string().max(120).optional(),
    agencyName: z.string().max(120).optional(),
    groupCode: z.string().max(40).optional(),
    departureDate: isoDate,
    returnDate: isoDate.optional(),
  })
  .refine(
    (value) => !value.returnDate || value.returnDate >= value.departureDate,
    { message: 'returnDate must be on or after departureDate', path: ['returnDate'] },
  );

export const updateTripSchema = z
  .object({
    packageName: z.string().max(120),
    agencyName: z.string().max(120),
    groupCode: z.string().max(40),
    departureDate: isoDate,
    returnDate: isoDate,
    status: z.nativeEnum(TripStatus),
  })
  .partial();

export const listUsersSchema = paginationSchema.extend({
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  search: z.string().min(2).max(80).optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
  reason: z.string().max(255).optional(),
});

export type UpdateAccountDto = z.infer<typeof updateAccountSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type CreateDocumentDto = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentDto = z.infer<typeof updateDocumentSchema>;
export type CreateTripDto = z.infer<typeof createTripSchema>;
export type UpdateTripDto = z.infer<typeof updateTripSchema>;
export type ListUsersDto = z.infer<typeof listUsersSchema>;
export type UpdateUserStatusDto = z.infer<typeof updateUserStatusSchema>;
