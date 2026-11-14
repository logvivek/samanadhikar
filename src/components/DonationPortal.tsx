import React, { useState } from "react";
import { load as loadCashfree } from "@cashfreepayments/cashfree-js";
import paymentQrImg from "../assets/images/payment_upi_qr.jpg";
import { DONATION_PRESETS, PRECINCTS_LIST, PARTY_INFO, INDIAN_STATES } from "../data/campaignData";
import { DonationReceipt } from "../types";
import { OfficialReceiptCard } from "./OfficialReceiptCard";
import { validateUtrNumber } from "../utils/utrValidation";
import { 
  Heart, 
  Lock, 
  ShieldCheck, 
  CheckCircle, 
  Printer, 
  Smartphone, 
  Sparkles,
  Copy,
  Check,
  Landmark,
  QrCode,
  Flame,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  BadgeCheck,
  Building2,
  AlertCircle,
  X,
  Globe,
  FileText,
  Wallet,
  Calendar,
  Send,
  HelpCircle,
  Share2,
  Download,
  Loader2,
  ExternalLink
} from "lucide-react";

interface DonationPortalProps {
  onDonationSuccess: (receipt: DonationReceipt) => void;
  onCloseModal?: () => void;
  totalRaised?: number;
  donorCount?: number;
}

type CitizenshipType = "INDIAN" | "NRI";
type PaymentTabType = "upi" | "card" | "netbanking" | "wallet" | "neft" | "cheque" | "nach";

const POPULAR_BANKS = [
  { id: "sbi", name: "State Bank of India (SBI)", code: "SBIN" },
  { id: "hdfc", name: "HDFC Bank", code: "HDFC" },
  { id: "icici", name: "ICICI Bank", code: "ICIC" },
  { id: "axis", name: "Axis Bank", code: "UTIB" },
  { id: "pnb", name: "Punjab National Bank", code: "PUNB" },
  { id: "bob", name: "Bank of Baroda", code: "BARB" },
  { id: "kotak", name: "Kotak Mahindra Bank", code: "KKBK" },
  { id: "canara", name: "Canara Bank", code: "CNRB" },
  { id: "union", name: "Union Bank of India", code: "UBIN" }
];

const ALL_BANKS = [
  "State Bank of India (SBI)",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "Kotak Mahindra Bank",
  "Canara Bank",
  "Union Bank of India",
  "Bank of India",
  "Central Bank of India",
  "Indian Bank",
  "IndusInd Bank",
  "IDBI Bank",
  "Federal Bank",
  "Yes Bank",
  "RBL Bank",
  "AU Small Finance Bank",
  "Bandhan Bank",
  "South Indian Bank",
  "Karur Vysya Bank",
  "UCO Bank",
  "Indian Overseas Bank",
  "Punjab & Sind Bank",
  "IDFC FIRST Bank",
  "Jammu & Kashmir Bank",
  "City Union Bank",
  "DBS Bank India",
  "Standard Chartered Bank"
];

const WALLETS_LIST = [
  { id: "paytm_wallet", name: "Paytm Wallet", color: "bg-sky-50 border-sky-300 text-sky-950" },
  { id: "phonepe_wallet", name: "PhonePe Wallet", color: "bg-purple-50 border-purple-300 text-purple-950" },
  { id: "amazon_pay", name: "Amazon Pay", color: "bg-amber-50 border-amber-300 text-amber-950" },
  { id: "mobikwik", name: "MobiKwik", color: "bg-blue-50 border-blue-300 text-blue-950" },
  { id: "airtel_money", name: "Airtel Money", color: "bg-red-50 border-red-300 text-red-950" }
];

