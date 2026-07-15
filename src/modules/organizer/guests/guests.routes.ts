// src/modules/organizer/guests/guests.routes.ts
import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth.middleware";
import * as controller from "./guests.controller";

const router = Router();
router.use(requireAuth, requireRole("organizer"));

router.get("/:eventId", controller.listGuests);
router.delete("/:eventId/:userId", controller.removeGuest);

export default router;