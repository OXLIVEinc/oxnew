/**
 * src/lib/api/hotelRoomTypes.ts
 * -------------------------------------------------------------------------
 */
import { api } from "./http";
import type { HotelRoomType, RoomTypeInput } from "./hotelTypes";

export async function fetchRoomTypes(): Promise<HotelRoomType[]> {
  const { data } = await api.get<{ roomTypes: HotelRoomType[] }>("/hotel/room-types");
  return data.roomTypes;
}

export async function createRoomType(input: RoomTypeInput): Promise<HotelRoomType> {
  const { data } = await api.post<{ roomType: HotelRoomType }>("/hotel/room-types", input);
  return data.roomType;
}

export async function updateRoomType(id: string, patch: Partial<RoomTypeInput>): Promise<HotelRoomType> {
  const { data } = await api.patch<{ roomType: HotelRoomType }>(`/hotel/room-types/${id}`, patch);
  return data.roomType;
}

export async function deleteRoomType(id: string): Promise<void> {
  await api.delete(`/hotel/room-types/${id}`);
}