export const DonationPortal: React.FC<DonationPortalProps> = ({
  onDonationSuccess,
  onCloseModal,
  totalRaised = 1285400,
  donorCount = 3420
}) => {
  // 1. Citizenship & Frequency
  const [citizenship, setCitizenship] = useState<CitizenshipType>("INDIAN");
  const [frequency, setFrequency] = useState<"one-time" | "monthly">("one-time");

  // 2. Amount state
  const [amount, setAmount] = useState<number>(1100);
  const [customAmount, setCustomAmount] = useState<string>("");

  // 3. Donor Personal Details (ECI Compliant)
  const [donorName, setDonorName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [donorEmail, setDonorEmail] = useState<string>("");
  const [donorState, setDonorState] = useState<string>(INDIAN_STATES[0]);
  const [passportNumber, setPassportNumber] = useState<string>("");
  const [countryOfResidence, setCountryOfResidence] = useState<string>("United States");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [statutoryDeclaration, setStatutoryDeclaration] = useState<boolean>(true);
  const [message, setMessage] = useState<string>("");

  // 4. Portal Navigation Step: 'details' | 'payment' | 'receipt'
  const [step, setStep] = useState<"details" | "payment" | "receipt">("details");

  // 5. Payment Method & Specific Mode states
  const [paymentTab, setPaymentTab] = useState<PaymentTabType>("upi");
  const [upiSubMethod, setUpiSubMethod] = useState<"phonepe" | "gpay" | "paytm" | "qr" | "intent">("phonepe");
  const [utrNumber, setUtrNumber] = useState<string>("");

  // Card fields
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardExpiry, setCardExpiry] = useState<string>("");
  const [cardCvv, setCardCvv] = useState<string>("");
  const [cardHolderName, setCardHolderName] = useState<string>("");

  // Netbanking fields
  const [selectedBank, setSelectedBank] = useState<string>("State Bank of India (SBI)");

  // Wallet fields
  const [selectedWallet, setSelectedWallet] = useState<string>("paytm_wallet");

  // Modal / Verification simulation
  const [showSimulatedGateway, setShowSimulatedGateway] = useState<boolean>(false);
  const [gatewayStep, setGatewayStep] = useState<"processing" | "otp" | "success">("processing");
  const [simulatedOtp, setSimulatedOtp] = useState<string>("849201");
  const [enteredOtp, setEnteredOtp] = useState<string>("");

  // Cashfree PG State (api.cashfree.com)
  const [isCashfreeLoading, setIsCashfreeLoading] = useState<boolean>(false);
  const [cashfreeOrderId, setCashfreeOrderId] = useState<string | null>(null);
  const [cashfreeSessionId, setCashfreeSessionId] = useState<string | null>(null);
  const [showCashfreeModal, setShowCashfreeModal] = useState<boolean>(false);
  const [cashfreePaymentMethod, setCashfreePaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [cashfreeCardNumber, setCashfreeCardNumber] = useState<string>("");
  const [cashfreeCardExpiry, setCashfreeCardExpiry] = useState<string>("");
  const [cashfreeCardCvv, setCashfreeCardCvv] = useState<string>("");

  // Cheque pledge state
  const [chequeNumber, setChequeNumber] = useState<string>("");
  const [chequeBank, setChequeBank] = useState<string>("");

  // Messages & Errors
  const [formError, setFormError] = useState<string>("");
  const [paymentError, setPaymentError] = useState<string>("");
  const [browserNotice, setBrowserNotice] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generatedReceipt, setGeneratedReceipt] = useState<DonationReceipt | null>(null);

  const officialUpiId = PARTY_INFO.bankDetails.upiId?.trim() || "samanadhikarparty@sbi";

  // Amount Presets
  const PRESET_AMOUNTS = [500, 1100, 2100, 5100, 11000, 25000];

  // Unique Transaction Reference ID Generator per NPCI Spec
  const generateNpciTxnRef = (prefix: string = "SAP") => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${prefix}${timestamp}${randomSuffix}`;
  };

  const getNpciParams = (noteOverride?: string, includeTxnRef: boolean = false, prefix: string = "SAP") => {
    const payeeVpa = officialUpiId;
    const payeeName = encodeURIComponent("Samanadhikar Party");
    const txnRef = generateNpciTxnRef(prefix);
    const txnNote = encodeURIComponent(noteOverride || "Donation to Saman Adhikar Party");
    const amtStr = amount && Number(amount) > 0 ? Number(amount).toFixed(2) : "100.00";

    return `pa=${payeeVpa}` +
      `&pn=${payeeName}` +
      (includeTxnRef ? `&tr=${txnRef}` : "") +
      `&tn=${txnNote}` +
      `&am=${amtStr}` +
      `&cu=INR`;
  };

  const getCleanUpiUrl = (noteOverride?: string) => {
    const params = getNpciParams(noteOverride, false, "QR");
    return `upi://pay?${params}`;
  };

  const getAppIntentUrl = (app: "phonepe" | "paytm" | "gpay" | "upi", noteOverride?: string) => {
    const userAgent = typeof navigator !== "undefined" ? (navigator.userAgent || navigator.vendor || "") : "";
    const isAndroid = /android/i.test(userAgent);
    const isIos = /iphone|ipad|ipod/i.test(userAgent);

    const prefixMap = { phonepe: "PPE", paytm: "PTM", gpay: "GPY", upi: "UPI" };
    const params = getNpciParams(noteOverride, false, prefixMap[app] || "SAP");
    const universalUrl = `upi://pay?${params}`;

    if (app === "phonepe") {
      if (isAndroid) {
        return `intent://pay?${params}#Intent;scheme=upi;package=com.phonepe.app;S.browser_fallback_url=${encodeURIComponent(universalUrl)};end`;
      } else if (isIos) {
        return `phonepe://pay?${params}`;
      }
      return universalUrl;
    }

    if (app === "paytm") {
      if (isAndroid) {
        return `intent://pay?${params}#Intent;scheme=upi;package=net.one97.paytm;S.browser_fallback_url=${encodeURIComponent(universalUrl)};end`;
      } else if (isIos) {
        return `paytmmp://pay?${params}`;
      }
      return universalUrl;
    }

    if (app === "gpay") {
      if (isAndroid) {
        return `intent://pay?${params}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;S.browser_fallback_url=${encodeURIComponent(universalUrl)};end`;
      } else if (isIos) {
        return `gpay://upi/pay?${params}`;
      }
      return universalUrl;
    }

    return universalUrl;
  };

  const launchPaymentApp = (app: "phonepe" | "paytm" | "gpay" | "upi", noteOverride?: string) => {
    const params = getNpciParams(noteOverride, false, app.toUpperCase());
    const universalUrl = `upi://pay?${params}`;
    const targetUrl = getAppIntentUrl(app, noteOverride);

    try {
      const a = document.createElement("a");
      a.href = targetUrl;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      window.location.href = targetUrl;
    }

    setTimeout(() => {
      try {
        const fallbackA = document.createElement("a");
        fallbackA.href = universalUrl;
        document.body.appendChild(fallbackA);
        fallbackA.click();
        document.body.removeChild(fallbackA);
      } catch (err) {
        // ignore
      }
    }, 600);
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSelectPreset = (amt: number) => {
    setAmount(amt);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (val: string) => {
    setCustomAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setAmount(num);
    }
  };

  // === CASHFREE PG API v3 INTEGRATION ===
  const handlePayWithCashfree = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError("");
    setPaymentError("");

    if (!amount || amount <= 0) {
      setFormError("कृपया मान्य दान राशि का चयन करें या दर्ज करें।");
      return;
    }

    if (!donorName.trim() && !isAnonymous) {
      setFormError("कृपया अपना पूरा नाम दर्ज करें (अथवा गुप्त दान विकल्प चुनें)।");
      return;
    }

    const cleanDigits = phone.replace(/\D/g, "");
    if (!cleanDigits || cleanDigits.length < 10) {
      setFormError("कृपया अपना 10 अंकों का वैध मोबाइल नंबर दर्ज करें।");
      return;
    }

    if (donorEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail.trim())) {
      setFormError("कृपया वैध ईमेल पता दर्ज करें (अथवा खाली छोड़ें)।");
      return;
    }

    if (citizenship === "NRI" && (!passportNumber || passportNumber.trim().length < 6)) {
      setFormError("अनिवासी भारतीय (NRI) सहयोग हेतु वैध भारतीय पासपोर्ट नंबर आवश्यक है (चुनाव आयोग व RPA अधिनियम नियम)।");
      return;
    }

    if (!statutoryDeclaration) {
      setFormError("कृपया वैधानिक घोषणा चेकबॉक्स को स्वीकार करें।");
      return;
    }

    setIsCashfreeLoading(true);
    try {
      const idempotencyKey = `cf_don_${cleanDigits.slice(-10)}_${amount}_${Date.now().toString().slice(-6)}`;
      const donorData = {
        donorName: isAnonymous ? "गुप्त राष्ट्रभक्त (Anonymous Patriot)" : (donorName.trim() || "समर्थक नागरिक"),
        amount,
        frequency,
        precinct: donorState || "राष्ट्रीय मुख्यालय",
        isAnonymous,
        message: message || "Cashfree PG v3 Contribution",
        citizenship,
        phone: cleanDigits.slice(-10),
        email: donorEmail.trim() || undefined,
        donorState,
        passportNumber: citizenship === "NRI" ? passportNumber : undefined
      };

      // 1. Create order on server via Cashfree PG v3 backend endpoint
      const res = await fetch("/api/cashfree/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify({
          orderAmount: amount,
          customerName: isAnonymous ? "गुप्त राष्ट्रभक्त" : (donorName.trim() || "समर्थक नागरिक"),
          customerPhone: cleanDigits.slice(-10),
          customerEmail: donorEmail.trim() || undefined,
          orderType: "DONATION",
          notes: `Saman Adhikar Party Contribution - INR ${amount}`,
          idempotencyKey,
          donorData
        })
      });

      const orderData = await res.json().catch(() => ({
        success: false,
        error: `सर्वर त्रुटि (${res.status})। कृपया पुनः प्रयास करें।`
      }));

      if (!res.ok || !orderData.success || !orderData.paymentSessionId) {
        setPaymentError(orderData.error || "कैशफ्री गेटवे सत्र बनाने में समस्या आई।");
        setIsCashfreeLoading(false);
        return;
      }

      setCashfreeOrderId(orderData.orderId);
      setCashfreeSessionId(orderData.paymentSessionId);

      const sdkMode = orderData.mode === "production" ? "production" : "sandbox";
      const fallbackUrl =
        orderData.paymentUrl ||
        (sdkMode === "production"
          ? `https://payments.cashfree.com/order/#${orderData.paymentSessionId}`
          : `https://payments-test.cashfree.com/order/#${orderData.paymentSessionId}`);

      // 2. If running in local sandbox simulator mode (no live/sandbox keys configured), navigate to simulator page
      if (orderData.isSimulated && orderData.paymentUrl) {
        window.location.assign(orderData.paymentUrl);
        return;
      }

      // 3. Official Cashfree JavaScript SDK v3 Checkout using backend-generated paymentSessionId
      try {
        let cashfree: any = null;
        if (typeof window !== "undefined" && typeof (window as any).Cashfree === "function") {
          cashfree = (window as any).Cashfree({ mode: sdkMode });
        } else {
          cashfree = await loadCashfree({ mode: sdkMode });
        }

        if (cashfree && typeof cashfree.checkout === "function") {
          const result = await cashfree.checkout({
            paymentSessionId: orderData.paymentSessionId,
            redirectTarget: "_self"
          });
          if (result && result.error) {
            console.warn("Cashfree SDK checkout returned error:", result.error);
            window.location.assign(fallbackUrl);
          }
        } else {
          window.location.assign(fallbackUrl);
        }
      } catch (sdkErr) {
        console.warn("Cashfree JS SDK fallback redirect:", sdkErr);
        window.location.assign(fallbackUrl);
      }
    } catch (err) {
      console.error("Cashfree init error:", err);
      setPaymentError("कैशफ्री गेटवे से संपर्क में त्रुटि। कृपया पुनः प्रयास करें।");
    } finally {
      setIsCashfreeLoading(false);
    }
  };

  const verifyAndCompleteCashfreeOrder = async (orderId: string, sessionId?: string, methodLabel?: string) => {
    setIsSubmitting(true);
    setPaymentError("");
    try {
      const donorData = {
        donorName: isAnonymous ? "गुप्त राष्ट्रभक्त (Anonymous Patriot)" : (donorName || "समर्थक नागरिक"),
        amount,
        frequency,
        precinct: donorState || "राष्ट्रीय मुख्यालय",
        isAnonymous,
        message: message || "Cashfree PG Verified",
        citizenship,
        phone,
        donorState,
        passportNumber: citizenship === "NRI" ? passportNumber : undefined
      };

      const res = await fetch("/api/cashfree/verify-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          paymentSessionId: sessionId || cashfreeSessionId,
          donorData,
          orderType: "DONATION"
        })
      });

      const data = await res.json();
      if (data.success && data.receipt) {
        setGeneratedReceipt(data.receipt);
        onDonationSuccess(data.receipt);
        setStep("receipt");
        setShowCashfreeModal(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setPaymentError(data.error || "कैशफ्री भुगतान सत्यापन में त्रुटि आई।");
      }
    } catch (err) {
      console.error("Cashfree verify error:", err);
      setPaymentError("भुगतान सत्यापन में तकनीकी त्रुटि। कृपया पुनः प्रयास करें।");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Move from Details to Payment Step
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!amount || amount <= 0) {
      setFormError("कृपया मान्य दान राशि का चयन करें या दर्ज करें।");
      return;
    }

    if (!donorName.trim() && !isAnonymous) {
      setFormError("कृपया अपना पूरा नाम दर्ज करें (अथवा गुप्त दान विकल्प चुनें)।");
      return;
    }

    if (!phone || phone.trim().length < 10) {
      setFormError("कृपया अपना 10 अंकों का वैध मोबाइल नंबर दर्ज करें।");
      return;
    }

    if (citizenship === "NRI" && (!passportNumber || passportNumber.trim().length < 6)) {
      setFormError("अनिवासी भारतीय (NRI) सहयोग हेतु वैध भारतीय पासपोर्ट नंबर आवश्यक है (चुनाव आयोग व RPA अधिनियम नियम)।");
      return;
    }

    if (!statutoryDeclaration) {
      setFormError("कृपया वैधानिक घोषणा चेकबॉक्स को स्वीकार करें।");
      return;
    }

    setFormError("");
    setPaymentError("");
    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit and finalize donation
  const handleFinalizeDonation = async (customMethodLabel?: string, customUtr?: string) => {
    setPaymentError("");
    setIsSubmitting(true);

    const activeUtr = customUtr || utrNumber;

    if (activeUtr && activeUtr.trim().length > 0 && paymentTab === "upi") {
      const v = validateUtrNumber(activeUtr);
      if (!v.isValid) {
        setPaymentError(v.message);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const methodLabel = customMethodLabel || (
        paymentTab === "upi" ? `UPI (${upiSubMethod.toUpperCase()})` :
        paymentTab === "card" ? "Credit / Debit Card (Online Gateway)" :
        paymentTab === "netbanking" ? `Net Banking (${selectedBank})` :
        paymentTab === "wallet" ? `Digital Wallet (${selectedWallet.replace("_", " ").toUpperCase()})` :
        paymentTab === "neft" ? "Direct Bank Transfer (NEFT/RTGS/IMPS)" :
        paymentTab === "cheque" ? `Cheque / Demand Draft (${chequeBank || "Bank"})` :
        "Systematic Donation Plan (NACH Mandate)"
      );

      const finalUtr = activeUtr && activeUtr.trim().length > 0 
        ? activeUtr 
        : `TXN${Date.now().toString().slice(-8)}${Math.floor(100 + Math.random() * 900)}`;

      const response = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorName: isAnonymous ? "गुप्त राष्ट्रभक्त (Anonymous Patriot)" : (donorName || "समर्थक नागरिक"),
          amount,
          frequency,
          precinct: donorState || "राष्ट्रीय मुख्यालय",
          isAnonymous,
          message,
          paymentMethod: methodLabel,
          utrNumber: finalUtr,
          isPaymentCompleted: true,
          citizenship,
          phone,
          state: donorState,
          passportNumber: citizenship === "NRI" ? passportNumber : undefined
        })
      });

      const data = await response.json();

      if (data.success && data.receipt) {
        setGeneratedReceipt(data.receipt);
        onDonationSuccess(data.receipt);
        setStep("receipt");
        setShowSimulatedGateway(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setPaymentError(data.error || "सहयोग राशि दर्ज करने में समस्या आई। पुनः प्रयास करें।");
      }
    } catch (err) {
      console.error(err);
      setPaymentError("भुगतान सत्यापन में समस्या आई। कृपया इंटरनेट कनेक्शन जांचें।");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simulate Card / Netbanking / Wallet Checkout Gateway
  const handleStartOnlineGatewayCheckout = (methodName: string) => {
    setPaymentError("");
    
    if (paymentTab === "card") {
      const cleanCard = cardNumber.replace(/\s+/g, "");
      if (cleanCard.length < 15) {
        setPaymentError("कृपया 16 अंकों का वैध कार्ड नंबर दर्ज करें।");
        return;
      }
      if (!cardExpiry || !cardExpiry.includes("/")) {
        setPaymentError("कृपया कार्ड समाप्ति तिथि (MM/YY) दर्ज करें।");
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setPaymentError("कृपया 3 अंकों का CVV नंबर दर्ज करें।");
        return;
      }
    }

    setShowSimulatedGateway(true);
    setGatewayStep("processing");
    setEnteredOtp("");

    setTimeout(() => {
      setGatewayStep("otp");
    }, 1200);
  };

  const handleVerifyOtpAndPay = () => {
    if (!enteredOtp || enteredOtp.trim().length < 4) {
      setPaymentError("कृपया बैंक द्वारा प्रेषित 6 अंकों का OTP दर्ज करें।");
      return;
    }
    setGatewayStep("processing");

    setTimeout(() => {
      const label = paymentTab === "card" 
        ? `Card (Ending in ${cardNumber.slice(-4) || "4242"})` 
        : paymentTab === "netbanking" 
        ? `NetBanking (${selectedBank})` 
        : `Wallet (${selectedWallet.toUpperCase()})`;

      const simulatedTxn = `PAY-${Date.now().toString().slice(-8)}`;
      handleFinalizeDonation(label, simulatedTxn);
    }, 1500);
  };

  return (
    <section className="py-10 bg-gradient-to-b from-orange-50/40 via-white to-orange-50/60 text-slate-900 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header with 80GGC Tax Notice */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-orange-100 border border-orange-300 text-orange-950 text-xs font-black uppercase tracking-wider shadow-sm">
            <Flame className="w-4 h-4 text-orange-600 fill-orange-600 shrink-0" />
            <span>समान अधिकार पार्टी - आधिकारिक जनसहयोग पोर्टल</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-orange-950 tracking-tight leading-tight">
            राष्ट्र निर्माण एवं समानता मिशन हेतु आर्थिक सहयोग
          </h1>

          <p className="text-slate-700 text-sm sm:text-base font-bold max-w-2xl mx-auto">
            समान अधिकार पार्टी किसी पूंजीपति या कॉर्पोरेट से चंदा नहीं लेती। हमारा प्रत्येक अभियान और गुरुकुल संकल्प आपके स्वेच्छा से दिए गए सहयोग पर आधारित है।
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-full font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>100% Tax Exemption under Sec 80GGC / 80GGB</span>
            </span>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-sky-100 border border-sky-300 text-sky-950 rounded-full font-bold">
              <BadgeCheck className="w-3.5 h-3.5 text-sky-700" />
              <span>ECI Recognized Party • PAN: {PARTY_INFO.panNumber}</span>
            </span>
          </div>
        </div>

        {/* Step Progress Tracker */}
        <div className="max-w-xl mx-auto bg-white border border-orange-200 rounded-2xl p-2.5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-black">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl ${
              step === "details" ? "bg-orange-600 text-white shadow" : "text-emerald-800 bg-emerald-50"
            }`}>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
              <span>1. राशि व विवरण</span>
            </div>

            <div className="h-0.5 w-6 sm:w-10 bg-orange-200" />

            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl ${
              step === "payment" ? "bg-orange-600 text-white shadow" : step === "receipt" ? "text-emerald-800 bg-emerald-50" : "text-slate-400 bg-slate-100"
            }`}>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
              <span>2. भुगतान माध्यम</span>
            </div>

            <div className="h-0.5 w-6 sm:w-10 bg-orange-200" />

            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl ${
              step === "receipt" ? "bg-emerald-700 text-white shadow" : "text-slate-400 bg-slate-100"
            }`}>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">3</span>
              <span>3. 80GGC रसीद</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: CITIZENSHIP, FREQUENCY, AMOUNT & DONOR DETAILS */}
        {/* ========================================================================= */}
        {step === "details" && (
          <form onSubmit={handleProceedToPayment} className="max-w-4xl mx-auto bg-white border-2 border-orange-300 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8">
            
            {/* 1. Citizenship Switcher (AAP Model) */}
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase text-orange-950 tracking-wider">
                नागरिकता का प्रकार (Select Citizenship Status):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCitizenship("INDIAN")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start space-x-3 cursor-pointer ${
                    citizenship === "INDIAN"
                      ? "border-orange-500 bg-orange-50/80 shadow-md ring-2 ring-orange-400/20"
                      : "border-slate-200 hover:border-orange-200 bg-white"
                  }`}
                >
                  <span className="text-2xl">🇮🇳</span>
                  <div>
                    <span className="font-black text-sm text-slate-900 block">भारतीय नागरिक (Indian Citizen)</span>
                    <span className="text-xs text-slate-600 font-medium">भारतीय बैंक खाता, UPI, डेबिट/क्रेडिट कार्ड से सहयोग</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCitizenship("NRI")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start space-x-3 cursor-pointer ${
                    citizenship === "NRI"
                      ? "border-orange-500 bg-orange-50/80 shadow-md ring-2 ring-orange-400/20"
                      : "border-slate-200 hover:border-orange-200 bg-white"
                  }`}
                >
                  <span className="text-2xl">🌍</span>
                  <div>
                    <span className="font-black text-sm text-slate-900 block">अनिवासी भारतीय (NRI / Overseas Indian)</span>
                    <span className="text-xs text-slate-600 font-medium">वैध भारतीय पासपोर्ट धारक (अंतरराष्ट्रीय कार्ड / रेमिटेंस)</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Frequency (One-Time vs Monthly) */}
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase text-orange-950 tracking-wider">
                सहयोग की आवृत्ति (Donation Frequency):
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setFrequency("one-time")}
                  className={`py-3 px-4 rounded-xl border-2 font-black text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    frequency === "one-time"
                      ? "border-orange-600 bg-orange-600 text-white shadow-md"
                      : "border-slate-300 bg-slate-50 text-slate-800 hover:bg-orange-50"
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span>एकमुश्त सहयोग (One-Time)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFrequency("monthly")}
                  className={`py-3 px-4 rounded-xl border-2 font-black text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    frequency === "monthly"
                      ? "border-orange-600 bg-orange-600 text-white shadow-md"
                      : "border-slate-300 bg-slate-50 text-slate-800 hover:bg-orange-50"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>मासिक सहयोग (Monthly Plan)</span>
                </button>
              </div>
            </div>

            {/* 3. Amount Presets & Custom Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase text-orange-950 tracking-wider">
                  सहयोग राशि (Choose Contribution Amount):
                </label>
                <span className="text-xs font-bold text-orange-700">चयनित: ₹{amount.toLocaleString("en-IN")}</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleSelectPreset(amt)}
                    className={`py-3 px-2 rounded-xl border-2 font-black text-sm transition-all cursor-pointer ${
                      amount === amt && !customAmount
                        ? "border-orange-600 bg-orange-600 text-white shadow-md scale-102"
                        : "border-slate-200 bg-slate-50 text-slate-800 hover:border-orange-300 hover:bg-white"
                    }`}
                  >
                    ₹{amt.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-500 text-base">₹</span>
                  <input
                    type="number"
                    min="10"
                    placeholder="अन्य कोई राशि दर्ज करें (Custom Amount in INR)..."
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border-2 border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl font-black text-sm outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 4. Donor KYC & Compliance Details */}
            <div className="space-y-4 pt-2 border-t border-orange-200">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-black text-orange-950">
                  सहयोगकर्ता का विवरण (Donor Identification)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
                <div>
                  <label className="block text-slate-700 mb-1">
                    पूरा नाम (Full Name) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={!isAnonymous}
                    placeholder="उदा. राहुल शर्मा"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    disabled={isAnonymous}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">
                    मोबाइल नंबर (Mobile Number) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={12}
                    placeholder="10-अंकीय मोबाइल नंबर"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">ईमेल पता (Email - रसीद हेतु):</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">राज्य / प्रदेश (State / Region):</label>
                  <select
                    value={donorState}
                    onChange={(e) => setDonorState(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all bg-white"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* NRI Specific Fields */}
                {citizenship === "NRI" && (
                  <>
                    <div>
                      <label className="block text-slate-700 mb-1">
                        भारतीय पासपोर्ट संख्या (Indian Passport Number) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="उदा. Z1234567"
                        value={passportNumber}
                        onChange={(e) => setPassportNumber(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1">वर्तमान निवास का देश (Country of Residence):</label>
                      <input
                        type="text"
                        placeholder="उदा. United States / UAE"
                        value={countryOfResidence}
                        onChange={(e) => setCountryOfResidence(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Anonymous Checkbox */}
              <div className="pt-2">
                <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                  />
                  <span>सार्वजनिक सूची में मेरा नाम गुप्त रखें (Make this contribution anonymous)</span>
                </label>
              </div>

              {/* Statutory Declaration Checkbox (Mandatory ECI & RPA Act) */}
              <div className="p-3.5 bg-orange-50/60 border border-orange-200 rounded-2xl space-y-2">
                <label className="flex items-start space-x-2.5 cursor-pointer text-xs text-slate-800 font-semibold leading-relaxed">
                  <input
                    type="checkbox"
                    required
                    checked={statutoryDeclaration}
                    onChange={(e) => setStatutoryDeclaration(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-orange-600 rounded focus:ring-orange-500 shrink-0"
                  />
                  <span>
                    <strong>सत्यनिष्ठा घोषणा (Statutory Declaration):</strong> मैं प्रमाणित करता/करती हूँ कि मैं भारत का नागरिक / वैध भारतीय पासपोर्ट धारक हूँ। यह सहयोग राशि मेरी वैध आय से स्वेच्छा से दी जा रही है तथा किसी विदेशी या अवैध स्रोत (FCRA) से संबंधित नहीं है।
                  </span>
                </label>
              </div>
            </div>

            {/* Form & Payment Error Notice */}
            {(formError || paymentError) && (
              <div className="p-3.5 bg-red-50 border border-red-300 text-red-700 rounded-xl text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError || paymentError}</span>
              </div>
            )}

            {/* Proceed to Payment Button (Cashfree PG v3) */}
            <div className="pt-4 space-y-3">
              <button
                type="button"
                onClick={handlePayWithCashfree}
                disabled={isCashfreeLoading}
                className="w-full py-4 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-black text-base shadow-xl flex items-center justify-center space-x-2.5 cursor-pointer transition-all disabled:opacity-75"
              >
                {isCashfreeLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>कैशफ्री गेटवे से कनेक्ट हो रहा है (Connecting to Cashfree)...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-orange-200" />
                    <span>Pay ₹{amount.toLocaleString("en-IN")} Now via Cashfree Gateway</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center space-x-1.5 text-[11px] font-bold text-slate-500 pt-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>256-Bit SSL • Cashfree PG API v3 (UPI / Card / NetBanking)</span>
              </div>
            </div>

          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: MULTI-CHANNEL PAYMENT GATEWAY (LIKE AAP PORTAL) */}
        {/* ========================================================================= */}
        {step === "payment" && (
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Top Summary & Back Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-orange-200 shadow-sm">
              <button
                type="button"
                onClick={() => setStep("details")}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>विवरण बदलें (Back)</span>
              </button>

              <div className="text-right">
                <span className="text-xs text-slate-500 font-bold block">कुल सहयोग राशि:</span>
                <span className="text-xl font-black text-orange-600">₹{amount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Cashfree PG Checkout Only */}
            <div className="bg-white border-2 border-orange-300 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-base font-black text-orange-950 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>कैशफ्री सुरक्षित पेमेंट गेटवे (Cashfree PG Checkout)</span>
                </span>
                <span className="text-[11px] bg-emerald-100 text-emerald-900 font-bold px-3 py-1 rounded-full">
                  UPI / Cards / NetBanking / Wallets
                </span>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                सुरक्षित और त्वरित भुगतान के लिए केवल आधिकारिक कैशफ्री पेमेंट गेटवे सक्रिय है।
              </p>

              <button
                type="button"
                onClick={() => handlePayWithCashfree()}
                disabled={isCashfreeLoading}
                className="w-full py-4 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-base shadow-xl flex items-center justify-center space-x-2.5 cursor-pointer transition-all disabled:opacity-75"
              >
                {isCashfreeLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>कैशफ्री गेटवे से कनेक्ट हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-orange-200" />
                    <span>Pay ₹{amount.toLocaleString("en-IN")} Now via Cashfree Gateway</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {paymentError && (
                <div className="p-3.5 bg-red-50 border border-red-300 text-red-700 rounded-xl text-xs font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: OFFICIAL 80GGC TAX EXEMPTION RECEIPT (PRINTABLE & DOWNLOADABLE) */}
        {/* ========================================================================= */}
        {step === "receipt" && generatedReceipt && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-emerald-300 shadow-sm">
              <div className="flex items-center space-x-2 text-emerald-800 font-black text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>सहयोग सफल! आधिकारिक 80GGC टैक्स रसीद जनरेट हो गई है।</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep("details");
                  setGeneratedReceipt(null);
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black cursor-pointer transition-all shadow"
              >
                <span>नया सहयोग करें</span>
              </button>
            </div>

            <OfficialReceiptCard
              receipt={{
                ...generatedReceipt,
                donorState: generatedReceipt.donorState || donorState || "उत्तर प्रदेश"
              }}
              showActions={true}
            />
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* CASHFREE PAYMENT GATEWAY MODAL (api.cashfree.com) */}
      {/* ========================================================================= */}
      {showCashfreeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-2 border-orange-500 overflow-hidden text-slate-900 animate-in zoom-in-95">
            
            {/* Cashfree Header */}
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-5 text-white flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-orange-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Cashfree Payments • api.cashfree.com</span>
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug">
                  कैशफ्री सुरक्षित पेमेंट गेटवे (Secure PG)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCashfreeModal(false)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Summary Ribbon */}
            <div className="bg-orange-50 px-5 py-3 border-b border-orange-200 flex items-center justify-between text-xs font-bold">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Order ID (api.cashfree.com):</span>
                <span className="font-mono text-slate-900 font-bold">{cashfreeOrderId || "order_sap_live"}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px] uppercase">कुल भुगतान राशि:</span>
                <span className="text-base font-black text-orange-600">₹{amount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">भुगतान विकल्प चुनें (Cashfree Mode):</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCashfreePaymentMethod("upi")}
                    className={`py-2.5 px-3 rounded-xl border text-center text-xs font-black transition-all cursor-pointer ${
                      cashfreePaymentMethod === "upi"
                        ? "border-orange-600 bg-orange-50 text-orange-950 shadow-sm"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    UPI / Apps
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashfreePaymentMethod("card")}
                    className={`py-2.5 px-3 rounded-xl border text-center text-xs font-black transition-all cursor-pointer ${
                      cashfreePaymentMethod === "card"
                        ? "border-orange-600 bg-orange-50 text-orange-950 shadow-sm"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Cards (Debit/Credit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashfreePaymentMethod("netbanking")}
                    className={`py-2.5 px-3 rounded-xl border text-center text-xs font-black transition-all cursor-pointer ${
                      cashfreePaymentMethod === "netbanking"
                        ? "border-orange-600 bg-orange-50 text-orange-950 shadow-sm"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Net Banking
                  </button>
                </div>
              </div>

              {/* UPI Tab */}
              {cashfreePaymentMethod === "upi" && (
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-xs font-black text-slate-800 block">सभी UPI ऐप्स समर्थित हैं (GPay, PhonePe, Paytm, BHIM):</span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => launchPaymentApp("phonepe", `Cashfree-SAP-${amount}`)}
                      className="p-2.5 rounded-xl border border-purple-300 bg-purple-50 text-purple-950 hover:bg-purple-100 flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>PhonePe App</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => launchPaymentApp("gpay", `Cashfree-SAP-${amount}`)}
                      className="p-2.5 rounded-xl border border-blue-300 bg-blue-50 text-blue-950 hover:bg-blue-100 flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Google Pay</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => launchPaymentApp("paytm", `Cashfree-SAP-${amount}`)}
                      className="p-2.5 rounded-xl border border-sky-300 bg-sky-50 text-sky-950 hover:bg-sky-100 flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Paytm UPI</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => launchPaymentApp("upi", `Cashfree-SAP-${amount}`)}
                      className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-950 hover:bg-emerald-100 flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Any UPI / QR</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Card Tab */}
              {cashfreePaymentMethod === "card" && (
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold">
                  <div>
                    <label className="block text-slate-700 mb-1">कार्ड नंबर (Card Number):</label>
                    <input
                      type="text"
                      maxLength={19}
                      placeholder="4111 2222 3333 4444"
                      value={cashfreeCardNumber}
                      onChange={(e) => setCashfreeCardNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 mb-1">समाप्ति (MM/YY):</label>
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="12/28"
                        value={cashfreeCardExpiry}
                        onChange={(e) => setCashfreeCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1">CVV:</label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        value={cashfreeCardCvv}
                        onChange={(e) => setCashfreeCardCvv(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* NetBanking Tab */}
              {cashfreePaymentMethod === "netbanking" && (
                <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold">
                  <label className="block text-slate-700 mb-1">बैंक चुनें (Select Bank):</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white outline-none focus:border-orange-500 text-xs font-bold"
                  >
                    {ALL_BANKS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}

              {paymentError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Verify & Complete Cashfree PG Payment */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    const orderId = cashfreeOrderId || `order_sap_${Date.now()}`;
                    verifyAndCompleteCashfreeOrder(orderId, cashfreeSessionId || undefined, `Cashfree PG (${cashfreePaymentMethod.toUpperCase()})`);
                  }}
                  className="w-full py-3.5 px-5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm shadow-xl flex items-center justify-center space-x-2 cursor-pointer transition-all disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>कैशफ्री सर्वर से भुगतान सत्यापित हो रहा है...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-300" />
                      <span>भुगतान पूर्ण करें • Complete ₹{amount.toLocaleString("en-IN")} via Cashfree</span>
                    </>
                  )}
                </button>

                <div className="text-center text-[10px] text-slate-500 font-bold flex items-center justify-center space-x-1.5">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>Secure 256-Bit SSL PCI-DSS Compliant • api.cashfree.com</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SIMULATED ONLINE GATEWAY MODAL (FOR CARD/NETBANKING/WALLET) */}
      {/* ========================================================================= */}
      {showSimulatedGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-2 border-orange-400 space-y-6 text-slate-900 animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  सुरक्षित पेमेंट गेटवे (3D Secure)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSimulatedGateway(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {gatewayStep === "processing" && (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <span className="font-black text-sm text-slate-900">बैंक सर्वर से सुरक्षित संपर्क स्थापित हो रहा है...</span>
                <span className="text-xs text-slate-500 font-medium">कृपया प्रतीक्षा करें, पृष्ठ को रीफ्रेश न करें।</span>
              </div>
            )}

            {gatewayStep === "otp" && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-xs text-slate-500 font-bold">बैंक प्रमाणीकरण (Bank OTP Verification)</span>
                  <h4 className="text-base font-black text-slate-950">₹{amount.toLocaleString("en-IN")} का भुगतान अधिकृत करें</h4>
                  <p className="text-xs text-slate-600 font-medium">
                    आपके पंजीकृत मोबाइल (••••••••{phone.slice(-2) || "88"}) पर 6 अंकों का OTP भेजा गया है।
                  </p>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <span className="text-xs text-amber-900 font-bold block">टेस्ट OTP (Auto-Generated):</span>
                  <span className="font-mono font-black text-lg text-amber-950 tracking-widest">{simulatedOtp}</span>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">OTP दर्ज करें:</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="6-अंकीय OTP"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 focus:border-orange-500 text-center font-mono text-xl tracking-widest font-black outline-none"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEnteredOtp(simulatedOtp)}
                    className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyOtpAndPay}
                    className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-lg cursor-pointer"
                  >
                    सत्यापित करें व भुगतान करें
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </section>
  );
};
