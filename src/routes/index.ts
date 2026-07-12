import { Router } from "express";
import eventsRoutes from "@/modules/events/events.routes";
import registrationsRoutes from "@/modules/registrations/registrations.routes";
import guestRoutes from "@/modules/guest/guest.routes";
import discoverRoutes from "@/modules/discover/discover.routes";
import ticketsRoutes from "@/modules/tickets/tickets.routes";
import paymentsRoutes from "@/modules/payments/payments.routes";
import hotelRoutes from "@/modules/hotel/hotel.routes";

const router = Router();

router.use("/events", eventsRoutes);
router.use("/registrations", registrationsRoutes);
router.use("/guest", guestRoutes);
router.use("/discover", discoverRoutes);
router.use("/tickets", ticketsRoutes);
router.use("/payments", paymentsRoutes);
router.use("/hotel", hotelRoutes);

export default router;
