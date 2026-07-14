import * as db from "../data/db";
import { refundTransaction } from "../lib/paystack";
import { sendMessage } from "../bot/messenger";

export async function processRefunds(): Promise<number> {
  const refunds = await db.getPendingRefunds();

  if (refunds.length === 0) {
    console.log("[refund-worker] No pending refunds");
    return 0;
  }

  console.log(`[refund-worker] ${refunds.length} refund(s) pending`);

  for (const order of refunds) {
    await processRefund(order);
  }

  return refunds.length;
}

async function processRefund(
  order: Awaited<ReturnType<typeof db.getPendingRefunds>>[number]
) {
  try {
    // Prevent another cron run from picking this refund up.
    await db.markRefundProcessing(order.id);

    const result = await refundTransaction(
      order.reference,
      order.refundReason ?? "Automatic hotel booking refund"
    );

    if (!result.success) {
      await db.markRefundFailed(
        order.id,
        result.message ?? "Unknown Paystack error"
      );

      console.error(
        `[refund-worker] Refund failed for ${order.reference}: ${result.message}`
      );

      return;
    }

    await db.markRefundCompleted(
      order.id,
      result.refundReference ?? order.reference,
      order.amount,
    );

    await sendMessage(
      order.phone,
      `Your payment for booking ${order.reference} has been automatically refunded.\n\n` +
      `Refund Reference: ${result.refundReference ?? order.reference}\n\n` +
      `Depending on your bank, the refund may take a little time to appear in your account.\n\n` +
      `We apologize for the inconvenience and appreciate your patience.`
    );

    console.log(
      `[refund-worker] Refund completed for ${order.reference}`
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error";

    await db.markRefundFailed(order.id, message);

    console.error(
      `[refund-worker] Refund error for ${order.reference}`,
      err
    );
  }
}