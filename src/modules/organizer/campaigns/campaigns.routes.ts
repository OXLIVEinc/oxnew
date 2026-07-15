// src/modules/organizer/campaigns/campaigns.routes.ts
import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth.middleware";
import * as controller from "./campaigns.controller";

const router = Router();
router.use(requireAuth, requireRole("organizer"));

router.get("/:eventId", controller.listCampaigns);
router.post("/:eventId", controller.createCampaign);

export default router;