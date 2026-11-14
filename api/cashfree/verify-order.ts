import fs from "node:fs";
import path from "node:path";

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

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method Not Allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { orderId, paymentMethod, simulatedOutcome } = body;

    if (!orderId) {
      return res.status(400).json({ success: false, error: "Order ID आवश्यक है।" });
    }

    const cfConfig = getCashfreeConfig();
    const db = readDb();
    if (!Array.isArray(db.paymentTransactions)) db.paymentTransactions = [];
    const tx = db.paymentTransactions.find((t: any) => t.cashfreeOrderId === String(orderId));

    if (!cfConfig.IS_CONFIGURED && (!tx || tx.isSimulated)) {
      const allowed = ["SUCCESS", "FAILED", "PENDING", "USER_DROPPED", "CANCELLED"];
      const outcome = allowed.includes(simulatedOutcome) ? simulatedOutcome : "SUCCESS";
      if (tx) {
        tx.paymentStatus = outcome;
        tx.simulatedLockPending = outcome === "PENDING";
        tx.paymentMethod = paymentMethod || tx.paymentMethod || "Cashfree Sandbox Simulator";
        if (outcome === "SUCCESS") {
          tx.cashfreePaymentId = tx.cashfreePaymentId || `cf_sim_${Date.now().toString().slice(-8)}`;
          tx.transactionDate = new Date().toISOString();
          tx.failureReason = null;
        } else {
          tx.failureReason = `Simulated ${outcome} outcome`;
        }
        tx.updatedDate = new Date().toISOString();
        writeDb(db);
      }

      if (outcome === "SUCCESS") {
        return res.status(200).json({
          success: true,
          paymentStatus: "SUCCESS",
          orderStatus: "PAID",
          orderId: String(orderId),
          internalTransactionId: tx?.internalTransactionId || `TXN-${Date.now()}`
        });
      }

      return res.status(outcome === "PENDING" ? 202 : 400).json({
        success: false,
        paymentStatus: outcome,
        orderStatus: outcome === "PENDING" ? "ACTIVE" : outcome,
        orderId: String(orderId),
        internalTransactionId: tx?.internalTransactionId || `TXN-${Date.now()}`
      });
    }

    // Live Cashfree verification
    const orderResp = await fetch(`${cfConfig.API_BASE}/orders/${encodeURIComponent(String(orderId))}`, {
      method: "GET",
      headers: {
        "x-api-version": cfConfig.API_VERSION,
        "x-client-id": cfConfig.APP_ID,
        "x-client-secret": cfConfig.SECRET_KEY
      }
    });

    if (!orderResp.ok) {
      return res.status(400).json({ success: false, paymentStatus: "FAILED", error: "Order verification failed" });
    }

    const orderDetails: any = await orderResp.json();
    const isPaid = orderDetails?.order_status === "PAID";
    return res.status(isPaid ? 200 : 202).json({
      success: isPaid,
      paymentStatus: isPaid ? "SUCCESS" : "PENDING",
      orderStatus: orderDetails?.order_status || "ACTIVE",
      orderId: String(orderId),
      internalTransactionId: tx?.internalTransactionId || `CF-${orderDetails?.cf_order_id || Date.now()}`
    });
  } catch (err: any) {
    console.error("Vercel verify-order error:", err?.message || "Unexpected error");
    return res.status(500).json({ success: false, error: "भुगतान सत्यापन में तकनीकी त्रुटि।" });
  }
}
