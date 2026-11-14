import crypto from "crypto";
import { Cashfree, CFEnvironment } from "cashfree-pg";
import { CONFIG, getCashfreeConfig } from "../config";
import {
  DonationRecord,
  MemberRecord,
  PartyInfo,
  CashfreeOrderRecord,
  PaymentTransactionRecord,
  PaymentGatewayStatus
} from "../types";
import {
  saveCashfreeOrder,
  getCashfreeOrder,
  updateCashfreeOrder,
  createPaymentTransaction,
  getPaymentTransactionByOrderId,
  getPaymentTransactionByIdempotencyKey,
  getPaymentTransactionByCashfreePaymentId,
  updatePaymentTransaction,
  markWebhookEventProcessed
} from "../database/repositories/cashfreeRepository";
import { addDonation, getDonations } from "../database/repositories/donationRepository";
import { addMember, getMembers } from "../database/repositories/memberRepository";
import { getPartyInfo } from "../database/repositories/partyRepository";

export const SERVER_MEMBERSHIP_PRICING: Record<string, number> = {
  "साधारण सदस्य": 10,
  "सक्रिय सदस्य": 275,
  "सक्रिय सहयोग सदस्यता": 500
};

export interface CreateOrderParams {
  orderAmount: number;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  orderType?: "DONATION" | "MEMBERSHIP";
  notes?: string;
  appUrl?: string;
  idempotencyKey?: string;
  donorData?: Partial<DonationRecord> & { donorState?: string; isAnonymous?: boolean };
  memberData?: Partial<MemberRecord> & { isCustomFee?: boolean };
}

function mapGatewayStatusToLegacyOrderStatus(
  status: PaymentGatewayStatus
): CashfreeOrderRecord["orderStatus"] {
  switch (status) {
    case "SUCCESS":
      return "PAID";
    case "FAILED":
      return "FAILED";
    case "CANCELLED":
      return "CANCELLED";
    case "USER_DROPPED":
      return "USER_DROPPED";
    case "PENDING":
    default:
      return "ACTIVE";
  }
}

export function mapCashfreeStatesToGatewayStatus(
  cfOrderStatus?: string,
  cfPaymentStatus?: string
): PaymentGatewayStatus {
  const payUpper = (cfPaymentStatus || "").toUpperCase();
  const orderUpper = (cfOrderStatus || "").toUpperCase();

  if (payUpper === "SUCCESS" || orderUpper === "PAID") {
    return "SUCCESS";
  }
  if (payUpper === "USER_DROPPED" || payUpper === "NOT_ATTEMPTED") {
    return "USER_DROPPED";
  }
  if (payUpper === "CANCELLED" || payUpper === "VOID") {
    return "CANCELLED";
  }
  if (payUpper === "FAILED" || orderUpper === "EXPIRED") {
    return "FAILED";
  }
  if (orderUpper === "TERMINATED" || orderUpper === "TERMINATION_REQUESTED") {
    return "CANCELLED";
  }
  return "PENDING";
}

function extractPaymentMethodLabel(paymentMethodObj: any): string {
  if (!paymentMethodObj) return "Cashfree PG";
  if (typeof paymentMethodObj === "string") {
    return paymentMethodObj.toUpperCase();
  }
  if (typeof paymentMethodObj === "object") {
    const keys = Object.keys(paymentMethodObj);
    if (keys.length > 0) {
      return keys[0].toUpperCase();
    }
  }
  return "Cashfree PG";
}

/**
 * Initializes Cashfree Server SDK instance according to Cashfree PG v3 spec.
 */
export function getCashfreeClient(): Cashfree | null {
  const cfConfig = getCashfreeConfig();
  if (!cfConfig.IS_CONFIGURED) {
    return null;
  }
  const env = cfConfig.ENV === "production" ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
  const client = new Cashfree(env, cfConfig.APP_ID, cfConfig.SECRET_KEY);
  client.XApiVersion = cfConfig.API_VERSION || "2026-01-01";
  return client;
}

/**
 * Validates and creates a Cashfree PG v3 order & initializes paymentTransactions record.
 */
