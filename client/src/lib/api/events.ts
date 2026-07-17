/**
 * src/lib/api/events.ts
 * -------------------------------------------------------------------------
 * Request functions for /api/events. Consumed by src/hooks/api/useEvents.ts
 * — components should use the hooks, not these directly.
 * -------------------------------------------------------------------------
 */
import { api } from "./http";
import type { CreateEventPayload, EventDetail, EventSummary, TicketTier } from "./types";

// src/lib/api/events.ts
export async function fetchEvents(params?: {
  q?: string;
  genre?: string;
  ageGroup?: string;
  page?: number;
  limit?: number;
}) {
  const { data } = await api.get<{ 
    events: EventSummary[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>("/events", { params });
  return data;
}

export async function fetchEvent(id: string) {
  const { data } = await api.get<{ event: EventDetail }>(`/events/${id}`);
  return data.event;
}

export async function fetchMyOrganizerEvents() {
  const { data } = await api.get<{ events: EventSummary[] }>("/events/mine");
  return data.events;
}

export async function createEvent(payload: CreateEventPayload) {
  const { data } = await api.post<{ event: EventSummary; ticketTiers: TicketTier[] }>("/events", payload);
  return data;
}

export async function updateEvent(id: string, patch: Partial<CreateEventPayload>) {
  const { data } = await api.patch<{ event: EventSummary }>(`/events/${id}`, patch);
  return data.event;
}

export async function toggleEventLike(id: string) {
  const { data } = await api.post<{ liked: boolean; likeCount: number }>(`/events/${id}/like`);
  return data;
}

export async function deleteEvent(id: string) {
  await api.delete(`/events/${id}`);
}
