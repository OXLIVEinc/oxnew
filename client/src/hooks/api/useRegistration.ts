/**
 * src/hooks/api/useRegistration.ts
 * -------------------------------------------------------------------------
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as registrationsApi from "@/lib/api/registrations";
import type { RegisterInput } from "@/lib/api/types";
import { queryKeys } from "./queryKeys";

export function useRegisterForEvent(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) => registrationsApi.registerForEvent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.guest.events("all") });
      queryClient.invalidateQueries({ queryKey: queryKeys.guest.events("upcoming") });
      queryClient.invalidateQueries({ queryKey: queryKeys.guest.tickets() });
    },
  });
}