export async function createCashfreeOrder(params: CreateOrderParams) {
  const {
    orderAmount,
    customerId: requestedCustomerId,
    customerName,
    customerPhone,
    customerEmail,
    orderType: rawOrderType,
    notes,
    appUrl,
    idempotencyKey,
    donorData,
    memberData
  } = params;

  const cfConfig = getCashfreeConfig();
  const orderType: "DONATION" | "MEMBERSHIP" =
    rawOrderType === "MEMBERSHIP" ? "MEMBERSHIP" : "DONATION";

  // 1. Strict Input & Amount Validation
  const parsedAmount = Number(orderAmount);
  if (!Number.isFinite(parsedAmount) || parsedAmount < 1 || parsedAmount > 10000000) {
    return {
      success: false,
      error: "कृपया ₹1 से ₹1,00,00,000 के बीच मान्य भुगतान राशि दर्ज करें।"
    };
  }
  const validatedAmount = Math.round(parsedAmount * 100) / 100;

  // 2. Server-side Pricing Verification for Standard Membership Tiers
  if (orderType === "MEMBERSHIP" && memberData?.membershipTier && !memberData.isCustomFee) {
    const expectedFee = SERVER_MEMBERSHIP_PRICING[memberData.membershipTier];
    if (expectedFee !== undefined && Math.abs(validatedAmount - expectedFee) > 0.01) {
      return {
        success: false,
        error: `सदस्यता शुल्क सत्यापन त्रुटि: "${memberData.membershipTier}" के लिए मान्य शुल्क ₹${expectedFee} है।`
      };
    }
  }

  // Sanitize Customer Details
  const digitsOnlyPhone = (customerPhone ? String(customerPhone).replace(/\D/g, "") : "").slice(-10);
  if (customerPhone && digitsOnlyPhone.length < 10) {
    return {
      success: false,
      error: "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।"
    };
  }
  const cleanPhone = digitsOnlyPhone || "9412165541";
  const cleanName =
    customerName && String(customerName).trim().length > 0
      ? String(customerName).trim().slice(0, 100)
      : "राष्ट्रभक्त नागरिक";

  const rawEmail = customerEmail ? String(customerEmail).trim() : "";
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail);
  const cleanEmail = isEmailValid ? rawEmail : "donation@samanadhikarparty.org";

  // 3. Idempotency check (prevents duplicate active orders on accidental double-submit)
  if (idempotencyKey) {
    const existingPending = await getPaymentTransactionByIdempotencyKey(idempotencyKey);
    if (existingPending && Math.abs(existingPending.paymentAmount - validatedAmount) < 0.01) {
      const targetUrl = existingPending.isSimulated
        ? `${appUrl || "https://samanadhikar.in"}/cashfree-gateway?order_id=${encodeURIComponent(existingPending.cashfreeOrderId)}&session_id=${encodeURIComponent(existingPending.paymentSessionId)}&amount=${existingPending.paymentAmount}&name=${encodeURIComponent(existingPending.customerName)}&phone=${existingPending.customerMobile}&type=${existingPending.orderType}&tx_id=${encodeURIComponent(existingPending.internalTransactionId)}`
        : `${cfConfig.CHECKOUT_BASE}/#${existingPending.paymentSessionId}`;

      return {
        success: true,
        idempotentReplay: true,
        internalTransactionId: existingPending.internalTransactionId,
        paymentSessionId: existingPending.paymentSessionId,
        orderId: existingPending.cashfreeOrderId,
        customerId: existingPending.customerId,
        orderAmount: existingPending.paymentAmount,
        currency: "INR",
        paymentUrl: targetUrl,
        mode: cfConfig.ENV,
        environment: cfConfig.ENV_NAME,
        isSimulated: Boolean(existingPending.isSimulated),
        apiVersion: cfConfig.API_VERSION,
        apiEndpoint: cfConfig.ORDERS_ENDPOINT
      };
    }
  }

  // 4. Generate Unique Order ID, Internal Transaction ID & Customer ID
  const uniqueSuffix = crypto.randomBytes(3).toString("hex");
  const orderId = `order_sap_${Date.now()}_${uniqueSuffix}`;
  const internalTransactionId = `TXN-SAP-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
  const customerId =
    requestedCustomerId && String(requestedCustomerId).trim()
      ? String(requestedCustomerId).trim().slice(0, 48)
      : `cust_${cleanPhone}_${crypto.randomBytes(3).toString("hex")}`;

  // Build HTTPS return_url (<= 250 chars) & notify_url (<= 250 chars)
  const fallbackBase = process.env.APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://samanadhikar.in");
  const rawBase = appUrl && appUrl.startsWith("http") ? appUrl.replace(/\/$/, "") : fallbackBase.replace(/\/$/, "");

  let cfHost = "samanadhikar.in";
  if (rawBase.startsWith("https://") && !rawBase.includes("localhost") && !rawBase.includes("127.0.0.1")) {
    try {
      const parsed = new URL(rawBase);
      if (parsed.host && !parsed.host.includes("localhost") && !parsed.host.includes("127.0.0.1")) {
        cfHost = parsed.host;
      }
    } catch {
      cfHost = "samanadhikar.in";
    }
  }
  const httpsBase = `https://${cfHost}`;
  const localOrLiveBase = rawBase.startsWith("http") ? rawBase : httpsBase;

  let returnUrl = `${httpsBase}/?order_id={order_id}&payment_status=cashfree_return`;
  if (returnUrl.length > 250) {
    returnUrl = `${httpsBase}/?order_id={order_id}`;
  }
  if (returnUrl.length > 250) {
    returnUrl = returnUrl.substring(0, 250);
  }

  let notifyUrl = `${httpsBase}/api/cashfree/webhook`;
  if (notifyUrl.length > 250) {
    notifyUrl = notifyUrl.substring(0, 250);
  }

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

  // 5. Call Cashfree Orders API v3 when backend credentials are configured
  if (cfConfig.IS_CONFIGURED) {
    let data: any = null;
    let apiErrorMsg = "कैशफ्री गेटवे पर आर्डर बनाने में त्रुटि हुई।";

    try {
      const apiResponse = await fetch(cfConfig.ORDERS_ENDPOINT, {
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

      data = await apiResponse.json();
      if (!apiResponse.ok) {
        apiErrorMsg = data?.message || apiErrorMsg;
        data = null;
      }
    } catch (err: any) {
      console.error("Cashfree REST order creation error:", err?.message || "Network failure");
    }

    // Fallback to official cashfree-pg Server SDK if REST call encountered a transient network issue
    if (!data || !data.payment_session_id) {
      const client = getCashfreeClient();
      if (client) {
        try {
          const response = await client.PGCreateOrder(orderPayload);
          if (response?.data?.payment_session_id) {
            data = response.data;
          }
        } catch (sdkErr: any) {
          apiErrorMsg = sdkErr?.response?.data?.message || apiErrorMsg;
          console.error("Cashfree SDK order creation error:", sdkErr?.response?.data?.message || sdkErr?.message || "SDK failure");
        }
      }
    }

    if (data && data.payment_session_id) {
      const resolvedOrderId = data.order_id || orderId;
      const paymentUrl = `${cfConfig.CHECKOUT_BASE}/#${data.payment_session_id}`;

      const txRecord: PaymentTransactionRecord = {
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
        donorData: donorData || {
          donorName: cleanName,
          amount: validatedAmount,
          phone: cleanPhone,
          email: cleanEmail
        },
        memberData
      };
      await createPaymentTransaction(txRecord);

      const legacyOrder: CashfreeOrderRecord = {
        orderId: resolvedOrderId,
        paymentSessionId: data.payment_session_id,
        orderAmount: validatedAmount,
        orderType,
        orderStatus: "ACTIVE",
        donorData: txRecord.donorData,
        memberData,
        transactionId: internalTransactionId,
        createdAt: nowIso
      };
      await saveCashfreeOrder(legacyOrder);

      return {
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
      };
    }

    return {
      success: false,
      error: apiErrorMsg
    };
  }

  // 6. Sandbox Local Simulator Mode (when CASHFREE_APP_ID / CASHFREE_SECRET_KEY are not yet set in env)
  const simulatedSessionId = `session_cf_sandbox_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  const paymentUrl = `${localOrLiveBase}/cashfree-gateway?order_id=${encodeURIComponent(orderId)}&session_id=${encodeURIComponent(simulatedSessionId)}&amount=${validatedAmount}&name=${encodeURIComponent(cleanName)}&phone=${cleanPhone}&type=${orderType}&tx_id=${encodeURIComponent(internalTransactionId)}`;

  const simulatedTx: PaymentTransactionRecord = {
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
    donorData: donorData || {
      donorName: cleanName,
      amount: validatedAmount,
      phone: cleanPhone,
      email: cleanEmail
    },
    memberData
  };
  await createPaymentTransaction(simulatedTx);

  const simulatedRecord: CashfreeOrderRecord = {
    orderId,
    paymentSessionId: simulatedSessionId,
    orderAmount: validatedAmount,
    orderType,
    orderStatus: "ACTIVE",
    donorData: simulatedTx.donorData,
    memberData,
    transactionId: internalTransactionId,
    createdAt: nowIso
  };
  await saveCashfreeOrder(simulatedRecord);

  return {
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
    message: "कैशफ्री सैंडबॉक्स पेमेंट सत्र तैयार है (Cashfree Sandbox Session Initialized).",
    apiVersion: cfConfig.API_VERSION,
    apiEndpoint: cfConfig.ORDERS_ENDPOINT
  };
}

/**
 * Fetches authoritative order and payment status directly from Cashfree PG v3 API.
 * Enforces server-side amount verification before confirming SUCCESS.
 */
export async function verifyCashfreePayment(orderId: string): Promise<{
  isPaid: boolean;
  paymentStatus: PaymentGatewayStatus;
  orderStatus: CashfreeOrderRecord["orderStatus"];
  cashfreePaymentId: string | null;
  transactionId: string;
  paymentMethod: string;
  transactionDate: string | null;
  verifiedAmount?: number;
  failureReason?: string | null;
  details?: any;
}> {
  const cfConfig = getCashfreeConfig();
  const savedTx = await getPaymentTransactionByOrderId(orderId);
  const savedLegacy = await getCashfreeOrder(orderId);

  let paymentStatus: PaymentGatewayStatus = savedTx?.paymentStatus || "PENDING";
  let cashfreePaymentId: string | null = savedTx?.cashfreePaymentId || null;
  let transactionId = savedTx?.internalTransactionId || `CF-TXN-${Date.now().toString().slice(-8)}`;
  let paymentMethod = savedTx?.paymentMethod || "Cashfree PG";
  let transactionDate: string | null = savedTx?.transactionDate || null;
  let verifiedAmount: number | undefined = savedTx?.paymentAmount ?? savedLegacy?.orderAmount;
  let failureReason: string | null = savedTx?.failureReason || null;
  let details: any = null;

  if (cfConfig.IS_CONFIGURED && !savedTx?.isSimulated) {
    let orderDetails: any = null;
    let payList: any[] = [];

    // Primary: Direct REST API call to Cashfree PG API v3
    try {
      const orderResp = await fetch(`${cfConfig.API_BASE}/orders/${encodeURIComponent(orderId)}`, {
        method: "GET",
        headers: {
          "x-api-version": cfConfig.API_VERSION,
          "x-client-id": cfConfig.APP_ID,
          "x-client-secret": cfConfig.SECRET_KEY
        }
      });
      if (orderResp.ok) {
        orderDetails = await orderResp.json();
      }
    } catch (restErr: any) {
      console.error("Cashfree REST order fetch error:", restErr?.message || "Fetch error");
    }

    // Fallback: Official Cashfree SDK
    if (!orderDetails) {
      const client = getCashfreeClient();
      if (client) {
        try {
          const orderRes = await client.PGFetchOrder(orderId);
          orderDetails = orderRes.data;
        } catch (sdkErr: any) {
          console.error("Cashfree SDK order fetch error:", sdkErr?.response?.data?.message || sdkErr?.message);
        }
      }
    }

    if (orderDetails) {
      details = {
        order_id: orderDetails.order_id,
        cf_order_id: orderDetails.cf_order_id,
        order_status: orderDetails.order_status,
        order_amount: orderDetails.order_amount,
        order_currency: orderDetails.order_currency
      };

      // Fetch individual payment attempts for exact payment status (SUCCESS/FAILED/PENDING/USER_DROPPED/CANCELLED)
      try {
        const payResp = await fetch(
          `${cfConfig.API_BASE}/orders/${encodeURIComponent(orderId)}/payments`,
          {
            method: "GET",
            headers: {
              "x-api-version": cfConfig.API_VERSION,
              "x-client-id": cfConfig.APP_ID,
              "x-client-secret": cfConfig.SECRET_KEY
            }
          }
        );
        if (payResp.ok) {
          const parsedPayments = await payResp.json();
          if (Array.isArray(parsedPayments)) payList = parsedPayments;
        }
      } catch {
        const client = getCashfreeClient();
        if (client) {
          try {
            const payRes = await client.PGOrderFetchPayments(orderId);
            if (Array.isArray(payRes.data)) payList = payRes.data;
          } catch {}
        }
      }

      const relevantPayment =
        payList.find((p: any) => p.payment_status === "SUCCESS") ||
        payList[0] ||
        null;

      if (relevantPayment) {
        cashfreePaymentId = relevantPayment.cf_payment_id ? String(relevantPayment.cf_payment_id) : cashfreePaymentId;
        transactionId = cashfreePaymentId ? `CF-PAY-${cashfreePaymentId}` : transactionId;
        paymentMethod = extractPaymentMethodLabel(relevantPayment.payment_method);
        transactionDate = relevantPayment.payment_completion_time || relevantPayment.payment_time || new Date().toISOString();
        if (relevantPayment.error_details?.error_description) {
          failureReason = relevantPayment.error_details.error_description;
        } else if (relevantPayment.payment_message) {
          failureReason = relevantPayment.payment_message;
        }
      }

      paymentStatus = mapCashfreeStatesToGatewayStatus(
        orderDetails.order_status,
        relevantPayment?.payment_status
      );

      // Server-side Amount Integrity Check
      const cfAmount = Number(orderDetails.order_amount);
      const expectedAmount = savedTx?.paymentAmount ?? savedLegacy?.orderAmount;
      if (
        paymentStatus === "SUCCESS" &&
        expectedAmount !== undefined &&
        Number.isFinite(cfAmount) &&
        Math.abs(cfAmount - Number(expectedAmount)) >= 0.01
      ) {
        paymentStatus = "FAILED";
        failureReason = `भुगतान राशि सत्यापन असफल (Expected ₹${expectedAmount}, Received ₹${cfAmount})`;
      } else if (Number.isFinite(cfAmount)) {
        verifiedAmount = cfAmount;
      }

      if (paymentStatus === "SUCCESS") {
        failureReason = null;
        if (!transactionDate) transactionDate = new Date().toISOString();
      }
    } else {
      // Could not reach Cashfree API to confirm - keep PENDING safely (never fake SUCCESS)
      paymentStatus = savedTx?.paymentStatus || "PENDING";
      failureReason = "कैशफ्री सर्वर से भुगतान की पुष्टि प्राप्त नहीं हो सकी। कृपया कुछ क्षण बाद पुनः जांचें।";
    }
  } else {
    // Sandbox simulator mode (no live/sandbox merchant keys configured in env)
    if (savedTx) {
      if (savedTx.paymentStatus === "SUCCESS") {
        paymentStatus = "SUCCESS";
        cashfreePaymentId = savedTx.cashfreePaymentId || `cf_sim_${Date.now().toString().slice(-8)}`;
        transactionId = savedTx.internalTransactionId;
        paymentMethod = savedTx.paymentMethod || "Cashfree Sandbox Simulator";
        transactionDate = savedTx.transactionDate || new Date().toISOString();
      } else if (
        savedTx.paymentStatus === "FAILED" ||
        savedTx.paymentStatus === "USER_DROPPED" ||
        savedTx.paymentStatus === "CANCELLED"
      ) {
        paymentStatus = savedTx.paymentStatus;
        failureReason = savedTx.failureReason || `Payment ${savedTx.paymentStatus}`;
      } else if (savedTx.simulatedLockPending) {
        paymentStatus = "PENDING";
        failureReason = "भुगतान बैंक द्वारा सत्यापन की प्रतीक्षा में है (Pending Confirmation)";
      } else {
        // Auto-complete simulated order when queried without an explicit failure/pending override
        paymentStatus = "SUCCESS";
        cashfreePaymentId = savedTx.cashfreePaymentId || `cf_sim_${Date.now().toString().slice(-8)}`;
        transactionId = savedTx.internalTransactionId;
        paymentMethod = savedTx.paymentMethod || "Cashfree Sandbox Simulator";
        transactionDate = new Date().toISOString();
      }
    } else {
      paymentStatus = "PENDING";
      failureReason = "Order not found in transaction ledger";
    }
  }

  return {
    isPaid: paymentStatus === "SUCCESS",
    paymentStatus,
    orderStatus: mapGatewayStatusToLegacyOrderStatus(paymentStatus),
    cashfreePaymentId,
    transactionId,
    paymentMethod,
    transactionDate,
    verifiedAmount,
    failureReason,
    details
  };
}

/**
 * Verifies payment status on the server, updates transaction ledger, and records Donation/Member safely (idempotent).
 */
export async function processOrderCompletion(
  orderId: string,
  customDonorData?: any,
  customMemberData?: any,
  customPaymentMethod?: string,
  simulatedOutcome?: PaymentGatewayStatus,
  overrideCfPaymentId?: string
) {
  const cfConfig = getCashfreeConfig();
  const savedTx = await getPaymentTransactionByOrderId(orderId);
  const existingOrder = await getCashfreeOrder(orderId);

  // SECURITY: Only allow simulatedOutcome updates when merchant credentials are NOT configured and tx is simulated
  if (!cfConfig.IS_CONFIGURED && (!savedTx || savedTx.isSimulated) && (simulatedOutcome || overrideCfPaymentId)) {
    const targetStatus = simulatedOutcome || savedTx?.paymentStatus || "PENDING";
    const simPaymentId =
      overrideCfPaymentId ||
      savedTx?.cashfreePaymentId ||
      (targetStatus === "SUCCESS" || targetStatus === "FAILED"
        ? `cf_sim_${Date.now().toString().slice(-8)}`
        : null);
    await updatePaymentTransaction(orderId, {
      paymentStatus: targetStatus,
      cashfreePaymentId: simPaymentId,
      simulatedLockPending: targetStatus === "PENDING",
      paymentMethod: customPaymentMethod || savedTx?.paymentMethod || "Cashfree Sandbox Simulator",
      transactionDate: targetStatus === "SUCCESS" ? new Date().toISOString() : null,
      failureReason:
        targetStatus === "PENDING"
          ? "भुगतान बैंक द्वारा सत्यापन की प्रतीक्षा में है (Pending Confirmation)"
          : targetStatus !== "SUCCESS"
            ? `Simulated ${targetStatus} outcome`
            : null
    });
  }

  const verification = await verifyCashfreePayment(orderId);
  const {
    isPaid,
    paymentStatus,
    orderStatus,
    cashfreePaymentId,
    transactionId,
    paymentMethod,
    transactionDate,
    failureReason,
    details
  } = verification;

  const activePaymentMethod = customPaymentMethod || paymentMethod || "Cashfree PG";

  // Persist verified status to paymentTransactions & cashfreeOrders
  if (savedTx) {
    await updatePaymentTransaction(orderId, {
      paymentStatus,
      cashfreePaymentId: cashfreePaymentId || savedTx.cashfreePaymentId,
      paymentMethod: activePaymentMethod,
      transactionDate: transactionDate || savedTx.transactionDate,
      failureReason: paymentStatus === "PENDING" && failureReason === "EXPLICIT_PENDING_SIMULATION"
        ? "भुगतान बैंक द्वारा सत्यापन की प्रतीक्षा में है (Pending Confirmation)"
        : failureReason
    });
  }
  if (existingOrder) {
    await updateCashfreeOrder(orderId, {
      orderStatus,
      cashfreePaymentId: cashfreePaymentId || existingOrder.cashfreePaymentId,
      paymentMethod: activePaymentMethod
    });
  }

  // If NOT verified SUCCESS, do NOT generate receipts or insert donations/members
  if (!isPaid) {
    const statusMessages: Record<Exclude<PaymentGatewayStatus, "SUCCESS">, string> = {
      PENDING: "भुगतान अभी प्रक्रिया में है (Pending). बैंक से पुष्टि होते ही रसीद उपलब्ध हो जाएगी।",
      FAILED: failureReason || "भुगतान असफल रहा (Payment Failed). यदि राशि कटी है तो 3-5 कार्यदिवस में वापस हो जाएगी।",
      USER_DROPPED: "उपयोगकर्ता द्वारा चेकआउट बीच में छोड़ दिया गया (User Dropped). आप पुनः भुगतान कर सकते हैं।",
      CANCELLED: "भुगतान निरस्त कर दिया गया (Payment Cancelled). आप पुनः प्रयास कर सकते हैं।"
    };

    return {
      success: false,
      paymentStatus,
      orderStatus,
      orderId,
      internalTransactionId: savedTx?.internalTransactionId || transactionId,
      cashfreePaymentId,
      transactionId,
      paymentAmount: savedTx?.paymentAmount ?? existingOrder?.orderAmount,
      currency: "INR",
      paymentMethod: activePaymentMethod,
      transactionDate,
      failureReason,
      message: statusMessages[paymentStatus] || "भुगतान पूर्ण नहीं हुआ।",
      details
    };
  }

  // Duplicate payment check by cashfreePaymentId across other orders
  if (cashfreePaymentId) {
    const dupByCfPayId = await getPaymentTransactionByCashfreePaymentId(cashfreePaymentId);
    if (dupByCfPayId && dupByCfPayId.cashfreeOrderId !== orderId && dupByCfPayId.paymentStatus === "SUCCESS") {
      return {
        success: true,
        paymentStatus: "SUCCESS" as const,
        orderStatus: "PAID" as const,
        orderId,
        internalTransactionId: dupByCfPayId.internalTransactionId,
        cashfreePaymentId,
        transactionId: dupByCfPayId.internalTransactionId,
        paymentAmount: dupByCfPayId.paymentAmount,
        currency: "INR",
        paymentMethod: dupByCfPayId.paymentMethod || activePaymentMethod,
        transactionDate: dupByCfPayId.transactionDate,
        orderType: dupByCfPayId.orderType,
        receipt: dupByCfPayId.receipt,
        member: dupByCfPayId.memberCard,
        alreadyProcessed: true
      };
    }
  }

  // Already processed and paid? Return saved receipt/member idempotently
  if (savedTx?.paymentStatus === "SUCCESS" && (savedTx.receipt || savedTx.memberCard)) {
    return {
      success: true,
      paymentStatus: "SUCCESS" as const,
      orderStatus: "PAID" as const,
      orderId,
      internalTransactionId: savedTx.internalTransactionId,
      cashfreePaymentId: savedTx.cashfreePaymentId || cashfreePaymentId,
      transactionId: savedTx.internalTransactionId || transactionId,
      paymentAmount: savedTx.paymentAmount,
      currency: "INR",
      paymentMethod: savedTx.paymentMethod || activePaymentMethod,
      transactionDate: savedTx.transactionDate || transactionDate,
      orderType: savedTx.orderType,
      receipt: savedTx.receipt,
      member: savedTx.memberCard,
      alreadyProcessed: true
    };
  }

  if (existingOrder && existingOrder.orderStatus === "PAID" && (existingOrder.receipt || existingOrder.memberCard)) {
    return {
      success: true,
      paymentStatus: "SUCCESS" as const,
      orderStatus: "PAID" as const,
      orderId,
      internalTransactionId: savedTx?.internalTransactionId || existingOrder.transactionId || transactionId,
      cashfreePaymentId: existingOrder.cashfreePaymentId || cashfreePaymentId,
      transactionId: existingOrder.transactionId || transactionId,
      paymentAmount: existingOrder.orderAmount,
      currency: "INR",
      paymentMethod: existingOrder.paymentMethod || activePaymentMethod,
      transactionDate: existingOrder.completedAt || transactionDate,
      orderType: existingOrder.orderType,
      receipt: existingOrder.receipt,
      member: existingOrder.memberCard,
      alreadyProcessed: true
    };
  }

  const orderType = savedTx?.orderType || existingOrder?.orderType || (customMemberData ? "MEMBERSHIP" : "DONATION");
  // NEVER trust frontend amount overrides over server-side orderAmount
  const lockedAmount = savedTx?.paymentAmount ?? existingOrder?.orderAmount ?? Number(customDonorData?.amount || customMemberData?.membershipFee || 500);
  const donorInfo = savedTx?.donorData || existingOrder?.donorData || customDonorData;
  const memberInfo = savedTx?.memberData || existingOrder?.memberData || customMemberData;
  const partyInfo = await getPartyInfo();
  const displayTxnRef = cashfreePaymentId ? `CF-PAY-${cashfreePaymentId}` : (savedTx?.internalTransactionId || transactionId);

  let receipt: any = null;
  let member: any = null;

  if (orderType === "DONATION") {
    const allDonations = await getDonations();
    const existingDonation = allDonations.find(
      (d) => d.id === `DON-${orderId}` || (cashfreePaymentId && d.utrNumber === displayTxnRef)
    );

    if (existingDonation) {
      receipt = buildTaxReceipt(existingDonation, partyInfo, displayTxnRef, activePaymentMethod);
    } else {
      const newDonation: DonationRecord = {
        id: `DON-${orderId}`,
        donorName: donorInfo?.isAnonymous
          ? "गुप्त राष्ट्रभक्त (Anonymous Patriot)"
          : (donorInfo?.donorName || savedTx?.customerName || "समर्थक नागरिक"),
        amount: lockedAmount,
        frequency: donorInfo?.frequency || "one-time",
        precinct: donorInfo?.donorState || donorInfo?.precinct || "राष्ट्रीय मुख्यालय",
        timestamp: transactionDate || new Date().toISOString(),
        isAnonymous: Boolean(donorInfo?.isAnonymous),
        message: donorInfo?.message || `Cashfree PG Checkout (${orderId})`,
        citizenship: donorInfo?.citizenship || "INDIAN",
        phone: donorInfo?.phone || savedTx?.customerMobile,
        email: donorInfo?.email || savedTx?.customerEmail,
        state: donorInfo?.donorState || donorInfo?.state,
        passportNumber: donorInfo?.passportNumber,
        paymentMethod: activePaymentMethod,
        utrNumber: displayTxnRef
      };

      await addDonation(newDonation);
      receipt = buildTaxReceipt(newDonation, partyInfo, displayTxnRef, activePaymentMethod);
    }
  } else if (orderType === "MEMBERSHIP") {
    const allMembers = await getMembers();
    const existingMem = allMembers.find(
      (m) => m.id === `MEM-${orderId}` || (displayTxnRef && m.utrNumber === displayTxnRef)
    );

    if (existingMem) {
      member = existingMem;
    } else {
      const memberCardId = `SAP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newMember: MemberRecord = {
        id: `MEM-${orderId}`,
        fullName: String(memberInfo?.fullName || savedTx?.customerName || "समान अधिकार पार्टी सदस्य").trim(),
        email:
          memberInfo?.email ||
          savedTx?.customerEmail ||
          `${String(memberInfo?.phone || savedTx?.customerMobile || "member").trim()}@samanadhikarparty.org`,
        phone: String(memberInfo?.phone || savedTx?.customerMobile || "").trim(),
        precinct: memberInfo?.precinct || "आगरा (Agra)",
        membershipTier: memberInfo?.membershipTier || "साधारण सदस्य",
        membershipFee: lockedAmount,
        joinedDate: new Date().toISOString().split("T")[0],
        memberCardId,
        interests: memberInfo?.interests || ["समान अधिकार अभियान"],
        paymentMethod: activePaymentMethod,
        utrNumber: displayTxnRef,
        isFeePaid: true
      };

      await addMember(newMember);
      member = newMember;
    }
  }

  const completedAt = transactionDate || new Date().toISOString();

  await updatePaymentTransaction(orderId, {
    paymentStatus: "SUCCESS",
    cashfreePaymentId: cashfreePaymentId || savedTx?.cashfreePaymentId || displayTxnRef,
    paymentMethod: activePaymentMethod,
    transactionDate: completedAt,
    failureReason: null,
    receipt,
    memberCard: member
  });

  await updateCashfreeOrder(orderId, {
    orderStatus: "PAID",
    transactionId: savedTx?.internalTransactionId || displayTxnRef,
    cashfreePaymentId: cashfreePaymentId || displayTxnRef,
    paymentMethod: activePaymentMethod,
    receipt,
    memberCard: member,
    completedAt
  });

  return {
    success: true,
    paymentStatus: "SUCCESS" as const,
    orderStatus: "PAID" as const,
    orderId,
    internalTransactionId: savedTx?.internalTransactionId || displayTxnRef,
    cashfreePaymentId: cashfreePaymentId || displayTxnRef,
    transactionId: savedTx?.internalTransactionId || displayTxnRef,
    paymentAmount: lockedAmount,
    currency: "INR",
    paymentMethod: activePaymentMethod,
    transactionDate: completedAt,
    orderType,
    receipt,
    member
  };
}

