import { Router } from "express";
import webhookRoutes from "./webhook.routes";
import hotelRoutes from "./hotel.routes";
import ticketRoutes from "./ticket.routes";
import transferRoutes from "./transfer.routes";


const router = Router();

router.use("/webhook", webhookRoutes);
router.use("/hotel-order", hotelRoutes);
router.use("/checkout", ticketRoutes);
router.use("/transfer", transferRoutes);


export default router;