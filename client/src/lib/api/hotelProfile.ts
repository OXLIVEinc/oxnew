/**
 * src/lib/api/hotelProfile.ts
 * -------------------------------------------------------------------------
 */
import { api } from "./http";
import type { HotelProfile, HotelProfileInput } from "./hotelTypes";

export async function fetchHotelProfile(): Promise<HotelProfile> {
  const { data } = await api.get<{ hotel: HotelProfile }>("/hotel/profile");
  return data.hotel;
}

export async function updateHotelProfile(patch: HotelProfileInput): Promise<HotelProfile> {
  const { data } = await api.patch<{ hotel: HotelProfile }>("/hotel/profile", patch);
  return data.hotel;
}
