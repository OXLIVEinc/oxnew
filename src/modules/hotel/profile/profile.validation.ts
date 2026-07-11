/**
 * server/modules/hotel/profile/profile.validation.ts
 * -------------------------------------------------------------------------
 */
import { z } from "zod";

export const updateHotelProfileSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(4000).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  address: z.string().trim().min(1).max(300).optional(),
  state: z.string().trim().min(1).max(100).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  whatsappNumber: z.string().trim().min(7).max(20).optional(),
  amenities: z.array(z.string().trim().min(1).max(60)).max(50).optional(),
  bankAccountDetails: z
    .object({
      bankName: z.string().trim().min(1).max(120),
      accountNumber: z.string().trim().min(6).max(20),
      accountName: z.string().trim().min(1).max(160),
    })
    .optional()
    .nullable(),
  locationLat: z.coerce.number().min(-90).max(90).optional(),
  locationLng: z.coerce.number().min(-180).max(180).optional(),
});
