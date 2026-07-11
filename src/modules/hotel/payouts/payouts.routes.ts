/**
 * server/modules/hotel/payouts/payouts.routes.ts
 * Mounted at /api/hotel/payouts
 * -------------------------------------------------------------------------
 *   GET /   -> gross/net earnings, commission, pending payout, history
 * -------------------------------------------------------------------------
 */
import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth.middleware";
import * as controller from "./payouts.controller";

const router = Router();

router.use(requireAuth, requireRole("hotel_partner"));

router.get("/", controller.getSummary);

export default router;
