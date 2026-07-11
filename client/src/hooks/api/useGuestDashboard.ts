/**
 * src/hooks/api/useGuestDashboard.ts
 * -------------------------------------------------------------------------
 */
import { useQuery } from "@tanstack/react-query";
import * as guestApi from "@/lib/api/guest";
import { queryKeys } from "./queryKeys";

export function useMyRegisteredEvents(filter: guestApi.RegisteredEventsFilter = "all") {
  return useQuery({
    queryKey: queryKeys.guest.events(filter),
    queryFn: () => guestApi.fetchMyRegisteredEvents(filter),
  });
}

export function useMyTickets() {
  return useQuery({
    queryKey: queryKeys.guest.tickets(),
    queryFn: guestApi.fetchMyTickets,
  });
}
