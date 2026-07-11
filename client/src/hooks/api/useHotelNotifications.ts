import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as notificationsApi from "@/lib/api/hotelNotifications";
import { queryKeys } from "./queryKeys";

export function useHotelNotifications(page = 1) {
  return useQuery({
    queryKey: queryKeys.hotel.notifications(page),
    queryFn: () => notificationsApi.fetchNotifications(page),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel", "notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel", "notifications"] });
    },
  });
}
