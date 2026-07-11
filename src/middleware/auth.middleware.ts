/**
 * server/middleware/auth.middleware.ts
 * -------------------------------------------------------------------------
 * Two middlewares:
 *
 *   requireAuth      - verifies the `Authorization: Bearer <token>` header
 *                       against Supabase Auth, loads the caller's `profiles`
 *                       row + `user_roles`, and attaches them as `req.auth`.
 *                       Rejects with 401 if missing/invalid.
 *
 *   requireRole(...)  - must run after requireAuth. Rejects with 403 unless
 *                       the caller has one of the given roles. `admin`
 *                       always passes (admins can act as any role).
 *
 * Route handlers read the authenticated caller via `req.auth`:
 *   req.auth.profileId   -> profiles.id       (use this for all FK columns)
 *   req.auth.authUserId  -> Supabase auth uid
 *   req.auth.roles       -> string[] e.g. ["organizer"]
 * -------------------------------------------------------------------------
 */
import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "@/config/database";
import { profiles,userRoles } from "@shared/schema";
import { supabaseAdmin } from "@/supabase/admin";

export type AppRole = "admin" | "organizer" | "guest" | "user" | "hotel_partner";

export interface AuthContext {
  profileId: string;
  authUserId: string;
  email: string | null;
  displayName: string | null;
  roles: AppRole[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "Missing bearer token" });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, data.user.id))
      .limit(1);

    if (!profile) {
      return res.status(401).json({ error: "No profile found for this account" });
    }

    const roleRows = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, profile.id));

    req.auth = {
      profileId: profile.id,
      authUserId: data.user.id,
      email: profile.email,
      displayName: profile.displayName,
      roles: roleRows.map((r) => r.role) as AppRole[],
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional auth: attaches `req.auth` when a valid token is present, but
 * never rejects the request. Useful for public endpoints (e.g. Discover)
 * that personalize output (e.g. "did I like this event") when logged in.
 */
export async function attachAuthIfPresent(req: Request, _res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) return next();

  try {
    const { data } = await supabaseAdmin.auth.getUser(token);
    if (!data.user) return next();

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, data.user.id))
      .limit(1);

    if (!profile) return next();

    const roleRows = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, profile.id));

    req.auth = {
      profileId: profile.id,
      authUserId: data.user.id,
      email: profile.email,
      displayName: profile.displayName,
      roles: roleRows.map((r) => r.role) as AppRole[],
    };
  } catch {
    // Ignore — this middleware never blocks the request.
  }
  next();
}

export function requireRole(...allowed: AppRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const hasRole = req.auth.roles.includes("admin") || req.auth.roles.some((r) => allowed.includes(r));
    if (!hasRole) {
      return res.status(403).json({ error: "You do not have permission to perform this action" });
    }
    next();
  };
}
