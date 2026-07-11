/**
 * src/hooks/api/useTicketTiers.ts
 * -------------------------------------------------------------------------
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ticketTiersApi from "@/lib/api/ticketTiers";
import type { TicketTierFormValues } from "@/lib/api/types";
import { queryKeys } from "./queryKeys";

export function useTicketTiers(eventId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.ticketTiers.all(eventId ?? ""),
    queryFn: () => ticketTiersApi.fetchTicketTiers(eventId!),
    enabled: Boolean(eventId),
  });
}

export function useAddTicketTier(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TicketTierFormValues) => ticketTiersApi.addTicketTier(eventId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.ticketTiers.all(eventId) }),
  });
}

export function useUpdateTicketTier(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tierId, input }: { tierId: string; input: Partial<TicketTierFormValues> }) =>
      ticketTiersApi.updateTicketTier(eventId, tierId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.ticketTiers.all(eventId) }),
  });
}

export function useDeleteTicketTier(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tierId: string) => ticketTiersApi.deleteTicketTier(eventId, tierId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.ticketTiers.all(eventId) }),
  });
}
