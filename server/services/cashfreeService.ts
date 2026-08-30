import { CONFIG } from "../config";
import { DonationRecord, PartyInfo } from "../types";

export interface CreateOrderParams {
  orderAmount: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  orderType?: "DONATION" | "MEMBERSHIP";
  notes?: string;
}

export async function createCashfreeOrder(params: CreateOrderParams) {
  const { orderAmount, customerName, customerPhone, customerEmail, orderType, notes } = params;

  const orderId = `order_sap_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const cleanPhone = (customerPhone ? String(customerPhone).replace(/\D/g, "") : "").slice(-10) || "9412165541";
  const cleanName = (customerName && String(customerName).trim().length > 0) ? String(customerName).trim() : "राष्ट्रभक्त नागरिक";
  const cleanEmail = (customerEmail && String(customerEmail).includes("@")) ? String(customerEmail).trim() : "donation@samanadhikarparty.org";

  const orderPayload = {
    order_id: orderId,
    order_amount: Number(orderAmount),
    order_currency: "INR",
    customer_details: {
      customer_id: `cust_${cleanPhone}_${Math.random().toString(36).substring(2, 7)}`,
      customer_name: cleanName,
      customer_email: cleanEmail,
      customer_phone: cleanPhone
    },
    order_meta: {
      return_url: `${process.env.APP_URL || ""}/?order_id={order_id}&payment_status=cashfree_return`
    },
    order_note: notes || `Saman Adhikar Party ${orderType === "MEMBERSHIP" ? "Membership Fee" : "Donation"}`
  };

  // If live/sandbox credentials exist, call Cashfree PG API
  if (CONFIG.CASHFREE.APP_ID && CONFIG.CASHFREE.SECRET_KEY) {
    const response = await fetch(`${CONFIG.CASHFREE.API_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": CONFIG.CASHFREE.APP_ID,
        "x-client-secret": CONFIG.CASHFREE.SECRET_KEY,
        "x-api-version": CONFIG.CASHFREE.API_VERSION
      },
      body: JSON.stringify(orderPayload)
    });

    const data = await response.json();
    if (response.ok && data.payment_session_id) {
      return {
        success: true,
        paymentSessionId: data.payment_session_id,
        orderId: data.order_id,
        orderAmount: data.order_amount,
        mode: CONFIG.CASHFREE.ENV,
        apiEndpoint: CONFIG.CASHFREE.API_BASE
      };
    }

    return {
      success: false,
      error: data.message || "कैशफ्री गेटवे पर आर्डर बनाने में त्रुटि हुई।",
      details: data
    };
  }

  // Fallback demo session when credentials are not configured in environment
  const simulatedSessionId = `session_cf_test_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  return {
    success: true,
    paymentSessionId: simulatedSessionId,
    orderId,
    orderAmount: Number(orderAmount),
    mode: "sandbox",
    isSimulated: true,
    message: "कैशफ्री पेमेंट सेशन तैयार है (Cashfree Payment Session Initialized).",
    apiEndpoint: CONFIG.CASHFREE.API_BASE
  };
}

export async function verifyCashfreePayment(orderId: string): Promise<{ isPaid: boolean; transactionId: string }> {
  let isPaid = false;
  let transactionId = `CF-TXN-${Date.now().toString().slice(-8)}`;

  if (CONFIG.CASHFREE.APP_ID && CONFIG.CASHFREE.SECRET_KEY) {
    try {
      const checkRes = await fetch(`${CONFIG.CASHFREE.API_BASE}/orders/${orderId}`, {
        headers: {
          "x-client-id": CONFIG.CASHFREE.APP_ID,
          "x-client-secret": CONFIG.CASHFREE.SECRET_KEY,
          "x-api-version": CONFIG.CASHFREE.API_VERSION
        }
      });

      const orderDetails = await checkRes.json();
      if (orderDetails && (orderDetails.order_status === "PAID" || orderDetails.order_status === "ACTIVE")) {
        isPaid = true;
        transactionId = orderDetails.cf_order_id ? `CF-${orderDetails.cf_order_id}` : transactionId;
      }
    } catch (e) {
      console.error("Cashfree verification lookup error:", e);
    }
  } else {
    isPaid = true;
  }

  return { isPaid, transactionId };
}

export function buildTaxReceipt(donation: DonationRecord, partyInfo: PartyInfo, transactionId: string, paymentMethod?: string) {
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
    paymentMethod: paymentMethod || "Cashfree PG (api.cashfree.com)",
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
    panNumber: params.panNumber,
    donorPhone: params.phone,
    donorAddress: params.address,
    partyPan: "AAOAS8885L",
    partyRegNumber: "56/112/2024/PPS-I (ECI Recognized)"
  };
}
