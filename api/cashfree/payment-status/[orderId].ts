import { processOrderCompletion } from "../../../server/services/cashfreeService";
import { initDatabase } from "../../../server/database/connection";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const orderId = req.query?.orderId;
  if (!orderId) {
    return res.status(400).json({ success: false, error: "Order ID आवश्यक है।" });
  }

  try {
    initDatabase();
    const result = await processOrderCompletion(String(orderId));
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("Vercel payment-status error:", err?.message || "Unexpected error");
    return res.status(500).json({ success: false, error: "भुगतान स्थिति जांचने में तकनीकी त्रुटि।" });
  }
}
