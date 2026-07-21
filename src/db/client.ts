import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../shared/schema";


const connectionString = process.env.DATABASE_URL;

console.log("DATABASE_URL host:", connectionString?.match(/@([^:/]+)/)?.[1]);

if (!connectionString) {
  // We don't throw here so the process can still boot (e.g. `tsc --noEmit`,
  // or a health-check route) without a DB configured. Any actual query will
  // fail loudly, which is what you want in production.
  console.warn(
    "[db] DATABASE_URL is not set — database calls will fail until it's configured in .env"
  );
}

const queryClient = postgres(connectionString || "postgres://user:pass@localhost:5432/oxbot", {
  max: 3,
  onnotice: () => {},
});

export const db = drizzle(queryClient, { schema });
