/**
 * src/lib/api/hotelBookings.ts
 * -------------------------------------------------------------------------
 */
import { api } from "./http";
import type { BookingListParams, BookingListResult, HotelBookingDetail } from "./hotelTypes";

export async function fetchBookings(params: BookingListParams): Promise<BookingListResult> {
  const { data } = await api.get<BookingListResult>("/hotel/bookings", { params });
  return data;
}

export async function fetchBooking(id: string): Promise<HotelBookingDetail> {
  const { data } = await api.get<{ booking: HotelBookingDetail }>(`/hotel/bookings/${id}`);
  return data.booking;
}

export async function confirmBooking(id: string): Promise<HotelBookingDetail> {
  const { data } = await api.post<{ booking: HotelBookingDetail }>(`/hotel/bookings/${id}/confirm`);
  return data.booking;
}

export async function declineBooking(id: string): Promise<HotelBookingDetail> {
  const { data } = await api.post<{ booking: HotelBookingDetail }>(`/hotel/bookings/${id}/decline`);
  return data.booking;
}

export async function checkInBooking(id: string): Promise<HotelBookingDetail> {
  const { data } = await api.post<{ booking: HotelBookingDetail }>(`/hotel/bookings/${id}/check-in`);
  return data.booking;
}

export async function completeBooking(id: string): Promise<HotelBookingDetail> {
  const { data } = await api.post<{ booking: HotelBookingDetail }>(`/hotel/bookings/${id}/complete`);
  return data.booking;
}
