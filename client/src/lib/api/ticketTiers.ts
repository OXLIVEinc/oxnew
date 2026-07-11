/**
 * src/lib/api/ticketTiers.ts
 * Request functions for /api/events/:eventId/ticket-tiers
 * -------------------------------------------------------------------------
 */
import { api } from "./http";
import type { TicketTier, TicketTierFormValues } from "./types";

export async function fetchTicketTiers(eventId: string) {
  const { data } = await api.get<{ tiers: TicketTier[] }>(`/events/${eventId}/ticket-tiers`);
  return data.tiers;
}

export async function addTicketTier(eventId: string, input: TicketTierFormValues) {
  const { data } = await api.post<{ tier: TicketTier }>(`/events/${eventId}/ticket-tiers`, input);
  return data.tier;
}

export async function updateTicketTier(eventId: string, tierId: string, input: Partial<TicketTierFormValues>) {
  const { data } = await api.patch<{ tier: TicketTier }>(`/events/${eventId}/ticket-tiers/${tierId}`, input);
  return data.tier;
}

export async function deleteTicketTier(eventId: string, tierId: string) {
  await api.delete(`/events/${eventId}/ticket-tiers/${tierId}`);
}
