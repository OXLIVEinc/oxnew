/**
 * src/lib/api/hotelAnalytics.ts
 * -------------------------------------------------------------------------
 */
import { api } from "./http";
import type { AnalyticsSummary } from "./hotelTypes";

export async function fetchAnalytics(): Promise<AnalyticsSummary> {
  const { data } = await api.get<AnalyticsSummary>("/hotel/analytics");
  return data;
}
