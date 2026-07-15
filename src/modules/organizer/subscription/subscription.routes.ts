// src/modules/organizer/subscription/subscription.routes.ts
import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth.middleware";
import * as controller from "./subscription.controller";

const router = Router();
router.use(requireAuth, requireRole("organizer"));

router.get("/", controller.getSubscription);
router.post("/switch-free", controller.switchToFree);

export default router;