/**
 * server/modules/hotel/profile/profile.routes.ts
 * Mounted at /api/hotel/profile
 * -------------------------------------------------------------------------
 *   GET   /   -> current hotel's profile
 *   PATCH /   -> update profile fields
 * -------------------------------------------------------------------------
 */
import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth.middleware";
import * as controller from "./profile.controller";

const router = Router();

router.use(requireAuth, requireRole("hotel_partner"));

router.get("/", controller.getProfile);
router.patch("/", controller.updateProfile);

export default router;
