import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as bookingsApi from "@/lib/api/hotelBookings";
import type { BookingListParams } from "@/lib/api/hotelTypes";
import { getApiErrorMessage } from "@/lib/api/http";
import { queryKeys } from "./queryKeys";

export function useHotelBookings(params: BookingListParams) {
  return useQuery({
    queryKey: queryKeys.hotel.bookings.list(params),
    queryFn: () => bookingsApi.fetchBookings(params),
    placeholderData: (prev) => prev,
  });
}

export function useHotelBooking(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.hotel.bookings.detail(id ?? ""),
    queryFn: () => bookingsApi.fetchBooking(id!),
    enabled: Boolean(id),
  });
}

function useBookingAction(
  mutationFn: (id: string) => Promise<unknown>,
  successMessage: string,
  // confirm/decline already surface a toast via the realtime socket event
  // (see useHotelRealtime) — showing one here too would double it up.
  options: { silent?: boolean } = {}
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_data, id) => {
      if (!options.silent) toast.success(successMessage);
      queryClient.invalidateQueries({ queryKey: queryKeys.hotel.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.hotel.bookings.detail(id as string) });
      queryClient.invalidateQueries({ queryKey: queryKeys.hotel.overview() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hotel.activity() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hotel.statusChart() });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "That action couldn't be completed")),
  });
}

export function useConfirmBooking() {
  return useBookingAction(bookingsApi.confirmBooking, "Booking confirmed", { silent: true });
}

export function useDeclineBooking() {
  return useBookingAction(bookingsApi.declineBooking, "Booking declined", { silent: true });
}

export function useCheckInBooking() {
  return useBookingAction(bookingsApi.checkInBooking, "Guest marked as checked in");
}

export function useCompleteBooking() {
  return useBookingAction(bookingsApi.completeBooking, "Stay marked as completed");
}