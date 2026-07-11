/**
 * src/hooks/api/useHotelDashboard.ts
 * -------------------------------------------------------------------------
 */
import { useQuery } from "@tanstack/react-query";
import * as hotelDashboardApi from "@/lib/api/hotelDashboard";
import { queryKeys } from "./queryKeys";

export function useHotelOverview() {
  return useQuery({
    queryKey: queryKeys.hotel.overview(),
    queryFn: hotelDashboardApi.fetchOverview,
  });
}

export function useHotelActivity() {
  return useQuery({
    queryKey: queryKeys.hotel.activity(),
    queryFn: hotelDashboardApi.fetchActivity,
  });
}

export function useHotelStatusChart() {
  return useQuery({
    queryKey: queryKeys.hotel.statusChart(),
    queryFn: hotelDashboardApi.fetchBookingStatusChart,
  });
}

export function useHotelRevenueChart() {
  return useQuery({
    queryKey: queryKeys.hotel.revenueChart(),
    queryFn: hotelDashboardApi.fetchRevenueChart,
  });
}
