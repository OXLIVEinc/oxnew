import { Router } from "express";
import { requireAuth } from "@/middleware/auth.middleware";
import * as controller from "./registrations.controller";

const router = Router();

// Authenticated customer order
router.post("/order", requireAuth, controller.createOrder);

// Anonymous guest order (no authentication)
router.post("/guest-order", controller.createGuestOrder);

export default router;