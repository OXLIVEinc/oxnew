/**
 * server/modules/payments/payments.routes.ts
 * Mounted at /api/payments
 * -------------------------------------------------------------------------
 * TODO before production: verify the `x-paystack-signature` header against
 * PAYSTACK_SECRET_KEY before trusting this payload (see Paystack's webhook
 * docs). Left unimplemented here since no payment provider credentials were
 * part of this pass — everything else (ticket/QR generation on payment
 * success) is already wired up in registrations.service#finalizePaidOrder.
 * -------------------------------------------------------------------------
 */
import { Router } from "express";
import { asyncHandler } from "@/middleware/error.middleware";
import { finalizePaidOrder } from "@/modules/registrations/registrations.service";
import { db } from "@/config/database";
import { ticketOrders } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.post(
  "/webhook/paystack",
  asyncHandler(async (req, res) => {
    const event = req.body;

    if (event?.event === "charge.success") {
      const reference = event.data?.reference as string | undefined;
      if (reference) {
        const [order] = await db
          .select()
          .from(ticketOrders)
          .where(eq(ticketOrders.reference, reference))
          .limit(1);
        if (order) {
          await finalizePaidOrder(order.id);
        }
      }
    }

    res.status(200).json({ received: true });
  })
);

export default router;
