/**
 * server/modules/hotel/hotel.routes.ts
 * -------------------------------------------------------------------------
 * All Hotel Partner Dashboard routes, mounted under /api/hotel by
 * routes/index.ts. Every sub-router already applies requireAuth +
 * requireRole("hotel_partner") itself.
 * -------------------------------------------------------------------------
 */
import { Router } from "express";
import dashboardRoutes from "./dashboard/dashboard.routes";
import bookingsRoutes from "./bookings/bookings.routes";
import roomTypesRoutes from "./room-types/room-types.routes";
import profileRoutes from "./profile/profile.routes";
import analyticsRoutes from "./analytics/analytics.routes";
import payoutsRoutes from "./payouts/payouts.routes";
import notificationsRoutes from "./notifications/notifications.routes";

const router = Router();

router.use("/dashboard", dashboardRoutes);
router.use("/bookings", bookingsRoutes);
router.use("/room-types", roomTypesRoutes);
router.use("/profile", profileRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/payouts", payoutsRoutes);
router.use("/notifications", notificationsRoutes);

export default router;
