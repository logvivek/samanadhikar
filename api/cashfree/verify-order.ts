import { processOrderCompletion } from "../../server/services/cashfreeService";
import { initDatabase } from "../../server/database/connection";
import { PaymentGatewayStatus } from "../../server/types";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
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
    const { orderId, donorData, memberData, paymentMethod, simulatedOutcome } = body;

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
      return res.status(200).json(result);
    }
    return res.status(result.paymentStatus === "PENDING" ? 202 : 400).json(result);
  } catch (err: any) {
    console.error("Vercel verify-order error:", err?.message || "Unexpected error");
    return res.status(500).json({ success: false, error: "भुगतान सत्यापन में तकनीकी त्रुटि।" });
  }
}
