/**
 * src/hooks/useHotelRealtime.ts
 * -------------------------------------------------------------------------
 * Mounted once at the top of the Hotel Partner Dashboard. Subscribes to
 * every hotel.* Socket.IO event, invalidates the relevant React Query
 * caches, and shows a toast — so bookings, stats, and notification counts
 * all update live without a page refresh, no matter which panel is open.
 * -------------------------------------------------------------------------
 */
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Socket } from "socket.io-client";
import { getHotelSocket, disconnectHotelSocket } from "@/lib/hotelSocket";
import { queryKeys } from "@/hooks/api/queryKeys";
import { useAuth } from "@/context/AuthContext";

interface BookingEventPayload {
  id: string;
  status: string;
  reference: string;
}

interface NotificationEventPayload {
  title: string;
  message: string;
  createdAt: string;
}

const BOOKING_EVENTS = [
  "hotel.booking.created",
  "hotel.booking.updated",
  "hotel.booking.confirmed",
  "hotel.booking.declined",
  "hotel.booking.completed",
  "hotel.booking.cancelled",
] as const;

export function useHotelRealtime(): void {
  const queryClient = useQueryClient();
  const { isHotelPartner, profile } = useAuth();

  useEffect(() => {
    if (!isHotelPartner || !profile) return;

    let socket: Socket | null = null;
    let cancelled = false;

    const invalidateBookingData = (payload?: BookingEventPayload) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hotel.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.hotel.overview() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hotel.activity() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hotel.statusChart() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hotel.revenueChart() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hotel.analytics() });
      if (payload?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.hotel.bookings.detail(payload.id) });
      }
    };

    getHotelSocket().then((s) => {
      if (cancelled) return;
      socket = s;

      const onCreated = (payload: BookingEventPayload) => {
        invalidateBookingData(payload);
        toast.info(`New booking ${payload.reference}`);
      };
      const onUpdated = (payload: BookingEventPayload) => invalidateBookingData(payload);
      const onConfirmed = (payload: BookingEventPayload) => {
        invalidateBookingData(payload);
        toast.success(`Booking ${payload.reference} confirmed`);
      };
      const onDeclined = (payload: BookingEventPayload) => {
        invalidateBookingData(payload);
        toast.error(`Booking ${payload.reference} declined`);
      };
      const onCompleted = (payload: BookingEventPayload) => {
        invalidateBookingData(payload);
        toast.success(`Booking ${payload.reference} completed`);
      };
      const onCancelled = (payload: BookingEventPayload) => {
        invalidateBookingData(payload);
        toast.warning(`Booking ${payload.reference} was cancelled`);
      };
      const onNotification = (payload: NotificationEventPayload) => {
        queryClient.invalidateQueries({ queryKey: ["hotel", "notifications"] });
        toast(payload.title, { description: payload.message });
      };

      socket.on("hotel.booking.created", onCreated);
      socket.on("hotel.booking.updated", onUpdated);
      socket.on("hotel.booking.confirmed", onConfirmed);
      socket.on("hotel.booking.declined", onDeclined);
      socket.on("hotel.booking.completed", onCompleted);
      socket.on("hotel.booking.cancelled", onCancelled);
      socket.on("hotel.notification.created", onNotification);

      socket.on("connect_error", (err) => {
        console.warn("[hotel realtime] connection error", err.message);
      });
    });

    return () => {
      cancelled = true;
      if (socket) {
        for (const event of BOOKING_EVENTS) socket.off(event);
        socket.off("hotel.notification.created");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHotelPartner, profile?.id, queryClient]);

  useEffect(() => {
    if (!isHotelPartner) disconnectHotelSocket();
  }, [isHotelPartner]);
}
