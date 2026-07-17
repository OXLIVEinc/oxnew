/**
 * server/modules/events/events.routes.ts
 * Mounted at /api/events (see server/routes/index.ts)
 * -------------------------------------------------------------------------
 *   GET    /                          -> public list (approved + active)
 *   GET    /mine                      -> organizer's own events (any status)
 *   GET    /:id                       -> public detail
 *   POST   /                          -> create event + required tiers    (organizer)
 *   PATCH  /:id                       -> update event                     (organizer, owner)
 *   POST   /:id/like                  -> toggle like                      (guest)
 *   /:eventId/ticket-tiers/*          -> see ticket-tiers.routes.ts
 * -------------------------------------------------------------------------
 */
import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth.middleware";
import * as controller from "./events.controller";
import ticketTiersRouter from "@/modules/ticket-tiers/ticket-tiers.routes";

const router = Router();

router.get("/", controller.listEvents);
router.get("/mine", requireAuth, requireRole("organizer"), controller.listMyOrganizerEvents);
router.get("/:id", controller.getEvent);
router.post("/", requireAuth, requireRole("organizer"), controller.createEvent);
router.patch("/:id", requireAuth, requireRole("organizer"), controller.updateEvent);
router.post("/:id/like", requireAuth, controller.toggleLike);
router.delete("/:id", requireAuth, requireRole("organizer"), controller.deleteEvent);

router.use("/:eventId/ticket-tiers", ticketTiersRouter);

export default router;
