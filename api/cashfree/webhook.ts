import { processOrderCompletion } from "../../server/services/cashfreeService";
import { initDatabase } from "../../server/database/connection";

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    initDatabase();
    const webhookData = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const orderId = webhookData?.data?.order?.order_id || webhookData?.order_id;
    if (orderId) {
      await processOrderCompletion(String(orderId));
    }
    return res.status(200).json({ status: "OK", received: true });
  } catch (err: any) {
    console.error("Vercel webhook error:", err);
    return res.status(200).json({ status: "ERROR_LOGGED" });
  }
}
