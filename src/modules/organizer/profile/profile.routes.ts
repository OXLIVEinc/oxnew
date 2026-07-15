// src/modules/organizer/profile/profile.routes.ts
import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth.middleware";
import * as controller from "./profile.controller";

const router = Router();
router.use(requireAuth, requireRole("organizer"));

router.get("/", controller.getProfile);
router.patch("/", controller.updateProfile);

export default router;