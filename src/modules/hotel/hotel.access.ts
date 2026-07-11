/**
 * server/modules/hotel/hotel.access.ts
 * -------------------------------------------------------------------------
 * Every hotel-dashboard endpoint needs to answer one question first: "which
 * hotel does this signed-in profile own?" Centralizing that here means a
 * hotel partner can never accidentally (or otherwise) read or mutate
 * another hotel's data — every module in modules/hotel/* resolves the
 * hotel id through this helper instead of trusting a hotelId from the
 * request.
 * -------------------------------------------------------------------------
 */
import { eq } from "drizzle-orm";
import { db } from "@/config/database";
import { hotelPartners, type HotelPartner } from "@shared/schema";
import { AppError } from "@/middleware/error.middleware";

export async function getHotelForProfile(profileId: string): Promise<HotelPartner> {
  const [hotel] = await db
    .select()
    .from(hotelPartners)
    .where(eq(hotelPartners.userId, profileId))
    .limit(1);

  if (!hotel) {
    throw AppError.forbidden("No hotel partner account is linked to this profile");
  }

  return hotel;
}

export async function getHotelIdForProfile(profileId: string): Promise<string> {
  const hotel = await getHotelForProfile(profileId);
  return hotel.id;
}
