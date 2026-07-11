/**
 * src/lib/api/hotelDashboard.ts
 * -------------------------------------------------------------------------
 */
import { api } from "./http";
import type { BookingStatusPoint, DashboardActivity, DashboardOverview, RevenuePoint } from "./hotelTypes";

export async function fetchOverview(): Promise<DashboardOverview> {
  const { data } = await api.get<{ overview: DashboardOverview }>("/hotel/dashboard/overview");
  return data.overview;
}

export async function fetchActivity(): Promise<DashboardActivity> {
  const { data } = await api.get<DashboardActivity>("/hotel/dashboard/activity");
  return data;
}

export async function fetchBookingStatusChart(): Promise<BookingStatusPoint[]> {
  const { data } = await api.get<{ data: BookingStatusPoint[] }>("/hotel/dashboard/charts/status");
  return data.data;
}

export async function fetchRevenueChart(): Promise<RevenuePoint[]> {
  const { data } = await api.get<{ data: RevenuePoint[] }>("/hotel/dashboard/charts/revenue");
  return data.data;
}
