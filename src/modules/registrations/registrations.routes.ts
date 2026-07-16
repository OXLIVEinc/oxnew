import { Router } from "express";
import { requireAuth } from "@/middleware/auth.middleware";
import * as controller from "./registrations.controller";

const router = Router();

router.post("/", requireAuth, controller.register);
router.post("/order", requireAuth, controller.createOrder);

export default router;