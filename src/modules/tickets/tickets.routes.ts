import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth.middleware";
import * as controller from "./tickets.controller";

const router = Router();

router.post("/check-in", requireAuth, requireRole("organizer"), controller.checkIn);
router.post("/check-in-code", requireAuth, requireRole("organizer"), controller.checkInByCode);

export default router;