import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const config = {
  api: {
    bodyParser: false
  }
};

function getCashfreeConfig() {
  const appId = (process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID || "").trim();
  const secretKey = (process.env.CASHFREE_SECRET_KEY || "").trim();
  const explicitEnv = (process.env.CASHFREE_ENV || "").trim().toUpperCase();

  let isProduction = false;
  if (explicitEnv === "PRODUCTION" || explicitEnv === "PROD") {
    isProduction = true;
  } else if (explicitEnv === "SANDBOX" || explicitEnv === "TEST") {
    isProduction = false;
  } else if (appId && secretKey) {
    const isTestCreds = appId.toUpperCase().startsWith("TEST") || secretKey.includes("_test_");
    isProduction = !isTestCreds;
  }

  return {
    API_BASE: isProduction ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg",
    APP_ID: appId,
    SECRET_KEY: secretKey,
    API_VERSION: (process.env.CASHFREE_API_VERSION || "2026-01-01").trim(),
    IS_CONFIGURED: Boolean(appId && secretKey)
  };
}

function getDbFilePath() {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
  const dataDir = isServerless ? path.join("/tmp", "data") : path.join(process.cwd(), "data");
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  } catch {}
  return path.join(dataDir, "production_db.json");
}

function readDb(): any {
  const dbFile = getDbFilePath();
  try {
    if (fs.existsSync(dbFile)) return JSON.parse(fs.readFileSync(dbFile, "utf-8"));
  } catch {}
  return { donations: [], members: [], cashfreeOrders: [], paymentTransactions: [] };
}

function writeDb(db: any) {
  const dbFile = getDbFilePath();
  try {
    fs.writeFileSync(dbFile, JSON.stringify(db, null, 2), "utf-8");
  } catch {}
}

async function readRawBody(req: any): Promise<string> {
  if (typeof req.rawBody === "string") return req.rawBody;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  if (typeof req.body === "string") return req.body;

  if (req && typeof req.on === "function" && !req.readableEnded) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk, "utf8") : chunk);
    }
    if (chunks.length > 0) return Buffer.concat(chunks).toString("utf8");
  }

  if (req.body && typeof req.body === "object") return JSON.stringify(req.body);
  return "";
}

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method Not Allowed" });

  try {
    const rawBody = await readRawBody(req);
    const signatureHeader = req.headers?.["x-webhook-signature"] as string | undefined;
    const timestampHeader = req.headers?.["x-webhook-timestamp"] as string | undefined;

    const cfConfig = getCashfreeConfig();
    const secretKey = cfConfig.SECRET_KEY || process.env.CASHFREE_WEBHOOK_TEST_SECRET || "";

    if (secretKey) {
      if (!signatureHeader || !timestampHeader || !rawBody) {
        return res.status(401).json({ success: false, status: "INVALID_SIGNATURE", error: "Missing webhook headers" });
      }
      const expected = crypto.createHmac("sha256", secretKey).update(`${timestampHeader}${rawBody}`).digest("base64");
      const sigBuf = Buffer.from(signatureHeader.trim(), "utf8");
      const expBuf = Buffer.from(expected, "utf8");
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return res.status(401).json({ success: false, status: "INVALID_SIGNATURE", error: "Invalid webhook signature" });
      }
    }

    const webhookData = rawBody ? JSON.parse(rawBody) : (req.body || {});
    const eventType = String(webhookData?.type || "PAYMENT_EVENT");
    const orderId = webhookData?.data?.order?.order_id || webhookData?.order_id;
    const cfPaymentId = webhookData?.data?.payment?.cf_payment_id ? String(webhookData.data.payment.cf_payment_id) : null;
    const payStatusRaw = String(webhookData?.data?.payment?.payment_status || "").toUpperCase();

    if (!orderId) {
      return res.status(200).json({ status: "IGNORED", duplicate: false });
    }

    const db = readDb();
    if (!Array.isArray(db.paymentTransactions)) db.paymentTransactions = [];
    const tx = db.paymentTransactions.find((t: any) => t.cashfreeOrderId === String(orderId));
    const eventKey = `${eventType}:${orderId}:${cfPaymentId || "none"}:${payStatusRaw || "none"}:${timestampHeader || ""}`;

    if (tx) {
      if (!Array.isArray(tx.processedWebhookEvents)) tx.processedWebhookEvents = [];
      if (tx.processedWebhookEvents.includes(eventKey)) {
        return res.status(200).json({ status: "OK", duplicate: true, orderId });
      }
      tx.processedWebhookEvents.push(eventKey);

      if (cfConfig.IS_CONFIGURED && !tx.isSimulated) {
        const orderResp = await fetch(`${cfConfig.API_BASE}/orders/${encodeURIComponent(orderId)}`, {
          method: "GET",
          headers: {
            "x-api-version": cfConfig.API_VERSION,
            "x-client-id": cfConfig.APP_ID,
            "x-client-secret": cfConfig.SECRET_KEY
          }
        });
        if (orderResp.ok) {
          const orderDetails: any = await orderResp.json();
          if (orderDetails?.order_status === "PAID" && Math.abs(Number(orderDetails.order_amount) - Number(tx.paymentAmount)) < 0.01) {
            tx.paymentStatus = "SUCCESS";
            tx.cashfreePaymentId = cfPaymentId || tx.cashfreePaymentId;
            tx.transactionDate = new Date().toISOString();
          }
        }
      } else if (payStatusRaw) {
        tx.paymentStatus = payStatusRaw === "SUCCESS" ? "SUCCESS" : payStatusRaw;
        tx.cashfreePaymentId = cfPaymentId || tx.cashfreePaymentId;
        tx.transactionDate = payStatusRaw === "SUCCESS" ? new Date().toISOString() : tx.transactionDate;
      }
      tx.updatedDate = new Date().toISOString();
      writeDb(db);
    }

    return res.status(200).json({ status: "OK", duplicate: false, orderId });
  } catch (err: any) {
    console.error("Vercel webhook error:", err?.message || "Unexpected error");
    return res.status(500).json({ status: "ERROR", error: "Webhook processing failure" });
  }
}
