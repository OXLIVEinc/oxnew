/**
 * server/modules/hotel/notifications/notifications.routes.ts
 * Mounted at /api/hotel/notifications
 * -------------------------------------------------------------------------
 *   GET   /              -> paginated notifications + unread count
 *   POST  /:id/read       -> mark one as read
 *   POST  /read-all       -> mark all as read
 * -------------------------------------------------------------------------
 */
import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth.middleware";
import * as controller from "./notifications.controller";

const router = Router();

router.use(requireAuth, requireRole("hotel_partner"));

router.get("/", controller.listNotifications);
router.post("/read-all", controller.markAllRead);
router.post("/:id/read", controller.markRead);

export default router;
