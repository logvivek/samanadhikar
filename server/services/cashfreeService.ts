import { Cashfree, CFEnvironment } from "cashfree-pg";
import { CONFIG } from "../config";
import { DonationRecord, MemberRecord, PartyInfo, CashfreeOrderRecord } from "../types";
import { saveCashfreeOrder, getCashfreeOrder, updateCashfreeOrder } from "../database/repositories/cashfreeRepository";
import { addDonation, getDonations } from "../database/repositories/donationRepository";
import { addMember, getMembers } from "../database/repositories/memberRepository";
import { getPartyInfo } from "../database/repositories/partyRepository";

export interface CreateOrderParams {
  orderAmount: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  orderType?: "DONATION" | "MEMBERSHIP";
  notes?: string;
  appUrl?: string;
  donorData?: Partial<DonationRecord>;
  memberData?: Partial<MemberRecord>;
}

/**
 * Initializes Cashfree Server SDK instance according to https://www.cashfree.com/docs/api-reference/payments/sdk#server-sdk
 * Pointing to production endpoint https://api.cashfree.com/pg/orders by default.
 */
export function getCashfreeClient(): Cashfree | null {
  if (!CONFIG.CASHFREE.APP_ID || !CONFIG.CASHFREE.SECRET_KEY) {
    return null;
  }
  const isProduction = CONFIG.CASHFREE.ENV !== "sandbox";
  const env = isProduction ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
  return new Cashfree(env, CONFIG.CASHFREE.APP_ID, CONFIG.CASHFREE.SECRET_KEY);
}

export async function createCashfreeOrder(params: CreateOrderParams) {
  const { orderAmount, customerName, customerPhone, customerEmail, orderType, notes, appUrl, donorData, memberData } = params;

  const orderId = `order_sap_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const cleanPhone = (customerPhone ? String(customerPhone).replace(/\D/g, "") : "").slice(-10) || "9412165541";
  const cleanName = (customerName && String(customerName).trim().length > 0) ? String(customerName).trim() : "राष्ट्रभक्त नागरिक";
  const cleanEmail = (customerEmail && String(customerEmail).includes("@")) ? String(customerEmail).trim() : "donation@samanadhikarparty.org";

  // Clean absolute Base URL for Cashfree Return URL specification
  const fallbackBase = process.env.APP_URL || "https://ais-dev-hj4se4pfjscomqdajpxts7-744727416675.asia-southeast1.run.app";
  const baseUrl = (appUrl && appUrl.startsWith("http")) ? appUrl.replace(/\/$/, "") : fallbackBase.replace(/\/$/, "");
  
  // Return URL with dynamic {order_id} placeholder per Cashfree documentation
  const returnUrl = `${baseUrl}/?order_id={order_id}&payment_status=cashfree_return`;
  const notifyUrl = `${baseUrl}/api/cashfree/webhook`;

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
      return_url: returnUrl,
      notify_url: notifyUrl
    },
    order_note: notes || `Saman Adhikar Party ${orderType === "MEMBERSHIP" ? "Membership Registration" : "Rashtra Nirman Contribution"}`
  };

  // If live/sandbox credentials exist, call Cashfree official Server SDK (cashfree-pg)
  // using production endpoint https://api.cashfree.com/pg/orders
  const client = getCashfreeClient();
  if (client) {
    try {
      const response = await client.PGCreateOrder(orderPayload);
      const data = response.data;

      if (data && data.payment_session_id) {
        const orderRecord: CashfreeOrderRecord = {
          orderId: data.order_id || orderId,
          paymentSessionId: data.payment_session_id,
          orderAmount: Number(orderAmount),
          orderType: orderType || "DONATION",
          orderStatus: "ACTIVE",
          donorData: donorData || {
            donorName: cleanName,
            amount: Number(orderAmount),
            phone: cleanPhone,
            email: cleanEmail
          },
          memberData,
          createdAt: new Date().toISOString()
        };
        await saveCashfreeOrder(orderRecord);

        return {
          success: true,
          paymentSessionId: data.payment_session_id,
          orderId: data.order_id || orderId,
          orderAmount: data.order_amount || orderAmount,
          returnUrl,
          mode: CONFIG.CASHFREE.ENV,
          apiEndpoint: CONFIG.CASHFREE.ORDERS_ENDPOINT
        };
      }

      console.error("Cashfree order creation error response from server SDK:", data);
      return {
        success: false,
        error: (data as any)?.message || "कैशफ्री गेटवे पर आर्डर बनाने में त्रुटि हुई।",
        details: data
      };
    } catch (err: any) {
      console.error("Cashfree Server SDK PGCreateOrder error:", err?.response?.data || err?.message || err);
      return {
        success: false,
        error: err?.response?.data?.message || "कैशफ्री भुगतान गेटवे से संपर्क स्थापित नहीं हो सका।"
      };
    }
  }

  // Simulated fallback session when environment secrets are not populated
  const simulatedSessionId = `session_cf_test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const simulatedRecord: CashfreeOrderRecord = {
    orderId,
    paymentSessionId: simulatedSessionId,
    orderAmount: Number(orderAmount),
    orderType: orderType || "DONATION",
    orderStatus: "ACTIVE",
    donorData: donorData || {
      donorName: cleanName,
      amount: Number(orderAmount),
      phone: cleanPhone,
      email: cleanEmail
    },
    memberData,
    createdAt: new Date().toISOString()
  };
  await saveCashfreeOrder(simulatedRecord);

  return {
    success: true,
    paymentSessionId: simulatedSessionId,
    orderId,
    orderAmount: Number(orderAmount),
    returnUrl,
    mode: "sandbox",
    isSimulated: true,
    message: "कैशफ्री पेमेंट सत्र तैयार है (Cashfree Web Redirect Session Initialized).",
    apiEndpoint: CONFIG.CASHFREE.ORDERS_ENDPOINT
  };
}