/**
 * Verifies Cashfree Webhook HMAC-SHA256 signature using the exact raw request body.
 * Spec: Base64(HMAC-SHA256(x-webhook-timestamp + rawBody, SECRET_KEY))
 */
export function verifyCashfreeWebhookSignature(
  rawBody: string,
  signatureHeader?: string,
  timestampHeader?: string
): { valid: boolean; reason?: string } {
  const cfConfig = getCashfreeConfig();
  const secretKey = cfConfig.SECRET_KEY || process.env.CASHFREE_WEBHOOK_TEST_SECRET || "";

  if (!secretKey) {
    // Only reject if signature headers were explicitly sent without secret, or allow unsigned sandbox test payloads only when no credentials exist
    if (signatureHeader) {
      return { valid: false, reason: "Cashfree Secret Key not configured to verify signature" };
    }
    return { valid: true, reason: "SANDBOX_SIMULATION_NO_SECRET" };
  }

  if (!signatureHeader || !timestampHeader || !rawBody) {
    return { valid: false, reason: "Missing x-webhook-signature, x-webhook-timestamp, or rawBody" };
  }

  try {
    const signedPayload = `${timestampHeader}${rawBody}`;
    const expectedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(signedPayload)
      .digest("base64");

    const sigBuf = Buffer.from(signatureHeader.trim(), "utf8");
    const expBuf = Buffer.from(expectedSignature, "utf8");

    if (sigBuf.length !== expBuf.length) {
      return { valid: false, reason: "Signature length mismatch" };
    }

    const isMatch = crypto.timingSafeEqual(sigBuf, expBuf);
    return isMatch ? { valid: true } : { valid: false, reason: "HMAC signature mismatch" };
  } catch (err: any) {
    return { valid: false, reason: err?.message || "Signature verification failed" };
  }
}

