import crypto from "node:crypto";
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

function mapStatus(cfOrderStatus?: string, cfPaymentStatus?: string) {
  const payUpper = (cfPaymentStatus || "").toUpperCase();
  const orderUpper = (cfOrderStatus || "").toUpperCase();
  if (payUpper === "SUCCESS" || orderUpper === "PAID") return "SUCCESS";
  if (payUpper === "USER_DROPPED" || payUpper === "NOT_ATTEMPTED") return "USER_DROPPED";
  if (payUpper === "CANCELLED" || payUpper === "VOID") return "CANCELLED";
  if (payUpper === "FAILED" || orderUpper === "EXPIRED") return "FAILED";
  if (orderUpper === "TERMINATED" || orderUpper === "TERMINATION_REQUESTED") return "CANCELLED";
  return "PENDING";
}

function extractPaymentMethod(pm: any): string {
  if (!pm) return "Cashfree PG";
  if (typeof pm === "string") return pm.toUpperCase();
  if (typeof pm === "object") {
    const keys = Object.keys(pm);
    if (keys.length > 0) return keys[0].toUpperCase();
  }
  return "Cashfree PG";
}

function buildReceipt(donorName: string, amount: number, txnRef: string, method: string, donorInfo?: any) {
  return {
    receiptNumber: `REC-SAP-${Date.now().toString().slice(-6)}`,
    transactionId: txnRef,
    amount,
    frequency: donorInfo?.frequency || "one-time",
    donorName,
    date: new Date().toLocaleDateString("hi-IN", { year: "numeric", month: "long", day: "numeric" }),
    organization: "समान अधिकार पार्टी (SAMAN ADHIKAR PARTY)",
    fecTaxNotice: "100% Tax Deduction Eligible under Section 80GGC (Individuals) / Section 80GGB (Companies) of the Income Tax Act, 1961.",
    paymentStatus: "SUCCESS",
    paymentMethod: method,
    paymentRef: txnRef,
    panNumber: donorInfo?.panNumber,
    donorEmail: donorInfo?.email,
    donorPhone: donorInfo?.phone,
    donorAddress: donorInfo?.address,
    donorState: donorInfo?.state || donorInfo?.precinct,
    citizenship: donorInfo?.citizenship || "INDIAN",
    partyPan: "AAOAS8885L",
    partyRegNumber: "56/112/2024/PPS-I (ECI Recognized)",
    bankDetails: {
      accountNo: "34465318239",
      ifsc: "SBIN0002467",
      upiId: "samanadhikarparty@sbi"
    }
  };
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");

  if (req.method === "OPTIONS") return res.status(200).end();

  const orderId = req.query?.orderId ? String(req.query.orderId) : "";
  if (!orderId) {
    return res.status(400).json({ success: false, error: "Order ID आवश्यक है।" });
  }

  try {
    const cfConfig = getCashfreeConfig();
    const db = readDb();
    if (!Array.isArray(db.paymentTransactions)) db.paymentTransactions = [];
    if (!Array.isArray(db.cashfreeOrders)) db.cashfreeOrders = [];
    if (!Array.isArray(db.donations)) db.donations = [];
    if (!Array.isArray(db.members)) db.members = [];

    const savedTx = db.paymentTransactions.find((t: any) => t.cashfreeOrderId === orderId) || null;

    let paymentStatus: string = savedTx?.paymentStatus || "PENDING";
    let cashfreePaymentId: string | null = savedTx?.cashfreePaymentId || null;
    let paymentMethod: string = savedTx?.paymentMethod || "Cashfree PG";
    let transactionDate: string | null = savedTx?.transactionDate || null;
    let failureReason: string | null = savedTx?.failureReason || null;
    let cfAmount: number = savedTx?.paymentAmount || 0;
    let details: any = null;

    if (cfConfig.IS_CONFIGURED && !savedTx?.isSimulated) {
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
        details = {
          order_id: orderDetails.order_id,
          cf_order_id: orderDetails.cf_order_id,
          order_status: orderDetails.order_status,
          order_amount: orderDetails.order_amount,
          order_currency: orderDetails.order_currency
        };
        cfAmount = Number(orderDetails.order_amount || cfAmount);

        let payList: any[] = [];
        try {
          const payResp = await fetch(`${cfConfig.API_BASE}/orders/${encodeURIComponent(orderId)}/payments`, {
            method: "GET",
            headers: {
              "x-api-version": cfConfig.API_VERSION,
              "x-client-id": cfConfig.APP_ID,
              "x-client-secret": cfConfig.SECRET_KEY
            }
          });
          if (payResp.ok) {
            const parsed = await payResp.json();
            if (Array.isArray(parsed)) payList = parsed;
          }
        } catch {}

        const relPay = payList.find((p: any) => p.payment_status === "SUCCESS") || payList[0] || null;
        if (relPay) {
          cashfreePaymentId = relPay.cf_payment_id ? String(relPay.cf_payment_id) : cashfreePaymentId;
          paymentMethod = extractPaymentMethod(relPay.payment_method);
          transactionDate = relPay.payment_completion_time || relPay.payment_time || new Date().toISOString();
          failureReason = relPay.error_details?.error_description || relPay.payment_message || failureReason;
        }

        paymentStatus = mapStatus(orderDetails.order_status, relPay?.payment_status);

        if (
          paymentStatus === "SUCCESS" &&
          savedTx?.paymentAmount &&
          Math.abs(cfAmount - Number(savedTx.paymentAmount)) >= 0.01
        ) {
          paymentStatus = "FAILED";
          failureReason = "Payment amount mismatch detected";
        }
      }
    } else if (savedTx) {
      if (savedTx.paymentStatus === "SUCCESS") {
        paymentStatus = "SUCCESS";
      } else if (["FAILED", "USER_DROPPED", "CANCELLED"].includes(savedTx.paymentStatus) || savedTx.simulatedLockPending) {
        paymentStatus = savedTx.paymentStatus;
      } else {
        paymentStatus = "SUCCESS";
        cashfreePaymentId = savedTx.cashfreePaymentId || `cf_sim_${Date.now().toString().slice(-8)}`;
        transactionDate = new Date().toISOString();
      }
    }

    const internalTransactionId = savedTx?.internalTransactionId || `TXN-SAP-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    if (savedTx) {
      savedTx.paymentStatus = paymentStatus;
      savedTx.cashfreePaymentId = cashfreePaymentId;
      savedTx.paymentMethod = paymentMethod;
      savedTx.transactionDate = transactionDate;
      savedTx.updatedDate = new Date().toISOString();
    }

    if (paymentStatus !== "SUCCESS") {
      writeDb(db);
      return res.status(200).json({
        success: false,
        paymentStatus,
        orderStatus: paymentStatus === "PENDING" ? "ACTIVE" : paymentStatus,
        orderId,
        internalTransactionId,
        cashfreePaymentId,
        transactionId: internalTransactionId,
        paymentAmount: cfAmount,
        currency: "INR",
        paymentMethod,
        transactionDate,
        failureReason,
        message: failureReason || "भुगतान पूर्ण नहीं हुआ अथवा प्रक्रिया में है।",
        details
      });
    }

    const orderType = savedTx?.orderType || (details?.order_note?.includes("Membership") ? "MEMBERSHIP" : "DONATION");
    const donorName = savedTx?.customerName || "समर्थक नागरिक";
    const displayRef = cashfreePaymentId ? `CF-PAY-${cashfreePaymentId}` : internalTransactionId;
    let receipt = savedTx?.receipt || null;
    let member = savedTx?.memberCard || null;

    if (orderType === "DONATION" && !receipt) {
      receipt = buildReceipt(donorName, cfAmount || 500, displayRef, paymentMethod, savedTx?.donorData);
      if (savedTx) savedTx.receipt = receipt;
      if (!db.donations.some((d: any) => d.id === `DON-${orderId}`)) {
        db.donations.unshift({
          id: `DON-${orderId}`,
          donorName,
          amount: cfAmount || 500,
          frequency: savedTx?.donorData?.frequency || "one-time",
          precinct: savedTx?.donorData?.donorState || "राष्ट्रीय मुख्यालय",
          timestamp: transactionDate || new Date().toISOString(),
          isAnonymous: Boolean(savedTx?.donorData?.isAnonymous),
          message: `Cashfree PG (${orderId})`,
          paymentMethod,
          utrNumber: displayRef
        });
      }
    } else if (orderType === "MEMBERSHIP" && !member) {
      member = {
        id: `MEM-${orderId}`,
        fullName: savedTx?.memberData?.fullName || donorName,
        phone: savedTx?.customerMobile || "",
        precinct: savedTx?.memberData?.precinct || "आगरा (Agra)",
        membershipTier: savedTx?.memberData?.membershipTier || "साधारण सदस्य",
        membershipFee: cfAmount || 100,
        joinedDate: new Date().toISOString().split("T")[0],
        memberCardId: `SAP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        paymentMethod,
        utrNumber: displayRef,
        isFeePaid: true
      };
      if (savedTx) savedTx.memberCard = member;
      if (!db.members.some((m: any) => m.id === `MEM-${orderId}`)) {
        db.members.unshift(member);
      }
    }

    writeDb(db);

    return res.status(200).json({
      success: true,
      paymentStatus: "SUCCESS",
      orderStatus: "PAID",
      orderId,
      internalTransactionId,
      cashfreePaymentId,
      transactionId: internalTransactionId,
      paymentAmount: cfAmount,
      currency: "INR",
      paymentMethod,
      transactionDate: transactionDate || new Date().toISOString(),
      orderType,
      receipt,
      member,
      details
    });
  } catch (err: any) {
    console.error("Vercel order-status error:", err?.message || "Unexpected error");
    return res.status(500).json({ success: false, error: "भुगतान स्थिति जांचने में तकनीकी त्रुटि।" });
  }
}
