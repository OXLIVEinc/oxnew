import { Worker, Job } from "bullmq";
import { createBullConnection } from "../db/redis";
import { handleTicketDelivery } from "../queues/ticket_confirmation";
import { handleHotelUpsell } from "../queues/hotel_upsell";
import { handleReferralUpsell } from "../queues/referral_upsell";
import { handlePreEventReminder } from "../queues/pre_event_reminder";
import { PurchaseJobName } from "../queues/purchase";

export function startPurchaseWorker(): Worker<
  { orderId: string },
  void,
  PurchaseJobName
> {
  const worker = new Worker(
    "purchase",
    async (job: Job<{ orderId: string }, void, PurchaseJobName>) => {
      switch (job.name as PurchaseJobName) {
        case "ticket-delivery":
          return handleTicketDelivery(job.data.orderId);
        case "hotel-upsell":
          return handleHotelUpsell(job.data.orderId);
        case "referral-upsell":
          return handleReferralUpsell(job.data.orderId);
        case "pre-event-reminder":
          return handlePreEventReminder(job.data.orderId);
        default:
          throw new Error(`Unknown purchase job: ${job.name}`);
      }
    },
    { connection: createBullConnection(), concurrency: 5 }
  );

  worker.on("completed", (job: Job) => console.log(`[worker:purchase] ✅ ${job.name} (${job.id})`));
  worker.on("failed", (job: Job | undefined, err: Error) => console.error(`[worker:purchase] ❌ ${job?.name} (${job?.id}):`, err));
  worker.on("error", (err: Error) => console.error("[worker:purchase] connection error:", err));

  return worker;
}
