/**
 * server/modules/discover/discover.routes.ts
 * Mounted at /api/discover — all public, no auth required.
 * -------------------------------------------------------------------------
 *   GET /            -> { featured, trending, thisWeek, daily } in one call
 *   GET /featured     -> admin-curated spotlight events
 *   GET /trending     -> ranked by likes + registrations
 *   GET /this-week     -> starting within the next 7 days
 *   GET /daily         -> starting today
 * -------------------------------------------------------------------------
 */
import { Router } from "express";
import * as controller from "./discover.controller";

const router = Router();

router.get("/", controller.getFeed);
router.get("/featured", controller.getFeatured);
router.get("/trending", controller.getTrending);
router.get("/this-week", controller.getThisWeek);
router.get("/daily", controller.getDaily);

export default router;
