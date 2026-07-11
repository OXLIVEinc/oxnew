/**
 * server/modules/hotel/room-types/room-types.validation.ts
 * -------------------------------------------------------------------------
 */
import { z } from "zod";

export const createRoomTypeSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().nullable(),
  pricePerNight: z.coerce.number().positive(),
  capacity: z.coerce.number().int().min(1).max(50).default(2),
  quantity: z.coerce.number().int().min(0).max(1000).default(10),
});

export const updateRoomTypeSchema = createRoomTypeSchema.partial();