export async function verifyCashfreePayment(orderId: string): Promise<{
  isPaid: boolean;
  orderStatus: string;
  transactionId: string;
  paymentMethod: string;
  details?: any;
}> {
  let isPaid = false;
  let orderStatus = "ACTIVE";
  let transactionId = `CF-TXN-${Date.now().toString().slice(-8)}`;
  let paymentMethod = "Cashfree Hosted Checkout (api.cashfree.com)";
  let details: any = null;

  const client = getCashfreeClient();
  if (client) {
    try {
      // Use Cashfree server SDK PGFetchOrder method on production orders endpoint
      const orderRes = await client.PGFetchOrder(orderId);
      const orderDetails = orderRes.data;
      details = orderDetails;

      if (orderDetails && orderDetails.order_status) {
        orderStatus = orderDetails.order_status;
        if (orderStatus === "PAID") {
          isPaid = true;
          transactionId = orderDetails.cf_order_id ? `CF-${orderDetails.cf_order_id}` : transactionId;

          // Use Cashfree server SDK PGOrderFetchPayments method
          try {
            const payRes = await client.PGOrderFetchPayments(orderId);
            const payList = payRes.data;
            if (Array.isArray(payList) && payList.length > 0) {
              const successfulPay = payList.find((p: any) => p.payment_status === "SUCCESS") || payList[0];
              if (successfulPay) {
                if (successfulPay.cf_payment_id) {
                  transactionId = `CF-PAY-${successfulPay.cf_payment_id}`;
                }
                if (successfulPay.payment_method) {
                  const m: any = successfulPay.payment_method;
                  if (typeof m === "string") {
                    paymentMethod = `Cashfree (${String(m).toUpperCase()})`;
                  } else if (typeof m === "object" && m !== null) {
                    const keys = Object.keys(m);
                    const k = keys[0];
                    paymentMethod = `Cashfree (${k ? String(k).toUpperCase() : "Online"})`;
                  }
                }
              }
            }
          } catch (payErr) {
            console.warn("Could not fetch payments list from Cashfree Server SDK:", payErr);
          }
        }
      }
    } catch (e: any) {
      console.error("Cashfree Server SDK verification error:", e?.response?.data || e?.message);
    }
  } else {
    // In simulated/sandbox demo mode without keys
    isPaid = true;
    orderStatus = "PAID";
    transactionId = `CF-SIM-${Date.now().toString().slice(-8)}`;
    paymentMethod = "Cashfree PG Simulator";
  }

  return { isPaid, orderStatus, transactionId, paymentMethod, details };
}

/**
 * Validates order status after redirect return and creates receipt / membership records idempotently
 */