/**
 * Handles verified Cashfree webhook event with duplicate event protection.
 */
export async function handleCashfreeWebhookEvent(
  webhookData: any,
  timestampHeader?: string
) {
  const eventType = String(webhookData?.type || "PAYMENT_EVENT");
  const orderId = webhookData?.data?.order?.order_id || webhookData?.order_id;
  const cfPaymentId = webhookData?.data?.payment?.cf_payment_id
    ? String(webhookData.data.payment.cf_payment_id)
    : undefined;
  const rawPaymentStatus = webhookData?.data?.payment?.payment_status;
  const rawPaymentMethod = webhookData?.data?.payment?.payment_method
    ? extractPaymentMethodLabel(webhookData.data.payment.payment_method)
    : undefined;

  if (!orderId) {
    return {
      status: "IGNORED",
      duplicate: false,
      message: "No order_id in webhook payload"
    };
  }

  const eventKey = `${eventType}:${orderId}:${cfPaymentId || "none"}:${rawPaymentStatus || "none"}:${timestampHeader || ""}`;
  const isNewEvent = await markWebhookEventProcessed(String(orderId), eventKey);

  if (!isNewEvent) {
    const existingTx = await getPaymentTransactionByOrderId(String(orderId));
    if (existingTx && existingTx.processedWebhookEvents?.includes(eventKey)) {
      return {
        status: "OK",
        duplicate: true,
        orderId,
        paymentStatus: existingTx.paymentStatus,
        message: "Duplicate webhook event safely ignored"
      };
    }
  }

  let simulatedOverride: PaymentGatewayStatus | undefined;
  const cfConfig = getCashfreeConfig();
  if (!cfConfig.IS_CONFIGURED && rawPaymentStatus) {
    simulatedOverride = mapCashfreeStatesToGatewayStatus(
      webhookData?.data?.order?.order_status,
      rawPaymentStatus
    );
  }

  const result = await processOrderCompletion(
    String(orderId),
    undefined,
    undefined,
    rawPaymentMethod,
    simulatedOverride,
    cfPaymentId
  );

  return {
    status: "OK",
    duplicate: false,
    orderId,
    paymentStatus: result.paymentStatus,
    success: result.success
  };
}

