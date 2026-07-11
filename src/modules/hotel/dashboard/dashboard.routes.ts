/**
 * server/modules/hotel/dashboard/dashboard.routes.ts
 * Mounted at /api/hotel/dashboard
 * -------------------------------------------------------------------------
 *   GET /overview        -> stat cards
 *   GET /activity         -> recent bookings + upcoming arrivals
 *   GET /charts/status     -> booking status distribution
 *   GET /charts/revenue    -> last 14 days revenue series
 * -------------------------------------------------------------------------
 */
import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth.middleware";
import * as controller from "./dashboard.controller";

const router = Router();

router.use(requireAuth, requireRole("hotel_partner"));

router.get("/overview", controller.getOverview);
router.get("/activity", controller.getRecentActivity);
router.get("/charts/status", controller.getBookingStatusChart);
router.get("/charts/revenue", controller.getRevenueChart);

export default router;
