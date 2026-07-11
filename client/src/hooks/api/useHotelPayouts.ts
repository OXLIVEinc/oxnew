/**
 * src/hooks/api/useHotelPayouts.ts
 * -------------------------------------------------------------------------
 */
import { useQuery } from "@tanstack/react-query";
import * as payoutsApi from "@/lib/api/hotelPayouts";
import { queryKeys } from "./queryKeys";

export function useHotelPayouts() {
  return useQuery({
    queryKey: queryKeys.hotel.payouts(),
    queryFn: payoutsApi.fetchPayoutSummary,
  });
}
