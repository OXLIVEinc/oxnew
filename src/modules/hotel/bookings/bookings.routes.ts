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
