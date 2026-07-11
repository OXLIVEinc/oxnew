/**
 * server/modules/guest/guest.routes.ts
 * Mounted at /api/guest
 * -------------------------------------------------------------------------
 *   GET /events?filter=upcoming|past|all  -> registered events for the guest dashboard
 *   GET /tickets                          -> guest's tickets (with QR image URL)
 * -------------------------------------------------------------------------
 */
import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth.middleware";
import * as controller from "./guest.controller";

const router = Router();

router.use(requireAuth, requireRole("guest"));
router.get("/events", controller.listMyEvents);
router.get("/tickets", controller.listMyTickets);

export default router;
