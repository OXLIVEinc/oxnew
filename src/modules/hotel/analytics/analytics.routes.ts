/**
 * server/modules/hotel/analytics/analytics.routes.ts
 * Mounted at /api/hotel/analytics
 * -------------------------------------------------------------------------
 *   GET /   -> revenue by month, bookings by month, occupancy, average
 *              stay length, most booked room type, status distribution
 * -------------------------------------------------------------------------
 */
import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth.middleware";
import * as controller from "./analytics.controller";

const router = Router();

router.use(requireAuth, requireRole("hotel_partner"));

router.get("/", controller.getSummary);

export default router;