export function buildTaxReceipt(
  donation: DonationRecord,
  partyInfo: PartyInfo,
  transactionId: string,
  paymentMethod?: string
) {
  return {
    receiptNumber: `REC-SAP-${Date.now().toString().slice(-6)}`,
    transactionId,
    amount: donation.amount,
    frequency: donation.frequency,
    donorName: donation.donorName,
    date: new Date().toLocaleDateString("hi-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }),
    organization: "समान अधिकार पार्टी (SAMAN ADHIKAR PARTY)",
    fecTaxNotice: "100% Tax Deduction Eligible under Section 80GGC (Individuals) / Section 80GGB (Companies) of the Income Tax Act, 1961.",
    paymentStatus: "SUCCESS" as const,
    paymentMethod: paymentMethod || "Cashfree PG",
    paymentRef: transactionId,
    panNumber: donation.panNumber,
    donorEmail: donation.email,
    donorPhone: donation.phone,
    donorAddress: donation.address,
    donorState: donation.state,
    citizenship: donation.citizenship || "INDIAN",
    passportNumber: donation.passportNumber,
    partyPan: partyInfo?.panNumber || "AAOAS8885L",
    partyRegNumber: "56/112/2024/PPS-I (ECI Recognized)",
    bankDetails: {
      accountNo: partyInfo?.bankDetails?.accountNo || "34465318239",
      ifsc: partyInfo?.bankDetails?.ifscCode || "SBIN0002467",
      upiId: partyInfo?.bankDetails?.upiId || "samanadhikarparty@sbi"
    }
  };
}

export function generateSection80GGCReceipt(params: {
  donationId: string;
  donorName: string;
  amount: number;
  panNumber?: string;
  address?: string;
  phone?: string;
  transactionId?: string;
  paymentMethod?: string;
  timestamp?: string;
}) {
  return {
    receiptNumber: `REC-SAP-${Date.now().toString().slice(-6)}`,
    transactionId: params.transactionId || `TXN-${Date.now().toString().slice(-8)}`,
    amount: params.amount,
    frequency: "one-time",
    donorName: params.donorName,
    date: new Date(params.timestamp || Date.now()).toLocaleDateString("hi-IN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }),
    organization: "समान अधिकार पार्टी (SAMAN ADHIKAR PARTY)",
    fecTaxNotice: "100% Tax Deduction Eligible under Section 80GGC (Individuals) / Section 80GGB (Companies) of the Income Tax Act, 1961.",
    paymentStatus: "SUCCESS" as const,
    paymentMethod: params.paymentMethod || "UPI / Direct Transfer",
    paymentRef: params.transactionId || params.donationId,
    panNumber: params.panNumber,
    donorAddress: params.address,
    donorPhone: params.phone,
    partyPan: "AAOAS8885L",
    partyRegNumber: "56/112/2024/PPS-I (ECI Recognized)"
  };
}

export { CONFIG };
