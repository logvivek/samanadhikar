import { Router } from "express";
import { createCashfreeOrder, processOrderCompletion } from "../services/cashfreeService";
import { getCashfreeOrder } from "../database/repositories/cashfreeRepository";
import { donationLimiter } from "../middleware/rateLimiter";

export const cashfreeRouter = Router();

// Helper to determine absolute request host URL for return_url
function getBaseAppUrl(req: any): string {
  const origin = req.headers.origin || req.headers.referer;
  if (origin && typeof origin === "string" && origin.startsWith("http")) {
    try {
      const url = new URL(origin);
      return `${url.protocol}//${url.host}`;
    } catch {}
  }
  const host = req.get("host") || "localhost:3000";
  const proto = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  return `${proto}://${host}`;
}

// POST /api/cashfree/create-order
// Initiates server-side order with Cashfree Orders API per https://www.cashfree.com/docs/payments/online/web/redirect
cashfreeRouter.post("/create-order", donationLimiter, async (req, res) => {
  try {
    const { orderAmount, customerName, customerPhone, customerEmail, orderType, notes, donorData, memberData } = req.body;

    if (!orderAmount || Number(orderAmount) <= 0) {
      return res.status(400).json({ success: false, error: "कृपया मान्य भुगतान राशि दर्ज करें।" });
    }

    const appUrl = getBaseAppUrl(req);

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
      return res.json(result);
    }
    return res.status(400).json(result);
  } catch (err: any) {
    console.error("Cashfree order creation route error:", err);
    return res.status(500).json({ success: false, error: "कैशफ्री आर्डर प्रक्रिया में तकनीकी त्रुटि।" });
  }
});

// GET /api/cashfree/order-status/:orderId
// Used by frontend on return_url redirect to inspect status and generate 80GGC receipt / member card
cashfreeRouter.get("/order-status/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ success: false, error: "Order ID आवश्यक है।" });
    }

    const result = await processOrderCompletion(String(orderId));
    return res.json(result);
  } catch (err: any) {
    console.error("Cashfree order status check error:", err);
    return res.status(500).json({ success: false, error: "भुगतान स्थिति जांचने में तकनीकी त्रुटि।" });
  }
});

// POST /api/cashfree/verify-order
// Direct or fallback order verification
cashfreeRouter.post("/verify-order", async (req, res) => {
  try {
    const { orderId, donorData, memberData } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, error: "Order ID आवश्यक है।" });
    }

    const result = await processOrderCompletion(String(orderId), donorData, memberData);
    if (result.success) {
      return res.json(result);
    }
    return res.status(400).json(result);
  } catch (err: any) {
    console.error("Cashfree verification error:", err);
    return res.status(500).json({ success: false, error: "भुगतान सत्यापन में तकनीकी त्रुटि।" });
  }
});

// POST /api/cashfree/webhook
// Cashfree server-to-server webhook callback
cashfreeRouter.post("/webhook", async (req, res) => {
  try {
    const webhookData = req.body;
    console.log("Received Cashfree webhook:", webhookData?.type || "generic");

    const orderId = webhookData?.data?.order?.order_id || webhookData?.order_id;
    if (orderId) {
      await processOrderCompletion(String(orderId));
    }

    return res.json({ status: "OK", received: true });
  } catch (err: any) {
    console.error("Cashfree webhook processing error:", err);
    return res.status(200).json({ status: "ERROR_LOGGED" });
  }
});
