import { createBullConnection } from "../db/redis";

/**
 * One shared BullMQ connection for all queues (producers). Workers get
 * their own connection in workers/index.ts, per BullMQ's recommendation.
 */
export const queueConnection = createBullConnection();
