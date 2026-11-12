import { CONFIG } from "../../server/config";
import { saveCashfreeOrder } from "../../server/database/repositories/cashfreeRepository";

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");

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
      } catch (e) {
        body = {};
      }
    }
    body = body || {};

    const { orderAmount, customerName, customerPhone, customerEmail, orderType, notes, donorData, memberData } = body;

    const amount = Number(orderAmount);
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: "कृपया मान्य भुगतान राशि दर्ज करें।" });
    }

    const orderId = `order_sap_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const cleanPhone = (customerPhone ? String(customerPhone).replace(/\D/g, "") : "").slice(-10) || "9412165541";
    const cleanName = (customerName && String(customerName).trim().length > 0) ? String(customerName).trim() : "राष्ट्रभक्त नागरिक";
    const cleanEmail = (customerEmail && String(customerEmail).includes("@")) ? String(customerEmail).trim() : "donation@samanadhikarparty.org";

    const rawHost = req.headers["x-forwarded-host"] || req.headers.host || "samanadhikar.in";
    const cfHost = (typeof rawHost === "string" && !rawHost.includes("localhost") && !rawHost.includes("127.0.0.1"))
      ? rawHost
      : "samanadhikar.in";
    const httpsBase = `https://${cfHost}`.replace(/\/$/, "");

    // return_url: maximum 250 characters, HTTPS, includes {order_id} placeholder
    let returnUrl = `${httpsBase}/?order_id={order_id}&payment_status=cashfree_return`;
    if (returnUrl.length > 250) {
      returnUrl = `${httpsBase}/?order_id={order_id}`;
    }
    if (returnUrl.length > 250) {
      returnUrl = returnUrl.substring(0, 250);
    }

    // notify_url: maximum 250 characters, HTTPS endpoint
    let notifyUrl = `${httpsBase}/api/cashfree/webhook`;
    if (notifyUrl.length > 250) {
      notifyUrl = notifyUrl.substring(0, 250);
    }

    const orderPayload = {
      order_id: orderId,
      order_amount: amount,
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

    const appId = process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID || CONFIG.CASHFREE.APP_ID || "";
    const secretKey = process.env.CASHFREE_SECRET_KEY || CONFIG.CASHFREE.SECRET_KEY || "";
    const ordersEndpoint = process.env.CASHFREE_ENV === "sandbox"
      ? "https://sandbox.cashfree.com/pg/orders"
      : (CONFIG.CASHFREE.ORDERS_ENDPOINT || "https://api.cashfree.com/pg/orders");

    // 1. If live Cashfree credentials are set in environment
    if (appId && secretKey) {
      try {
        const cfResponse = await fetch(ordersEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-version": "2026-01-01",
            "x-client-id": appId,
            "x-client-secret": secretKey
          },
          body: JSON.stringify(orderPayload)
        });

        const data: any = await cfResponse.json();

        if (cfResponse.ok && data && data.payment_session_id) {
          const isProduction = process.env.CASHFREE_ENV !== "sandbox" && CONFIG.CASHFREE.ENV !== "sandbox";
          const paymentUrl = isProduction
            ? `https://payments.cashfree.com/order/#${data.payment_session_id}`
            : `https://payments-test.cashfree.com/order/#${data.payment_session_id}`;

          try {
            await saveCashfreeOrder({
              orderId: data.order_id || orderId,
              paymentSessionId: data.payment_session_id,
              orderAmount: amount,
              orderType: orderType || "DONATION",
              orderStatus: "ACTIVE",
              donorData: donorData || { donorName: cleanName, amount, phone: cleanPhone, email: cleanEmail },
              memberData,
              createdAt: new Date().toISOString()
            });
          } catch (e) {
            console.warn("Could not save order to storage:", e);
          }

          return res.status(200).json({
            success: true,
            paymentSessionId: data.payment_session_id,
            orderId: data.order_id || orderId,
            orderAmount: data.order_amount || amount,
            paymentUrl,
            returnUrl,
            mode: isProduction ? "production" : "sandbox",
            apiVersion: "2026-01-01",
            apiEndpoint: ordersEndpoint
          });
        }

        console.error("Cashfree order error response:", data);
        return res.status(400).json({
          success: false,
          error: data?.message || "कैशफ्री गेटवे पर आर्डर बनाने में त्रुटि हुई।",
          details: data
        });
      } catch (err: any) {
        console.error("Cashfree API network error:", err);
      }
    }

    // 2. Fallback payment session (Redirect to Dedicated Cashfree Hosted Gateway Page)
    const simulatedSessionId = `session_cf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const paymentUrl = `${baseUrl}/cashfree-gateway?order_id=${encodeURIComponent(orderId)}&session_id=${encodeURIComponent(simulatedSessionId)}&amount=${amount}&name=${encodeURIComponent(cleanName)}&phone=${cleanPhone}&type=${orderType || "DONATION"}`;

    try {
      await saveCashfreeOrder({
        orderId,
        paymentSessionId: simulatedSessionId,
        orderAmount: amount,
        orderType: orderType || "DONATION",
        orderStatus: "ACTIVE",
        donorData: donorData || { donorName: cleanName, amount, phone: cleanPhone, email: cleanEmail },
        memberData,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Could not save simulated order to storage:", e);
    }

    return res.status(200).json({
      success: true,
      paymentSessionId: simulatedSessionId,
      orderId,
      orderAmount: amount,
      paymentUrl,
      returnUrl,
      mode: "production",
      isSimulated: true,
      apiVersion: "2026-01-01",
      apiEndpoint: ordersEndpoint
    });
  } catch (err: any) {
    console.error("Vercel create-order unhandled error:", err);
    return res.status(500).json({ success: false, error: "कैशफ्री आर्डर प्रक्रिया में तकनीकी त्रुटि।" });
  }
}
