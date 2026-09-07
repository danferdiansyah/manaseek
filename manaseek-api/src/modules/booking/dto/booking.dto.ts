import { z } from 'zod';
import { BookingStatus, PaymentStatus, ServiceType } from '@prisma/client';
import { paginationSchema } from '@/common/dto/pagination.dto';

export const createBookingSchema = z.object({
  mutawifId: z.string().uuid(),
  serviceType: z.nativeEnum(ServiceType),
  scheduledStartAt: z.coerce.date(),
  durationHours: z.number().int().min(1).max(12),
  meetingPointLabel: z.string().min(3).max(160),
  meetingLatitude: z.number().min(-90).max(90).optional(),
  meetingLongitude: z.number().min(-180).max(180).optional(),
  notes: z.string().max(500).optional(),
});

export const listBookingsSchema = paginationSchema.extend({
  status: z.nativeEnum(BookingStatus).optional(),
  // Admin only; other roles are always scoped to their own bookings.
  mutawifId: z.string().uuid().optional(),
  jamaahId: z.string().uuid().optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(3).max(255),
});

export const rejectBookingSchema = z.object({
  reason: z.string().max(255).optional(),
});

export const updatePaymentSchema = z.object({
  paymentStatus: z.nativeEnum(PaymentStatus),
  note: z.string().max(255).optional(),
});

export type CreateBookingDto = z.infer<typeof createBookingSchema>;
export type ListBookingsDto = z.infer<typeof listBookingsSchema>;
export type CancelBookingDto = z.infer<typeof cancelBookingSchema>;
export type RejectBookingDto = z.infer<typeof rejectBookingSchema>;
export type UpdatePaymentDto = z.infer<typeof updatePaymentSchema>;
