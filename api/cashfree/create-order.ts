import { createCashfreeOrder } from "../../server/services/cashfreeService";
import { initDatabase } from "../../server/database/connection";

function getBaseAppUrl(req: any): string {
  const origin = req.headers?.origin || req.headers?.referer;
  if (origin && typeof origin === "string" && origin.startsWith("http")) {
    try {
      const url = new URL(origin);
      return `${url.protocol}//${url.host}`;
    } catch {}
  }
  const host = req.headers?.["x-forwarded-host"] || req.headers?.host || "samanadhikar.in";
  const proto = req.headers?.["x-forwarded-proto"] === "http" && String(host).includes("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token, X-Idempotency-Key");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  try {
    initDatabase();

    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    body = body || {};

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
    } = body;

    if (!orderAmount || Number(orderAmount) <= 0) {
      return res.status(400).json({ success: false, error: "कृपया मान्य भुगतान राशि दर्ज करें।" });
    }

    const headerIdempotency = req.headers?.["x-idempotency-key"];
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
      return res.status(200).json(result);
    }
    return res.status(400).json(result);
  } catch (err: any) {
    console.error("Vercel create-order error:", err?.message || "Unexpected error");
    return res.status(500).json({ success: false, error: "कैशफ्री आर्डर प्रक्रिया में तकनीकी त्रुटि।" });
  }
}
