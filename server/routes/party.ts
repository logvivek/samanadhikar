import { Router } from "express";
import { getPartyInfo, savePartyInfo } from "../database/repositories/partyRepository";
import { verifyAdmin } from "../middleware/auth";
import { mutationLimiter } from "../middleware/rateLimiter";

export const partyRouter = Router();

// GET /api/party-info or /api/party
partyRouter.get("/", async (_req, res) => {
  try {
    const partyInfo = await getPartyInfo();
    return res.json({
      success: true,
      partyInfo
    });
  } catch (err: any) {
    console.error("Fetch party info error:", err);
    return res.status(500).json({ success: false, error: "पार्टी विवरण प्राप्त करने में त्रुटि।" });
  }
});

// POST /api/party-info or /api/party
partyRouter.post("/", verifyAdmin, mutationLimiter, async (req, res) => {
  try {
    const updated = req.body;
    const partyInfo = await savePartyInfo(updated);
    return res.json({
      success: true,
      message: "पार्टी विवरण एवं बैंक खाता जानकारी सफलतापूर्वक अपडेट हो गई!",
      partyInfo
    });
  } catch (err: any) {
    console.error("Update party info error:", err);
    return res.status(500).json({ success: false, error: "पार्टी विवरण अपडेट करने में त्रुटि।" });
  }
});
