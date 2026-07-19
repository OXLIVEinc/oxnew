/**
 * server/modules/hotel/profile/profile.service.ts
 * -------------------------------------------------------------------------
 */
import { eq } from "drizzle-orm";
import { db } from "@/config/database";
import { hotelPartners } from "@shared/schema";
import { getHotelForProfile } from "../hotel.access";
import type { z } from "zod";
import type { updateHotelProfileSchema } from "./profile.validation";

type ProfilePatch = z.infer<typeof updateHotelProfileSchema>;

export async function getProfile(profileId: string) {
  return getHotelForProfile(profileId);
}

export async function updateProfile(profileId: string, patch: ProfilePatch) {
  const hotel = await getHotelForProfile(profileId);

  const [updated] = await db
    .update(hotelPartners)
    .set({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.country !== undefined && { country: patch.country }),
      ...(patch.description !== undefined && { description: patch.description }),
      ...(patch.logoUrl !== undefined && { logoUrl: patch.logoUrl }),
      ...(patch.coverImageUrl !== undefined && { coverImageUrl: patch.coverImageUrl }),
      ...(patch.address !== undefined && { address: patch.address }),
      ...(patch.state !== undefined && { state: patch.state }),
      ...(patch.city !== undefined && { city: patch.city }),
      ...(patch.whatsappNumber !== undefined && { whatsappNumber: patch.whatsappNumber }),
      ...(patch.amenities !== undefined && { amenities: patch.amenities }),
      ...(patch.bankAccountDetails !== undefined && { bankAccountDetails: patch.bankAccountDetails }),
      ...(patch.locationLat !== undefined && { locationLat: String(patch.locationLat) }),
      ...(patch.locationLng !== undefined && { locationLng: String(patch.locationLng) }),
      updatedAt: new Date(),
    })
    .where(eq(hotelPartners.id, hotel.id))
    .returning();

  return updated;
}