export async function processOrderCompletion(orderId: string, customDonorData?: any, customMemberData?: any) {
  const existingOrder = await getCashfreeOrder(orderId);
  const { isPaid, orderStatus, transactionId, paymentMethod, details } = await verifyCashfreePayment(orderId);

  if (!isPaid) {
    return {
      success: false,
      orderStatus,
      message: orderStatus === "ACTIVE" 
        ? "भुगतान अभी प्रक्रिया में है (Payment in progress) अथवा पूर्ण नहीं हुआ।" 
        : "भुगतान असफल अथवा निरस्त (Payment failed or cancelled).",
      details
    };
  }

  // Already processed and paid? Return saved receipt/member
  if (existingOrder && existingOrder.orderStatus === "PAID" && (existingOrder.receipt || existingOrder.memberCard)) {
    return {
      success: true,
      orderStatus: "PAID",
      transactionId: existingOrder.transactionId || transactionId,
      orderType: existingOrder.orderType,
      receipt: existingOrder.receipt,
      member: existingOrder.memberCard,
      alreadyProcessed: true
    };
  }

  const orderType = existingOrder?.orderType || (customMemberData ? "MEMBERSHIP" : "DONATION");
  const donorInfo = customDonorData || existingOrder?.donorData;
  const memberInfo = customMemberData || existingOrder?.memberData;
  const partyInfo = await getPartyInfo();

  let receipt: any = null;
  let member: any = null;

  if (orderType === "DONATION" && donorInfo) {
    // Check if donation already added to prevent duplicate entries
    const allDonations = await getDonations();
    const existingDonation = allDonations.find((d) => d.id === `DON-${orderId}`);

    if (existingDonation) {
      receipt = buildTaxReceipt(existingDonation, partyInfo, transactionId, paymentMethod);
    } else {
      const newDonation: DonationRecord = {
        id: `DON-${orderId}`,
        donorName: donorInfo.isAnonymous ? "गुप्त राष्ट्रभक्त (Anonymous Patriot)" : (donorInfo.donorName || "समर्थक नागरिक"),
        amount: Number(donorInfo.amount || existingOrder?.orderAmount || 500),
        frequency: donorInfo.frequency || "one-time",
        precinct: donorInfo.donorState || "राष्ट्रीय मुख्यालय",
        timestamp: new Date().toISOString(),
        isAnonymous: Boolean(donorInfo.isAnonymous),
        message: donorInfo.message || `Cashfree Web Checkout (${orderId})`,
        citizenship: donorInfo.citizenship || "INDIAN",
        phone: donorInfo.phone,
        email: donorInfo.email,
        state: donorInfo.donorState,
        passportNumber: donorInfo.passportNumber
      };

      await addDonation(newDonation);
      receipt = buildTaxReceipt(newDonation, partyInfo, transactionId, paymentMethod);
    }
  } else if (orderType === "MEMBERSHIP" && memberInfo) {
    const allMembers = await getMembers();
    const existingMem = allMembers.find((m) => m.utrNumber === transactionId || m.id === `MEM-${orderId}`);

    if (existingMem) {
      member = existingMem;
    } else {
      const memberCardId = `SAP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newMember: MemberRecord = {
        id: `MEM-${orderId}`,
        fullName: String(memberInfo.fullName || "समान अधिकार पार्टी सदस्य").trim(),
        email: memberInfo.email || `${String(memberInfo.phone || "member").trim()}@samanadhikarparty.org`,
        phone: String(memberInfo.phone || "").trim(),
        precinct: memberInfo.precinct || "आगरा (Agra)",
        membershipTier: memberInfo.membershipTier || "साधारण सदस्य",
        membershipFee: Number(memberInfo.membershipFee || existingOrder?.orderAmount || 10),
        joinedDate: new Date().toISOString().split("T")[0],
        memberCardId,
        interests: memberInfo.interests || ["समान अधिकार अभियान"],
        paymentMethod,
        utrNumber: transactionId,
        isFeePaid: true
      };

      await addMember(newMember);
      member = newMember;
    }
  }

  // Update order record
  await updateCashfreeOrder(orderId, {
    orderStatus: "PAID",
    transactionId,
    paymentMethod,
    receipt,
    memberCard: member,
    completedAt: new Date().toISOString()
  });

  return {
    success: true,
    orderStatus: "PAID",
    orderId,
    transactionId,
    orderType,
    receipt,
    member
  };
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
