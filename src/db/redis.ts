import Redis from "ioredis";

const url = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(url, {
  lazyConnect: true,
  maxRetriesPerRequest: 2,
});

redis.on("error", (err) => {
  console.error("[redis] connection error:", err.message);
});

let connected = false;
export async function ensureRedisConnected(): Promise<void> {
  if (connected) return;
  if (redis.status === "ready") {
    connected = true;
    return;
  }
  await redis.connect();
  connected = true;
}

/**
 * BullMQ requires its own Redis connection(s) with `maxRetriesPerRequest:
 * null` (it manages blocking commands itself). Queues/Workers should use
 * this instead of the shared `redis` session client above.
 */
export function createBullConnection(): Redis {
  return new Redis(url, {
    maxRetriesPerRequest: null,
  });
}
