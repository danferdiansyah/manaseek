import { z } from 'zod';
import {
  AvailabilityStatus,
  MutawifDocumentType,
  ServiceType,
  VerificationStatus,
} from '@prisma/client';
import { paginationSchema } from '@/common/dto/pagination.dto';

export const applySchema = z.object({
  bio: z.string().min(20).max(1000),
  languages: z.array(z.string().min(2).max(20)).min(1).max(8),
  yearsExperience: z.number().int().min(0).max(60),
  city: z.string().min(2).max(80),
});

export const updateMutawifSchema = applySchema.partial();

export const addDocumentSchema = z.object({
  type: z.nativeEnum(MutawifDocumentType),
  fileUrl: z.string().url(),
});

export const setRatesSchema = z.object({
  rates: z
    .array(
      z.object({
        serviceType: z.nativeEnum(ServiceType),
        hourlyRate: z.number().positive().max(100_000_000),
        active: z.boolean().default(true),
      }),
    )
    .min(1)
    .max(3),
});

export const setSlotsSchema = z.object({
  slots: z
    .array(
      z
        .object({
          dayOfWeek: z.number().int().min(0).max(6),
          startMinute: z.number().int().min(0).max(1439),
          endMinute: z.number().int().min(1).max(1440),
        })
        .refine((slot) => slot.endMinute > slot.startMinute, {
          message: 'endMinute must be after startMinute',
          path: ['endMinute'],
        }),
    )
    .max(50),
});

export const updateAvailabilitySchema = z.object({
  status: z.nativeEnum(AvailabilityStatus),
});

export const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const reviewApplicationSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGES']),
  note: z.string().max(500).optional(),
});

export const listMutawifSchema = paginationSchema.extend({
  verificationStatus: z.nativeEnum(VerificationStatus).optional(),
  city: z.string().max(80).optional(),
  search: z.string().min(2).max(80).optional(),
});

export const nearbySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().positive().optional(),
  serviceType: z.nativeEnum(ServiceType).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ApplyDto = z.infer<typeof applySchema>;
export type UpdateMutawifDto = z.infer<typeof updateMutawifSchema>;
export type AddDocumentDto = z.infer<typeof addDocumentSchema>;
export type SetRatesDto = z.infer<typeof setRatesSchema>;
export type SetSlotsDto = z.infer<typeof setSlotsSchema>;
export type UpdateAvailabilityDto = z.infer<typeof updateAvailabilitySchema>;
export type UpdateLocationDto = z.infer<typeof updateLocationSchema>;
export type ReviewApplicationDto = z.infer<typeof reviewApplicationSchema>;
export type ListMutawifDto = z.infer<typeof listMutawifSchema>;
export type NearbyDto = z.infer<typeof nearbySchema>;
