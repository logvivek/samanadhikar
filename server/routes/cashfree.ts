import { Router } from "express";
import {
  createCashfreeOrder,
  processOrderCompletion,
  verifyCashfreeWebhookSignature,
  handleCashfreeWebhookEvent
} from "../services/cashfreeService";
import { getAllPaymentTransactions } from "../database/repositories/cashfreeRepository";
import { donationLimiter } from "../middleware/rateLimiter";
import { verifyAdmin } from "../middleware/auth";
import { PaymentGatewayStatus } from "../types";

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
// Creates a Cashfree PG API v3 order and stores a PENDING paymentTransaction record
cashfreeRouter.post("/create-order", donationLimiter, async (req, res) => {
  try {
    const {
      orderAmount,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      orderType,
      notes,
      donorData,
      memberData,
      idempotencyKey
    } = req.body || {};

    if (!orderAmount || Number(orderAmount) <= 0) {
      return res.status(400).json({ success: false, error: "कृपया मान्य भुगतान राशि दर्ज करें।" });
    }

    const headerIdempotency = req.headers["x-idempotency-key"];
    const effectiveIdempotency =
      typeof idempotencyKey === "string" && idempotencyKey.trim()
        ? idempotencyKey.trim()
        : typeof headerIdempotency === "string"
          ? headerIdempotency.trim()
          : undefined;

    const appUrl = getBaseAppUrl(req);

    const result = await createCashfreeOrder({
      orderAmount: Number(orderAmount),
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      orderType: orderType || "DONATION",
      notes,
      appUrl,
      idempotencyKey: effectiveIdempotency,
      donorData,
      memberData
    });

    if (result.success) {
      return res.json(result);
    }
    return res.status(400).json(result);
  } catch (err: any) {
    console.error("Cashfree order creation route error:", err?.message || "Unexpected error");
    return res.status(500).json({ success: false, error: "कैशफ्री आर्डर प्रक्रिया में तकनीकी त्रुटि।" });
  }
});

// GET /api/cashfree/order-status/:orderId
// GET /api/cashfree/payment-status/:orderId
// Server-side verification against Cashfree Orders & Payments API
async function handleOrderStatusCheck(req: any, res: any) {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ success: false, error: "Order ID आवश्यक है।" });
    }

    const result = await processOrderCompletion(String(orderId));
    return res.json(result);
  } catch (err: any) {
    console.error("Cashfree order status check error:", err?.message || "Unexpected error");
    return res.status(500).json({ success: false, error: "भुगतान स्थिति जांचने में तकनीकी त्रुटि।" });
  }
}

cashfreeRouter.get("/order-status/:orderId", handleOrderStatusCheck);
cashfreeRouter.get("/payment-status/:orderId", handleOrderStatusCheck);

// POST /api/cashfree/verify-order
// Verifies order server-side; accepts simulatedOutcome only when sandbox simulator mode is active (no live keys)
cashfreeRouter.post("/verify-order", async (req, res) => {
  try {
    const { orderId, donorData, memberData, paymentMethod, simulatedOutcome } = req.body || {};

    if (!orderId) {
      return res.status(400).json({ success: false, error: "Order ID आवश्यक है।" });
    }

    const allowedOutcomes: PaymentGatewayStatus[] = ["SUCCESS", "FAILED", "PENDING", "USER_DROPPED", "CANCELLED"];
    const validOutcome = allowedOutcomes.includes(simulatedOutcome)
      ? (simulatedOutcome as PaymentGatewayStatus)
      : undefined;

    const result = await processOrderCompletion(
      String(orderId),
      donorData,
      memberData,
      paymentMethod,
      validOutcome
    );

    if (result.success) {
      return res.json(result);
    }
    return res.status(result.paymentStatus === "PENDING" ? 202 : 400).json(result);
  } catch (err: any) {
    console.error("Cashfree verification error:", err?.message || "Unexpected error");
    return res.status(500).json({ success: false, error: "भुगतान सत्यापन में तकनीकी त्रुटि।" });
  }
});

// POST /api/cashfree/webhook
// Cashfree server-to-server webhook callback with raw-body HMAC-SHA256 signature verification & duplicate handling
cashfreeRouter.post("/webhook", async (req: any, res) => {
  try {
    const signatureHeader = req.headers["x-webhook-signature"] as string | undefined;
    const timestampHeader = req.headers["x-webhook-timestamp"] as string | undefined;
    const rawBody: string =
      typeof req.rawBody === "string"
        ? req.rawBody
        : typeof req.body === "string"
          ? req.body
          : JSON.stringify(req.body || {});

    const sigCheck = verifyCashfreeWebhookSignature(rawBody, signatureHeader, timestampHeader);
    if (!sigCheck.valid) {
      console.warn("Cashfree webhook signature verification rejected:", sigCheck.reason);
      return res.status(401).json({
        success: false,
        status: "INVALID_SIGNATURE",
        error: "Invalid webhook signature"
      });
    }

    const webhookData = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const result = await handleCashfreeWebhookEvent(webhookData, timestampHeader);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("Cashfree webhook processing error:", err?.message || "Unexpected error");
    return res.status(500).json({ status: "ERROR", error: "Webhook processing failure" });
  }
});

// GET /api/cashfree/transactions
// Admin endpoint to inspect full Cashfree payment transaction history
cashfreeRouter.get("/transactions", verifyAdmin, async (_req, res) => {
  try {
    const transactions = await getAllPaymentTransactions();
    // Redact internal raw payload fields if needed, returning full ledger columns
    return res.json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (err: any) {
    console.error("Admin fetch transactions error:", err?.message || "Unexpected error");
    return res.status(500).json({ success: false, error: "लेन-देन इतिहास प्राप्त करने में त्रुटि।" });
  }
});
