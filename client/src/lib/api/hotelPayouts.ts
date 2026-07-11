/**
 * src/lib/api/hotelPayouts.ts
 * -------------------------------------------------------------------------
 */
import { api } from "./http";
import type { PayoutSummary } from "./hotelTypes";

export async function fetchPayoutSummary(): Promise<PayoutSummary> {
  const { data } = await api.get<PayoutSummary>("/hotel/payouts");
  return data;
}
