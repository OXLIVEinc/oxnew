import { Router } from "express";
import { processRefunds } from "../workers/refund";
import * as db from "../data/db"

const router = Router();

router.post("/process", async (req, res) => {
  const secret = req.header("x-cron-secret");

  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    await db.resetStaleRefunds();
    const processed = await processRefunds();

    return res.json({
      success: true,
      processed,
    });
  } catch (err) {
    console.error("[refund-route]", err);

    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

export default router;