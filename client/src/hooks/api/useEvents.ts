/**
 * src/hooks/api/useEvents.ts
 * -------------------------------------------------------------------------
 * All event data-fetching for guest/organizer flows goes through these
 * hooks. Components should never call `src/lib/api/events.ts` directly.
 * -------------------------------------------------------------------------
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as eventsApi from "@/lib/api/events";
import type { CreateEventPayload } from "@/lib/api/types";
import { queryKeys } from "./queryKeys";

export function useEvents(params?: { q?: string; genre?: string; ageGroup?: string }) {
  return useQuery({
    queryKey: queryKeys.events.list(params),
    queryFn: () => eventsApi.fetchEvents(params),
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.events.detail(id ?? ""),
    queryFn: () => eventsApi.fetchEvent(id!),
    enabled: Boolean(id),
  });
}

/** Organizer's own events, any status (draft/active/cancelled), not just approved+active. */
export function useMyOrganizerEvents() {
  return useQuery({
    queryKey: queryKeys.events.mine(),
    queryFn: eventsApi.fetchMyOrganizerEvents,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEventPayload) => eventsApi.createEvent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}

export function useUpdateEvent(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<CreateEventPayload>) => eventsApi.updateEvent(eventId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.mine() });
    },
  });
}

export function useToggleEventLike(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => eventsApi.toggleEventLike(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.discover.feed() });
      queryClient.invalidateQueries({ queryKey: queryKeys.discover.trending() });
    },
  });
}


export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => eventsApi.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.mine() });
    },
  });
}