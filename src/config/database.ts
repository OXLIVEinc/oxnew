/**
 * server/config/database.ts
 * -------------------------------------------------------------------------
 * Single Drizzle ORM instance backed by a `postgres` connection pool.
 * Every module imports `db` from here — never create a second pool.
 * -------------------------------------------------------------------------
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@shared/schema";
import { env } from "./env";

const queryClient = postgres(env.DATABASE_URL, {
  // Supabase's pooled connection string works fine with a small pool size
  // per server instance.
  max: 10,
});

export const db = drizzle(queryClient, { schema });

export type Database = typeof db;

/** The transaction handle type passed into `db.transaction(async (tx) => ...)`. */
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
