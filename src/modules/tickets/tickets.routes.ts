/**
 * server/modules/tickets/tickets.routes.ts
 * Mounted at /api/tickets
 * -------------------------------------------------------------------------
 *   POST /check-in { token } -> organizer scans a guest's QR to check them in
 * -------------------------------------------------------------------------
 */
import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth.middleware";
import * as controller from "./tickets.controller";

const router = Router();

router.post("/check-in", requireAuth, requireRole("organizer"), controller.checkIn);

export default router;
