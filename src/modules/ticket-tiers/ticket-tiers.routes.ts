/**
 * server/modules/ticket-tiers/ticket-tiers.routes.ts
 * Mounted at /api/events/:eventId/ticket-tiers (see server/routes/index.ts)
 * -------------------------------------------------------------------------
 *   GET    /                -> list tiers for the event (public)
 *   POST   /                -> add a tier                (organizer, owner)
 *   PATCH  /:tierId          -> update a tier             (organizer, owner)
 *   DELETE /:tierId          -> delete a tier              (organizer, owner)
 * -------------------------------------------------------------------------
 */
import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth.middleware";
import * as controller from "./ticket-tiers.controller";

const router = Router({ mergeParams: true });

router.get("/", controller.listTicketTiers);
router.post("/", requireAuth, requireRole("organizer"), controller.addTicketTier);
router.patch("/:tierId", requireAuth, requireRole("organizer"), controller.updateTicketTier);
router.delete("/:tierId", requireAuth, requireRole("organizer"), controller.deleteTicketTier);

export default router;
