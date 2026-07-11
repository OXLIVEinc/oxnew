/**
 * server/lib/socket.ts
 * -------------------------------------------------------------------------
 * Single Socket.IO instance for the whole server. Hotel Partner Dashboard
 * clients connect here, authenticate with their Supabase access token, and
 * are placed into a room scoped to their own profile id: `hotel:<profileId>`.
 * Every hotel event is emitted only into that room — nothing is ever
 * broadcast to all connected clients.
 * -------------------------------------------------------------------------
 */
import type { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { eq } from "drizzle-orm";
import { db } from "@/config/database";
import { profiles, userRoles } from "@shared/schema";
import { supabaseAdmin } from "@/supabase/admin";
import { env } from "@/config/env";

let io: SocketIOServer | null = null;

interface AuthedSocket extends Socket {
  profileId?: string;
}

/** Room name a given hotel partner's dashboard sockets join. */
export function hotelRoom(profileId: string): string {
  return `hotel:${profileId}`;
}

export type HotelSocketEvent =
  | "hotel.booking.created"
  | "hotel.booking.updated"
  | "hotel.booking.confirmed"
  | "hotel.booking.declined"
  | "hotel.booking.completed"
  | "hotel.booking.cancelled"
  | "hotel.notification.created";

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS,
      credentials: true,
    },
  });

  // Authenticate every socket connection before it's allowed to join a room.
  io.use(async (socket: AuthedSocket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ||
        socket.handshake.headers.authorization?.toString().replace(/^Bearer\s+/i, "");

      if (!token) return next(new Error("Missing auth token"));

      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !data.user) return next(new Error("Invalid or expired session"));

      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, data.user.id))
        .limit(1);

      if (!profile) return next(new Error("No profile found for this account"));

      const roleRows = await db
        .select({ role: userRoles.role })
        .from(userRoles)
        .where(eq(userRoles.userId, profile.id));

      const roles = roleRows.map((r) => r.role);
      if (!roles.includes("hotel_partner") && !roles.includes("admin")) {
        return next(new Error("Not authorized for hotel partner realtime updates"));
      }

      socket.profileId = profile.id;
      next();
    } catch (err) {
      next(err instanceof Error ? err : new Error("Socket authentication failed"));
    }
  });

  io.on("connection", (socket: AuthedSocket) => {
    if (socket.profileId) {
      socket.join(hotelRoom(socket.profileId));
    }
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

/** Emits an event only to sockets belonging to the given hotel partner (by profile id). Never throws. */
export function emitToHotel(profileId: string, event: HotelSocketEvent, payload: unknown): void {
  try {
    io?.to(hotelRoom(profileId)).emit(event, payload);
  } catch (err) {
    console.error("[socket] emitToHotel failed", event, err);
  }
}
