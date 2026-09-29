import { z } from 'zod';
import { Gender, UmrahRoomType } from '@prisma/client';

export const createUmrahOrderSchema = z.object({
  requestId: z.string().uuid(),
  departureId: z.string().uuid(),
  roomType: z.nativeEnum(UmrahRoomType),
  contactName: z.string().trim().min(2).max(100),
  contactEmail: z.string().trim().email().max(254),
  contactPhone: z.string().trim().regex(/^\+?[0-9]{8,15}$/, 'Nomor telepon harus berisi 8–15 angka.'),
  travelers: z.array(z.object({
    fullName: z.string().trim().min(2).max(100),
    gender: z.nativeEnum(Gender),
    birthDate: z.string().date().refine(
      (value) => value >= '1900-01-01' && value <= new Date().toISOString().slice(0, 10),
      'Tanggal lahir tidak valid.',
    ),
  }).strict()).min(1).max(6),
  acceptDemo: z.literal(true),
}).strict();

export type CreateUmrahOrderDto = z.infer<typeof createUmrahOrderSchema>;
