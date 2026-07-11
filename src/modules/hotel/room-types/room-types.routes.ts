/**
 * server/modules/hotel/room-types/room-types.routes.ts
 * Mounted at /api/hotel/room-types
 * -------------------------------------------------------------------------
 *   GET    /       -> list room types with derived occupancy/availability
 *   POST   /       -> create room type
 *   PATCH  /:id    -> update room type
 *   DELETE /:id    -> delete room type (blocked if it has active bookings)
 * -------------------------------------------------------------------------
 */
import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth.middleware";
import * as controller from "./room-types.controller";

const router = Router();

router.use(requireAuth, requireRole("hotel_partner"));

router.get("/", controller.listRoomTypes);
router.post("/", controller.createRoomType);
router.patch("/:id", controller.updateRoomType);
router.delete("/:id", controller.deleteRoomType);

export default router;
