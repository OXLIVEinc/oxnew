// src/modules/organizer/dashboard/dashboard.routes.ts
import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth.middleware";
import * as controller from "./dashboard.controller";

const router = Router();
router.use(requireAuth, requireRole("organizer"));

router.get("/overview", controller.getOverview);
router.get("/events", controller.listEvents);
router.get("/analytics/:eventId", controller.getAnalytics);

export default router;