import { Router } from "express";
import dashboardRoutes from "./dashboard/dashboard.routes";
import profileRoutes from "./profile/profile.routes";
import subscriptionRoutes from "./subscription/subscription.routes";
import campaignsRoutes from "./campaigns/campaigns.routes";
import guestsRoutes from "./guests/guests.routes";

const router = Router();

router.use("/dashboard", dashboardRoutes);
router.use("/profile", profileRoutes);
router.use("/subscription", subscriptionRoutes);
router.use("/campaigns", campaignsRoutes);
router.use("/guests", guestsRoutes);

export default router;