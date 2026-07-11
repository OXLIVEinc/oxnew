/**
 * server/modules/hotel/payouts/payouts.service.ts
 * -------------------------------------------------------------------------
 * Gross/net earnings are computed on the fly from completed hotel_orders
 * using the hotel's own commissionRate. Actual payout *transfers* (when
 * money was or will be sent) come from the shared `payouts` table, scoped
 * to this hotel's owning profile with type = "hotel_booking".
 * -------------------------------------------------------------------------
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/config/database";
import { hotelOrders, payouts } from "@shared/schema";
import { getHotelForProfile } from "../hotel.access";

const PAYOUT_TYPE = "hotel_booking";

export async function getPayoutSummary(profileId: string) {
  const hotel = await getHotelForProfile(profileId);
  const commissionRate = Number(hotel.commissionRate) / 100;

  const [row] = await db
    .select({ gross: sql<string>`coalesce(sum(${hotelOrders.amount}), 0)` })
    .from(hotelOrders)
    .where(and(eq(hotelOrders.hotelId, hotel.id), eq(hotelOrders.status, "completed")));

  const gross = Number(row?.gross ?? 0);
  const commission = Math.round(gross * commissionRate * 100) / 100;
  const net = Math.round((gross - commission) * 100) / 100;

  const payoutRows = await db
    .select()
    .from(payouts)
    .where(and(eq(payouts.userId, profileId), eq(payouts.type, PAYOUT_TYPE)))
    .orderBy(desc(payouts.createdAt));

  const paidOut = payoutRows
    .filter((p) => p.status === "paid" || p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingPayout = Math.max(0, Math.round((net - paidOut) * 100) / 100);

  return {
    commissionRate: hotel.commissionRate,
    grossEarnings: gross,
    platformCommission: commission,
    netEarnings: net,
    pendingPayout,
    paidOut,
    history: payoutRows,
  };
}
