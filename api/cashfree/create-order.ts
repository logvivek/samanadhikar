import { createCashfreeOrder } from "../../server/services/cashfreeService";
import { initDatabase } from "../../server/database/connection";

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  try {
    initDatabase();

    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { orderAmount, customerName, customerPhone, customerEmail, orderType, notes, donorData, memberData } = body;

    if (!orderAmount || Number(orderAmount) <= 0) {
      return res.status(400).json({ success: false, error: "कृपया मान्य भुगतान राशि दर्ज करें।" });
    }

    const host = req.headers["x-forwarded-host"] || req.headers.host || "samanadhikar.in";
    const proto = req.headers["x-forwarded-proto"] || "https";
    const appUrl = `${proto}://${host}`;

    const result = await createCashfreeOrder({
      orderAmount: Number(orderAmount),
      customerName,
      customerPhone,
      customerEmail,
      orderType: orderType || "DONATION",
      notes,
      appUrl,
      donorData,
      memberData
    });

    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(400).json(result);
  } catch (err: any) {
    console.error("Vercel create-order error:", err);
    return res.status(500).json({ success: false, error: "कैशफ्री आर्डर प्रक्रिया में तकनीकी त्रुटि।" });
  }
}
