/**
 * server/modules/hotel/bookings/bookings.routes.ts
 * Mounted at /api/hotel/bookings (see modules/hotel/hotel.routes.ts)
 * -------------------------------------------------------------------------
 *   GET   /                 -> paginated, filtered, sorted booking list
 *   GET   /:id               -> full booking detail (+ timeline)
 *   POST  /:id/confirm       -> hotel accepts a paid booking
 *   POST  /:id/decline       -> hotel declines a paid booking
 *   POST  /:id/check-in      -> mark guest checked in
 *   POST  /:id/complete      -> mark stay completed
 * -------------------------------------------------------------------------
 */
import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth.middleware";
import * as controller from "./bookings.controller";

const router = Router();

router.use(requireAuth, requireRole("hotel_partner"));

router.get("/", controller.listBookings);
router.get("/:id", controller.getBooking);
router.post("/:id/confirm", controller.confirmBooking);
router.post("/:id/decline", controller.declineBooking);
router.post("/:id/check-in", controller.markCheckedIn);
router.post("/:id/complete", controller.markCompleted);

export default router;
