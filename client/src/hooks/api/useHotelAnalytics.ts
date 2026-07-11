/**
 * src/hooks/api/useHotelAnalytics.ts
 * -------------------------------------------------------------------------
 */
import { useQuery } from "@tanstack/react-query";
import * as analyticsApi from "@/lib/api/hotelAnalytics";
import { queryKeys } from "./queryKeys";

export function useHotelAnalytics() {
  return useQuery({
    queryKey: queryKeys.hotel.analytics(),
    queryFn: analyticsApi.fetchAnalytics,
  });
}
