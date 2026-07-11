/**
 * server/supabase/server.ts
 * -------------------------------------------------------------------------
 * Supabase client using the SERVICE ROLE key. Server-side only — never send
 * this key or this client to the browser.
 *
 * Used for:
 *   - verifying the access token a request sends in `Authorization: Bearer`
 *   - uploading generated ticket/QR images to Storage
 * -------------------------------------------------------------------------
 */
import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";

export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
