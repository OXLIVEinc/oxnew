import { Worker, Job } from "bullmq";
import { createBullConnection } from "../db/redis";
import { handleHotelUpsell } from "../queues/hotel_upsell";
import { handleReferralUpsell } from "../queues/referral_upsell";
import { handlePreEventReminder } from "../queues/pre_event_reminder";
import { PurchaseJobName } from "../queues/purchase";

export function startPurchaseWorker(): Worker<
  { orderId: string },
  void,
  PurchaseJobName
> {
  console.log("[worker:purchase] Creating worker...");

  const worker = new Worker(
    "purchase",
    async (job: Job<{ orderId: string }, void, PurchaseJobName>) => {
      console.log("========================================");
      console.log(`[worker:purchase] 📥 Received job`);
      console.log(`Name: ${job.name}`);
      console.log(`ID: ${job.id}`);
      console.log(`Data:`, job.data);
      console.log("========================================");

      try {
        switch (job.name as PurchaseJobName) {
          case "hotel-upsell":
            console.log("[worker:purchase] Starting hotel upsell...");
            await handleHotelUpsell(job.data.orderId);
            console.log("[worker:purchase] Hotel upsell complete.");
            break;

          case "referral-upsell":
            console.log("[worker:purchase] Starting referral upsell...");
            await handleReferralUpsell(job.data.orderId);
            console.log("[worker:purchase] Referral upsell complete.");
            break;

          case "pre-event-reminder":
            console.log("[worker:purchase] Starting pre-event reminder...");
            await handlePreEventReminder(job.data.orderId);
            console.log("[worker:purchase] Pre-event reminder complete.");
            break;

          default:
            throw new Error(`Unknown purchase job: ${job.name}`);
        }
      } catch (err) {
        console.error("[worker:purchase] ❌ Job threw an error:");
        console.error(err);

        if (err instanceof Error) {
          console.error(err.stack);
        }

        throw err;
      }
    },
    {
      connection: createBullConnection(),
      concurrency: 5,
    }
  );

  worker.on("ready", () => {
    console.log("[worker:purchase] ✅ Worker ready and waiting for jobs.");
  });

  worker.on("active", (job) => {
    console.log(`[worker:purchase] 🚀 Active: ${job.name} (${job.id})`);
  });

  worker.on("completed", (job) => {
    console.log(`[worker:purchase] ✅ Completed: ${job.name} (${job.id})`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[worker:purchase] ❌ Failed: ${job?.name} (${job?.id})`);
    console.error(err);
    console.error(err.stack);
  });

  worker.on("error", (err) => {
    console.error("[worker:purchase] ❌ Worker error:");
    console.error(err);
    console.error(err.stack);
  });

  return worker;
}