/**
 * src/lib/api/tickets.ts
 * Request functions for /api/tickets (organizer check-in)
 * -------------------------------------------------------------------------
 */
import { api } from "./http";

export async function checkInTicket(token: string) {
  const { data } = await api.post<{ ticket: Record<string, unknown> }>("/tickets/check-in", { token });
  return data.ticket;
}
