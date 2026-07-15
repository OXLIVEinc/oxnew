// client/src/hooks/api/useOrganizer.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as organizerApi from "@/lib/api/organizer";
import * as eventsApi from "@/lib/api/events";
import { getApiErrorMessage } from "@/lib/api/http";
import { queryKeys } from "./queryKeys";

export function useOrganizerOverview() {
  return useQuery({ queryKey: queryKeys.organizer.overview(), queryFn: organizerApi.fetchOrganizerOverview });
}

export function useOrganizerEvents() {
  return useQuery({ queryKey: queryKeys.organizer.events(), queryFn: organizerApi.fetchOrganizerEvents });
}

export function useUpdateEventStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => eventsApi.updateEvent(id, { status: status as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizer.events() });
      queryClient.invalidateQueries({ queryKey: queryKeys.organizer.overview() });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Couldn't update event status")),
  });
}

export function useEventAnalytics(eventId: string | null, params: { dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: queryKeys.organizer.analytics(eventId ?? "", params),
    queryFn: () => organizerApi.fetchEventAnalytics(eventId!, params),
    enabled: Boolean(eventId),
  });
}

export function useOrganizerProfile() {
  return useQuery({ queryKey: queryKeys.organizer.profile(), queryFn: organizerApi.fetchOrganizerProfile });
}

export function useUpdateOrganizerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof organizerApi.updateOrganizerProfile>[0]) => organizerApi.updateOrganizerProfile(patch),
    onSuccess: () => {
      toast.success("Profile saved");
      queryClient.invalidateQueries({ queryKey: queryKeys.organizer.profile() });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Couldn't save profile")),
  });
}

export function useOrganizerSubscription() {
  return useQuery({ queryKey: queryKeys.organizer.subscription(), queryFn: organizerApi.fetchOrganizerSubscription });
}

export function useSwitchToFreePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: organizerApi.switchToFreePlan,
    onSuccess: () => {
      toast.success("Switched to On-Demand plan");
      queryClient.invalidateQueries({ queryKey: queryKeys.organizer.subscription() });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Couldn't switch plan")),
  });
}

export function useCampaigns(eventId: string | null) {
  return useQuery({
    queryKey: queryKeys.organizer.campaigns(eventId ?? ""),
    queryFn: () => organizerApi.fetchCampaigns(eventId!),
    enabled: Boolean(eventId),
  });
}

export function useCreateCampaign(eventId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { subject: string; message: string; type: "email" | "sms" }) =>
      organizerApi.createCampaign(eventId!, input),
    onSuccess: () => {
      toast.success("Campaign sent");
      queryClient.invalidateQueries({ queryKey: queryKeys.organizer.campaigns(eventId ?? "") });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Couldn't send campaign")),
  });
}

export function useGuests(eventId: string | null, params: { dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: queryKeys.organizer.guests(eventId ?? "", params),
    queryFn: () => organizerApi.fetchGuests(eventId!, params),
    enabled: Boolean(eventId),
  });
}

export function useRemoveGuest(eventId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => organizerApi.removeGuest(eventId!, userId),
    onSuccess: () => {
      toast.success("Guest removed");
      queryClient.invalidateQueries({ queryKey: queryKeys.organizer.guests(eventId ?? "", {}) });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Couldn't remove guest")),
  });
}