import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const SERVER_MEMBERSHIP_PRICING: Record<string, number> = {
  "साधारण सदस्य": 10,
  "सक्रिय सदस्य": 275,
  "सक्रिय सहयोग सदस्यता": 500
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
    ORDERS_ENDPOINT: isProduction
      ? "https://api.cashfree.com/pg/orders"
      : "https://sandbox.cashfree.com/pg/orders",
    CHECKOUT_BASE: isProduction
      ? "https://payments.cashfree.com/order"
      : "https://payments-test.cashfree.com/order",
    APP_ID: appId,
    SECRET_KEY: secretKey,
    API_VERSION: (process.env.CASHFREE_API_VERSION || "2026-01-01").trim(),
    ENV: isProduction ? "production" : "sandbox",
    ENV_NAME: isProduction ? "PRODUCTION" : "SANDBOX",
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
    if (fs.existsSync(dbFile)) {
      return JSON.parse(fs.readFileSync(dbFile, "utf-8"));
    }
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
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token, X-Idempotency-Key");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  try {
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
      customerId: requestedCustomerId,
      customerName,
      customerPhone,
      customerEmail,
      orderType: rawOrderType,
      notes,
      donorData,
      memberData,
      idempotencyKey: bodyIdemKey
    } = body;

    const orderType: "DONATION" | "MEMBERSHIP" =
      rawOrderType === "MEMBERSHIP" ? "MEMBERSHIP" : "DONATION";

    const parsedAmount = Number(orderAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 1 || parsedAmount > 10000000) {
      return res.status(400).json({
        success: false,
        error: "कृपया ₹1 से ₹1,00,00,000 के बीच मान्य भुगतान राशि दर्ज करें।"
      });
    }
    const validatedAmount = Math.round(parsedAmount * 100) / 100;

    if (orderType === "MEMBERSHIP" && memberData?.membershipTier && !memberData.isCustomFee) {
      const expectedFee = SERVER_MEMBERSHIP_PRICING[memberData.membershipTier];
      if (expectedFee !== undefined && Math.abs(validatedAmount - expectedFee) > 0.01) {
        return res.status(400).json({
          success: false,
          error: `सदस्यता शुल्क सत्यापन त्रुटि: "${memberData.membershipTier}" के लिए मान्य शुल्क ₹${expectedFee} है।`
        });
      }
    }

    const digitsOnlyPhone = (customerPhone ? String(customerPhone).replace(/\D/g, "") : "").slice(-10);
    if (customerPhone && digitsOnlyPhone.length < 10) {
      return res.status(400).json({ success: false, error: "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।" });
    }
    const cleanPhone = digitsOnlyPhone || "9412165541";
    const cleanName =
      customerName && String(customerName).trim().length > 0
        ? String(customerName).trim().slice(0, 100)
        : "राष्ट्रभक्त नागरिक";
    const rawEmail = customerEmail ? String(customerEmail).trim() : "";
    const cleanEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)
      ? rawEmail
      : "donation@samanadhikarparty.org";

    const headerIdempotency = req.headers?.["x-idempotency-key"];
    const idempotencyKey =
      typeof bodyIdemKey === "string" && bodyIdemKey.trim()
        ? bodyIdemKey.trim()
        : typeof headerIdempotency === "string"
          ? headerIdempotency.trim()
          : undefined;

    const cfConfig = getCashfreeConfig();
    const rawHost = req.headers?.["x-forwarded-host"] || req.headers?.host || "samanadhikar.in";
    const cfHost =
      typeof rawHost === "string" && !rawHost.includes("localhost") && !rawHost.includes("127.0.0.1")
        ? rawHost
        : "samanadhikar.in";
    const httpsBase = `https://${cfHost}`.replace(/\/$/, "");

    const db = readDb();
    if (!Array.isArray(db.paymentTransactions)) db.paymentTransactions = [];
    if (!Array.isArray(db.cashfreeOrders)) db.cashfreeOrders = [];

    if (idempotencyKey) {
      const existingPending = db.paymentTransactions.find(
        (tx: any) => tx.idempotencyKey === idempotencyKey && tx.paymentStatus === "PENDING"
      );
      if (existingPending && Math.abs(Number(existingPending.paymentAmount) - validatedAmount) < 0.01) {
        const replayUrl = existingPending.isSimulated
          ? `${httpsBase}/cashfree-gateway?order_id=${encodeURIComponent(existingPending.cashfreeOrderId)}&session_id=${encodeURIComponent(existingPending.paymentSessionId)}&amount=${existingPending.paymentAmount}&name=${encodeURIComponent(existingPending.customerName)}&phone=${existingPending.customerMobile}&type=${existingPending.orderType}&tx_id=${encodeURIComponent(existingPending.internalTransactionId)}`
          : `${cfConfig.CHECKOUT_BASE}/#${existingPending.paymentSessionId}`;

        return res.status(200).json({
          success: true,
          idempotentReplay: true,
          internalTransactionId: existingPending.internalTransactionId,
          paymentSessionId: existingPending.paymentSessionId,
          orderId: existingPending.cashfreeOrderId,
          customerId: existingPending.customerId,
          orderAmount: existingPending.paymentAmount,
          currency: "INR",
          paymentUrl: replayUrl,
          mode: cfConfig.ENV,
          environment: cfConfig.ENV_NAME,
          isSimulated: Boolean(existingPending.isSimulated),
          apiVersion: cfConfig.API_VERSION,
          apiEndpoint: cfConfig.ORDERS_ENDPOINT
        });
      }
    }

    const orderId = `order_sap_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const internalTransactionId = `TXN-SAP-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    const customerId =
      requestedCustomerId && String(requestedCustomerId).trim()
        ? String(requestedCustomerId).trim().slice(0, 48)
        : `cust_${cleanPhone}_${crypto.randomBytes(3).toString("hex")}`;

    let returnUrl = `${httpsBase}/?order_id={order_id}&payment_status=cashfree_return`;
    if (returnUrl.length > 250) returnUrl = `${httpsBase}/?order_id={order_id}`;
    if (returnUrl.length > 250) returnUrl = returnUrl.substring(0, 250);

    let notifyUrl = `${httpsBase}/api/cashfree/webhook`;
    if (notifyUrl.length > 250) notifyUrl = notifyUrl.substring(0, 250);

    const orderPayload = {
      order_id: orderId,
      order_amount: validatedAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: customerId,
        customer_name: cleanName,
        customer_email: cleanEmail,
        customer_phone: cleanPhone
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: notifyUrl
      },
      order_note:
        notes ||
        `Saman Adhikar Party ${orderType === "MEMBERSHIP" ? "Membership Registration" : "Rashtra Nirman Contribution"}`
    };

    const nowIso = new Date().toISOString();

    if (cfConfig.IS_CONFIGURED) {
      const cfResp = await fetch(cfConfig.ORDERS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-version": cfConfig.API_VERSION,
          "x-client-id": cfConfig.APP_ID,
          "x-client-secret": cfConfig.SECRET_KEY,
          ...(idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {})
        },
        body: JSON.stringify(orderPayload)
      });

      const data: any = await cfResp.json().catch(() => ({}));
      if (cfResp.ok && data?.payment_session_id) {
        const resolvedOrderId = data.order_id || orderId;
        const paymentUrl = `${cfConfig.CHECKOUT_BASE}/#${data.payment_session_id}`;

        const txRecord = {
          internalTransactionId,
          cashfreeOrderId: resolvedOrderId,
          cashfreePaymentId: null,
          paymentSessionId: data.payment_session_id,
          customerId,
          customerName: cleanName,
          customerEmail: cleanEmail,
          customerMobile: cleanPhone,
          paymentAmount: validatedAmount,
          currency: "INR",
          paymentStatus: "PENDING",
          paymentMethod: null,
          orderType,
          membershipTier: memberData?.membershipTier,
          transactionDate: null,
          createdDate: nowIso,
          updatedDate: nowIso,
          isSimulated: false,
          idempotencyKey,
          processedWebhookEvents: [],
          donorData: donorData || { donorName: cleanName, amount: validatedAmount, phone: cleanPhone, email: cleanEmail },
          memberData
        };

        db.paymentTransactions.unshift(txRecord);
        db.cashfreeOrders.unshift({
          orderId: resolvedOrderId,
          paymentSessionId: data.payment_session_id,
          orderAmount: validatedAmount,
          orderType,
          orderStatus: "ACTIVE",
          donorData: txRecord.donorData,
          memberData,
          transactionId: internalTransactionId,
          createdAt: nowIso
        });
        writeDb(db);

        return res.status(200).json({
          success: true,
          internalTransactionId,
          paymentSessionId: data.payment_session_id,
          orderId: resolvedOrderId,
          customerId,
          orderAmount: Number(data.order_amount || validatedAmount),
          currency: "INR",
          paymentUrl,
          returnUrl,
          mode: cfConfig.ENV,
          environment: cfConfig.ENV_NAME,
          isSimulated: false,
          apiVersion: cfConfig.API_VERSION,
          apiEndpoint: cfConfig.ORDERS_ENDPOINT
        });
      }

      return res.status(400).json({
        success: false,
        error: data?.message || "कैशफ्री गेटवे पर आर्डर बनाने में त्रुटि हुई।"
      });
    }

    // Fallback Sandbox Simulator Mode when keys are not yet configured
    const simulatedSessionId = `session_cf_sandbox_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const paymentUrl = `${httpsBase}/cashfree-gateway?order_id=${encodeURIComponent(orderId)}&session_id=${encodeURIComponent(simulatedSessionId)}&amount=${validatedAmount}&name=${encodeURIComponent(cleanName)}&phone=${cleanPhone}&type=${orderType}&tx_id=${encodeURIComponent(internalTransactionId)}`;

    const simulatedTx = {
      internalTransactionId,
      cashfreeOrderId: orderId,
      cashfreePaymentId: null,
      paymentSessionId: simulatedSessionId,
      customerId,
      customerName: cleanName,
      customerEmail: cleanEmail,
      customerMobile: cleanPhone,
      paymentAmount: validatedAmount,
      currency: "INR",
      paymentStatus: "PENDING",
      paymentMethod: null,
      orderType,
      membershipTier: memberData?.membershipTier,
      transactionDate: null,
      createdDate: nowIso,
      updatedDate: nowIso,
      isSimulated: true,
      idempotencyKey,
      processedWebhookEvents: [],
      donorData: donorData || { donorName: cleanName, amount: validatedAmount, phone: cleanPhone, email: cleanEmail },
      memberData
    };

    db.paymentTransactions.unshift(simulatedTx);
    db.cashfreeOrders.unshift({
      orderId,
      paymentSessionId: simulatedSessionId,
      orderAmount: validatedAmount,
      orderType,
      orderStatus: "ACTIVE",
      donorData: simulatedTx.donorData,
      memberData,
      transactionId: internalTransactionId,
      createdAt: nowIso
    });
    writeDb(db);

    return res.status(200).json({
      success: true,
      internalTransactionId,
      paymentSessionId: simulatedSessionId,
      orderId,
      customerId,
      orderAmount: validatedAmount,
      currency: "INR",
      paymentUrl,
      returnUrl,
      mode: "sandbox",
      environment: "SANDBOX",
      isSimulated: true,
      apiVersion: cfConfig.API_VERSION,
      apiEndpoint: cfConfig.ORDERS_ENDPOINT
    });
  } catch (err: any) {
    console.error("Vercel create-order error:", err?.message || "Unexpected error");
    return res.status(500).json({ success: false, error: "कैशफ्री आर्डर प्रक्रिया में तकनीकी त्रुटि।" });
  }
}
