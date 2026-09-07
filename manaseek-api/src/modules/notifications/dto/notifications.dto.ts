import { z } from 'zod';
import { DevicePlatform } from '@prisma/client';
import { paginationSchema } from '@/common/dto/pagination.dto';

export const registerDeviceSchema = z.object({
  token: z.string().min(20).max(512),
  platform: z.nativeEnum(DevicePlatform),
});

export const unregisterDeviceSchema = z.object({
  token: z.string().min(20).max(512),
});

export const listNotificationsSchema = paginationSchema;

export type RegisterDeviceDto = z.infer<typeof registerDeviceSchema>;
export type UnregisterDeviceDto = z.infer<typeof unregisterDeviceSchema>;
export type ListNotificationsDto = z.infer<typeof listNotificationsSchema>;
