/**
 * src/lib/api/http.ts
 * -------------------------------------------------------------------------
 * The ONLY place that should construct requests to our own backend
 * (server/**). Every data-fetching hook in src/hooks/api goes through this
 * client instead of calling `supabase.from(...)` directly, so:
 *   - auth is attached consistently (Supabase access token -> Bearer header)
 *   - error shapes are consistent (see server/middleware/error.middleware.ts)
 *   - the base URL is configured in one place (VITE_API_URL)
 * -------------------------------------------------------------------------
 */
import axios, { AxiosError } from "axios";
import { supabase } from "../../integrations/supabase/client";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Normalized error shape thrown from every failed API call (see error.middleware.ts). */
export interface ApiErrorBody {
  error: string;
  code?: string;
  issues?: { path: string; message: string }[];
}

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const body = (error as AxiosError<ApiErrorBody>).response?.data;
    return body?.error ?? fallback;
  }
  return fallback;
}
