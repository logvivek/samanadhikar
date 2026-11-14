import {
  verifyCashfreeWebhookSignature,
  handleCashfreeWebhookEvent
} from "../../server/services/cashfreeService";
import { initDatabase } from "../../server/database/connection";

export const config = {
  api: {
    bodyParser: false
  }
};

async function readRawBody(req: any): Promise<string> {
  if (typeof req.rawBody === "string") return req.rawBody;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  if (typeof req.body === "string") return req.body;

  if (req && typeof req.on === "function" && !req.readableEnded) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk, "utf8") : chunk);
    }
    if (chunks.length > 0) {
      return Buffer.concat(chunks).toString("utf8");
    }
  }

  if (req.body && typeof req.body === "object") {
    return JSON.stringify(req.body);
  }
  return "";
}

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  try {
    initDatabase();

    const rawBody = await readRawBody(req);
    const signatureHeader = req.headers?.["x-webhook-signature"] as string | undefined;
    const timestampHeader = req.headers?.["x-webhook-timestamp"] as string | undefined;

    const sigCheck = verifyCashfreeWebhookSignature(rawBody, signatureHeader, timestampHeader);
    if (!sigCheck.valid) {
      console.warn("Vercel Cashfree webhook signature rejected:", sigCheck.reason);
      return res.status(401).json({
        success: false,
        status: "INVALID_SIGNATURE",
        error: "Invalid webhook signature"
      });
    }

    const webhookData = rawBody ? JSON.parse(rawBody) : (req.body || {});
    const result = await handleCashfreeWebhookEvent(webhookData, timestampHeader);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("Vercel webhook error:", err?.message || "Unexpected error");
    return res.status(500).json({ status: "ERROR", error: "Webhook processing failure" });
  }
}
