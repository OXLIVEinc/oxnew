import { Queue } from "bullmq";
import { queueConnection } from "./connection";

export const purchaseQueue = new Queue("purchase", { connection: queueConnection });

export type PurchaseJobName =
  | "ticket-delivery"
  | "hotel-upsell"
  | "referral-upsell"
  | "pre-event-reminder";

interface EnqueueOptions {
  delayMs?: number;
  /** Prevents duplicate jobs for the same order + job type piling up in the queue. */
  jobId?: string;
}

async function enqueue(
  name: PurchaseJobName,
  orderId: string,
  opts: EnqueueOptions = {}
): Promise<void> {
  console.log(`[purchase] Queueing ${name} for ${orderId}`);

  await purchaseQueue.add(
    name,
    { orderId },
    {
      delay: opts.delayMs,
      jobId: opts.jobId ?? `${name}-${orderId}`,
      removeOnComplete: true,
      removeOnFail: 100,
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    }
  );

  console.log(`[purchase] Queued ${name} successfully`);
}


/** Step 6 — Hotel upsell, 30–60s post-purchase. */
export function enqueueHotelUpsell(orderId: string): Promise<void> {
  const delayMs = 30_000 + Math.floor(Math.random() * 30_000); // 30-60s
  return enqueue("hotel-upsell", orderId, { delayMs });
}

/** Step 7 — Referral & distribution nudge, 1hr post-purchase. */
export function enqueueReferralUpsell(orderId: string): Promise<void> {
  return enqueue("referral-upsell", orderId, { delayMs: 60 * 60 * 1000 });
}

/** Step 8 — Pre-event reminder, T-24hrs. No-op if the event is already <24h away. */
export function enqueuePreEventReminder(orderId: string, eventStartsAt: Date): Promise<void> | void {
  const delayMs = eventStartsAt.getTime() - Date.now() - 24 * 60 * 60 * 1000;
  if (delayMs <= 0) return; // event is already inside the 24hr window — skip the reminder
  return enqueue("pre-event-reminder", orderId, { delayMs });
}
