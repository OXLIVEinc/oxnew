import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth.middleware";
import * as controller from "./guest.controller";

const router = Router();

router.use(requireAuth);
router.get("/events", controller.listMyEvents);
router.get("/tickets", controller.listMyTickets);

export default router;
