/**
 * src/lib/api/guest.ts
 * Request functions for /api/guest
 * -------------------------------------------------------------------------
 */
import { api } from "./http";
import type { GuestRegisteredEvent, GuestTicket } from "./types";

export type RegisteredEventsFilter = "upcoming" | "past" | "all";

export async function fetchMyRegisteredEvents(filter: RegisteredEventsFilter = "all") {
  const { data } = await api.get<{ events: GuestRegisteredEvent[] }>("/guest/events", { params: { filter } });
  return data.events;
}

export async function fetchMyTickets() {
  const { data } = await api.get<{ tickets: GuestTicket[] }>("/guest/tickets");
  return data.tickets;
}
