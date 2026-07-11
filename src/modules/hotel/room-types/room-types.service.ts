/**
 * server/modules/hotel/room-types/room-types.service.ts
 * -------------------------------------------------------------------------
 */
import { eq } from "drizzle-orm";
import { db } from "@/config/database";
import { hotelRoomTypes } from "@shared/schema";
import { AppError } from "@/middleware/error.middleware";
import { getHotelIdForProfile } from "../hotel.access";
import * as repo from "./room-types.repository";

function serialize(
  room: typeof hotelRoomTypes.$inferSelect,
  occupied: number,
  upcoming: number
) {
  const available = Math.max(0, room.quantity - occupied);
  return {
    id: room.id,
    hotelId: room.hotelId,
    name: room.name,
    description: room.description,
    pricePerNight: room.pricePerNight,
    capacity: room.capacity,
    quantity: room.quantity,
    sortOrder: room.sortOrder,
    createdAt: room.createdAt,
    occupied,
    available,
    upcomingBookings: upcoming,
    occupancyRate: room.quantity > 0 ? Math.round((occupied / room.quantity) * 100) : 0,
  };
}

export async function listRoomTypes(profileId: string) {
  const hotelId = await getHotelIdForProfile(profileId);
  const rooms = await repo.listRoomTypes(hotelId);
  const ids = rooms.map((r) => r.id);
  const [occupancy, upcoming] = await Promise.all([
    repo.occupancyByRoomType(ids),
    repo.upcomingByRoomType(ids),
  ]);
  return rooms.map((r) => serialize(r, occupancy[r.id] ?? 0, upcoming[r.id] ?? 0));
}

export interface RoomTypeInput {
  name: string;
  description?: string | null;
  pricePerNight: number;
  capacity?: number;
  quantity?: number;
}

export async function createRoomType(profileId: string, input: RoomTypeInput) {
  const hotelId = await getHotelIdForProfile(profileId);

  const [row] = await db
    .insert(hotelRoomTypes)
    .values({
      hotelId,
      name: input.name,
      description: input.description ?? null,
      pricePerNight: String(input.pricePerNight),
      capacity: input.capacity ?? 2,
      quantity: input.quantity ?? 10,
    })
    .returning();

  return serialize(row, 0, 0);
}

export async function updateRoomType(profileId: string, roomTypeId: string, patch: Partial<RoomTypeInput>) {
  const hotelId = await getHotelIdForProfile(profileId);
  const existing = await repo.getRoomType(hotelId, roomTypeId);
  if (!existing) throw AppError.notFound("Room type not found");

  const [updated] = await db
    .update(hotelRoomTypes)
    .set({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.description !== undefined && { description: patch.description }),
      ...(patch.pricePerNight !== undefined && { pricePerNight: String(patch.pricePerNight) }),
      ...(patch.capacity !== undefined && { capacity: patch.capacity }),
      ...(patch.quantity !== undefined && { quantity: patch.quantity }),
    })
    .where(eq(hotelRoomTypes.id, roomTypeId))
    .returning();

  const [occupancy, upcoming] = await Promise.all([
    repo.occupancyByRoomType([roomTypeId]),
    repo.upcomingByRoomType([roomTypeId]),
  ]);

  return serialize(updated, occupancy[roomTypeId] ?? 0, upcoming[roomTypeId] ?? 0);
}

export async function deleteRoomType(profileId: string, roomTypeId: string) {
  const hotelId = await getHotelIdForProfile(profileId);
  const existing = await repo.getRoomType(hotelId, roomTypeId);
  if (!existing) throw AppError.notFound("Room type not found");

  const hasActive = await repo.hasActiveBookings(roomTypeId);
  if (hasActive) {
    throw AppError.conflict("This room type has active bookings and cannot be deleted");
  }

  await db.delete(hotelRoomTypes).where(eq(hotelRoomTypes.id, roomTypeId));
  return { id: roomTypeId };
}
