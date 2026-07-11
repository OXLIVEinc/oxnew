/**
 * server/config/env.ts
 * -------------------------------------------------------------------------
 * Loads and validates the environment variables the backend needs. Import
 * `env` anywhere on the server instead of touching `process.env` directly —
 * this guarantees required values are present at boot instead of failing
 * deep inside a request handler.
 * -------------------------------------------------------------------------
 */
import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  NODE_ENV: optional("NODE_ENV", "development"),
  PORT: Number(optional("PORT", "3000")),

  // Postgres connection string used by Drizzle (server-side only).
  DATABASE_URL: required("DATABASE_URL"),

  // Supabase project — used server-side for Auth (verifying user JWTs) and
  // Storage (uploading banners/gallery/qr images) with the service role key.
  SUPABASE_URL: required("VITE_SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: required("SUPABASE_SERVICE_ROLE_KEY"),

  // Secret used to sign/verify the JWT embedded in every ticket QR code.
  QR_SECRET: required("QR_SECRET"),

  // Comma separated list of origins allowed to call this API.
  CORS_ORIGINS: optional("CORS_ORIGINS", "http://localhost:8080").split(","),
} as const;

export const isProduction = env.NODE_ENV === "production";
