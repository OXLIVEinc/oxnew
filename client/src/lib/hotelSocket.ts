/**
 * src/lib/hotelSocket.ts
 * -------------------------------------------------------------------------
 * One Socket.IO client connection, created lazily and reused for the
 * lifetime of the tab. The server places this socket into a room scoped to
 * the signed-in hotel partner's profile id (see server/lib/socket.ts), so
 * every event received here already belongs to this hotel only.
 * -------------------------------------------------------------------------
 */
import { io, type Socket } from "socket.io-client";
import { supabase } from "@/integrations/supabase/client";

let socket: Socket | null = null;
let connecting: Promise<Socket> | null = null;

function socketUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
  return apiUrl.replace(/\/api\/?$/, "");
}

export async function getHotelSocket(): Promise<Socket> {
  if (socket?.connected) return socket;
  if (connecting) return connecting;

  connecting = (async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (socket) {
      socket.auth = { token };
      socket.connect();
      return socket;
    }

    socket = io(socketUrl(), {
      auth: { token },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
    return socket;
  })();

  try {
    return await connecting;
  } finally {
    connecting = null;
  }
}

export function disconnectHotelSocket(): void {
  socket?.disconnect();
  socket = null;
}
