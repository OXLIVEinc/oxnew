/**
 * server/modules/registrations/registrations.routes.ts
 * Mounted at /api/registrations
 * -------------------------------------------------------------------------
 *   POST / -> register the current guest for an event's ticket tier.
 *             Free tier  -> { requiresPayment: false, ticket }
 *             Paid tier  -> { requiresPayment: true, order }
 * -------------------------------------------------------------------------
 */
import { Router } from "express";
import { requireAuth } from "@/middleware/auth.middleware";
import * as controller from "./registrations.controller";

const router = Router();

router.post("/", requireAuth, controller.register);

export default router;
