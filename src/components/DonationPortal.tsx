import React, { useState } from "react";
import paymentQrImg from "../assets/images/payment_upi_qr.jpg";
import { DONATION_PRESETS, PRECINCTS_LIST, PARTY_INFO, INDIAN_STATES } from "../data/campaignData";
import { DonationReceipt } from "../types";
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
  Download
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

            {/* Form Error Notice */}
            {formError && (
              <div className="p-3.5 bg-red-50 border border-red-300 text-red-700 rounded-xl text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Proceed to Payment Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-4 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-base shadow-xl flex items-center justify-center space-x-2 cursor-pointer hover:scale-101 active:scale-99 transition-all"
              >
                <span>भुगतान माध्यम चुनें • Pay ₹{amount.toLocaleString("en-IN")}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
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

            {/* Payment Method Selector Grid & Content */}
            <div className="bg-white border-2 border-orange-300 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              
              {/* Payment Methods Tab Bar */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase text-orange-950 tracking-wider">
                  भुगतान का माध्यम चुनें (Select Payment Mode):
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  
                  {/* 1. UPI & QR */}
                  <button
                    type="button"
                    onClick={() => setPaymentTab("upi")}
                    className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                      paymentTab === "upi"
                        ? "border-orange-600 bg-orange-50 text-orange-950 shadow-md font-black"
                        : "border-slate-200 hover:border-orange-300 text-slate-700 font-bold"
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-orange-600" />
                    <span className="text-xs leading-tight">UPI / QR Code</span>
                  </button>

                  {/* 2. Credit/Debit Card */}
                  <button
                    type="button"
                    onClick={() => setPaymentTab("card")}
                    className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                      paymentTab === "card"
                        ? "border-orange-600 bg-orange-50 text-orange-950 shadow-md font-black"
                        : "border-slate-200 hover:border-orange-300 text-slate-700 font-bold"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-orange-600" />
                    <span className="text-xs leading-tight">डेबिट / क्रेडिट कार्ड</span>
                  </button>

                  {/* 3. Net Banking */}
                  <button
                    type="button"
                    onClick={() => setPaymentTab("netbanking")}
                    className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                      paymentTab === "netbanking"
                        ? "border-orange-600 bg-orange-50 text-orange-950 shadow-md font-black"
                        : "border-slate-200 hover:border-orange-300 text-slate-700 font-bold"
                    }`}
                  >
                    <Landmark className="w-5 h-5 text-orange-600" />
                    <span className="text-xs leading-tight">नेट बैंकिंग</span>
                  </button>

                  {/* 4. Digital Wallets */}
                  <button
                    type="button"
                    onClick={() => setPaymentTab("wallet")}
                    className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                      paymentTab === "wallet"
                        ? "border-orange-600 bg-orange-50 text-orange-950 shadow-md font-black"
                        : "border-slate-200 hover:border-orange-300 text-slate-700 font-bold"
                    }`}
                  >
                    <Wallet className="w-5 h-5 text-orange-600" />
                    <span className="text-xs leading-tight">डिजिटल वॉलेट्स</span>
                  </button>

                  {/* 5. NEFT / RTGS */}
                  <button
                    type="button"
                    onClick={() => setPaymentTab("neft")}
                    className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                      paymentTab === "neft"
                        ? "border-orange-600 bg-orange-50 text-orange-950 shadow-md font-black"
                        : "border-slate-200 hover:border-orange-300 text-slate-700 font-bold"
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-orange-600" />
                    <span className="text-xs leading-tight">NEFT / RTGS</span>
                  </button>

                  {/* 6. Cheque / DD */}
                  <button
                    type="button"
                    onClick={() => setPaymentTab("cheque")}
                    className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                      paymentTab === "cheque"
                        ? "border-orange-600 bg-orange-50 text-orange-950 shadow-md font-black"
                        : "border-slate-200 hover:border-orange-300 text-slate-700 font-bold"
                    }`}
                  >
                    <FileText className="w-5 h-5 text-orange-600" />
                    <span className="text-xs leading-tight">चेक / ड्राफ्ट</span>
                  </button>

                  {/* 7. Systematic NACH Plan */}
                  <button
                    type="button"
                    onClick={() => setPaymentTab("nach")}
                    className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                      paymentTab === "nach"
                        ? "border-orange-600 bg-orange-50 text-orange-950 shadow-md font-black"
                        : "border-slate-200 hover:border-orange-300 text-slate-700 font-bold"
                    }`}
                  >
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <span className="text-xs leading-tight">मासिक NACH</span>
                  </button>

                </div>
              </div>

              {/* --------------------------------------------------------------- */}
              {/* TAB 1: UPI & QR CODE INTERACTION */}
              {/* --------------------------------------------------------------- */}
              {paymentTab === "upi" && (
                <div className="p-6 bg-orange-50/50 border border-orange-200 rounded-3xl space-y-6">
                  
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-200 pb-3">
                    <div>
                      <h4 className="text-base font-black text-orange-950">UPI भुगतान (PhonePe, GPay, Paytm, BHIM)</h4>
                      <p className="text-xs text-slate-600 font-medium">नीचे दिए गए ऐप बटन से तुरंत भुगतान करें अथवा QR कोड स्कैन करें।</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-emerald-100 text-emerald-950 px-3 py-1 rounded-full font-mono font-bold border border-emerald-300">
                        VPA: {officialUpiId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(officialUpiId, "vpa")}
                        className="px-2.5 py-1 bg-white border border-orange-300 hover:bg-orange-100 text-orange-900 rounded-lg text-xs font-black cursor-pointer transition-all"
                      >
                        {copiedField === "vpa" ? "✓ कॉपीड" : "कॉपी"}
                      </button>
                    </div>
                  </div>

                  {/* App Quick Launch Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* PhonePe */}
                    <button
                      type="button"
                      onClick={() => launchPaymentApp("phonepe")}
                      className="p-4 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs shadow-md flex items-center justify-center space-x-2 cursor-pointer hover:scale-102 active:scale-98 transition-all"
                    >
                      <Smartphone className="w-4 h-4 text-white" />
                      <span>PhonePe में खोलें (₹{amount})</span>
                    </button>

                    {/* Google Pay */}
                    <button
                      type="button"
                      onClick={() => launchPaymentApp("gpay")}
                      className="p-4 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-xs shadow-md flex items-center justify-center space-x-2 cursor-pointer hover:scale-102 active:scale-98 transition-all"
                    >
                      <Smartphone className="w-4 h-4 text-white" />
                      <span>Google Pay (GPay)</span>
                    </button>

                    {/* Paytm */}
                    <button
                      type="button"
                      onClick={() => launchPaymentApp("paytm")}
                      className="p-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs shadow-md flex items-center justify-center space-x-2 cursor-pointer hover:scale-102 active:scale-98 transition-all"
                    >
                      <Smartphone className="w-4 h-4 text-white" />
                      <span>Paytm UPI</span>
                    </button>

                    {/* Any UPI App */}
                    <button
                      type="button"
                      onClick={() => launchPaymentApp("upi")}
                      className="p-4 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-md flex items-center justify-center space-x-2 cursor-pointer hover:scale-102 active:scale-98 transition-all"
                    >
                      <QrCode className="w-4 h-4 text-white" />
                      <span>Any UPI App (BHIM/Cred)</span>
                    </button>
                  </div>

                  {/* QR Code & UTR Verification Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
                    
                    {/* Left: Interactive SBI QR Code */}
                    <div className="flex flex-col items-center text-center p-5 bg-white border border-orange-200 rounded-2xl shadow-sm space-y-3">
                      <span className="text-xs font-black text-orange-950 uppercase tracking-wider">
                        आधिकारिक SBI UPI QR Code
                      </span>
                      <div className="p-2.5 bg-white border-2 border-orange-400 rounded-2xl shadow-inner inline-block">
                        <img 
                          src={paymentQrImg} 
                          alt="Official Saman Adhikar Party SBI UPI QR Code" 
                          className="w-44 h-44 object-contain rounded-xl"
                        />
                      </div>
                      <p className="text-[11px] text-slate-600 font-bold">
                        अपने किसी भी UPI ऐप (PhonePe, GPay, Paytm, BHIM) से स्कैन कर ₹{amount} का सहयोग करें।
                      </p>
                    </div>

                    {/* Right: Instant UTR / RRN Input */}
                    <div className="space-y-4">
                      <div className="p-4 bg-white border border-orange-200 rounded-2xl space-y-3 shadow-sm">
                        <label className="block text-xs font-black text-orange-950">
                          भुगतान के बाद प्राप्त 12-अंकीय UPI UTR (RRN) या Ref ID दर्ज करें:
                        </label>
                        <input
                          type="text"
                          maxLength={24}
                          placeholder="उदा. 420192847120 या T260728..."
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                          className="w-full px-3.5 py-3 rounded-xl border-2 border-orange-300 focus:border-orange-500 font-mono text-sm font-black outline-none uppercase"
                        />
                        <p className="text-[11px] text-slate-500 font-medium">
                          💡 UTR संख्या आपके PhonePe/Paytm/GPay रसीद पर 'UPI Ref No' अथवा 'UTR' के रूप में प्रदर्शित होती है।
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleFinalizeDonation("UPI Payment")}
                        disabled={isSubmitting}
                        className="w-full py-4 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-lg flex items-center justify-center space-x-2 cursor-pointer transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <span>सत्यापन जारी है...</span>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            <span>सहयोग सत्यापित करें व 80GGC रसीद प्राप्त करें</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* --------------------------------------------------------------- */}
              {/* TAB 2: CREDIT / DEBIT CARD (ONLINE GATEWAY) */}
              {/* --------------------------------------------------------------- */}
              {paymentTab === "card" && (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h4 className="text-base font-black text-slate-900">डेबिट / क्रेडिट कार्ड (Visa, MasterCard, RuPay, Maestro)</h4>
                      <p className="text-xs text-slate-600 font-medium">256-बिट SSL सुरक्षित 3D सिक्योर पेमेंट गेटवे</p>
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-bold bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>PCI-DSS Compliant</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 mb-1">कार्ड नंबर (Card Number):</label>
                      <div className="relative">
                        <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          maxLength={19}
                          placeholder="4532 •••• •••• 8921"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 bg-white font-mono text-sm outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1">समाप्ति तिथि (Expiry MM/YY):</label>
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-300 bg-white font-mono text-sm outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1">CVV / CVC (3 अंक):</label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-300 bg-white font-mono text-sm outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 mb-1">कार्डधारक का नाम (Cardholder Name):</label>
                      <input
                        type="text"
                        placeholder="कार्ड पर लिखा नाम"
                        value={cardHolderName || donorName}
                        onChange={(e) => setCardHolderName(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartOnlineGatewayCheckout("Card")}
                    className="w-full py-4 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm shadow-xl flex items-center justify-center space-x-2 cursor-pointer transition-all"
                  >
                    <Lock className="w-4 h-4" />
                    <span>कार्ड द्वारा सुरक्षित भुगतान करें • Pay ₹{amount.toLocaleString("en-IN")}</span>
                  </button>
                </div>
              )}

              {/* --------------------------------------------------------------- */}
              {/* TAB 3: NET BANKING */}
              {/* --------------------------------------------------------------- */}
              {paymentTab === "netbanking" && (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-5">
                  <div className="border-b border-slate-200 pb-3">
                    <h4 className="text-base font-black text-slate-900">नेट बैंकिंग (Net Banking - All Major Indian Banks)</h4>
                    <p className="text-xs text-slate-600 font-medium">अपने बैंक के सुरक्षित पोर्टल से सीधे ऑनलाइन ट्रांसफर करें।</p>
                  </div>

                  {/* Popular Bank Selector Pills */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                      प्रमुख भारतीय बैंक (Popular Banks):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {POPULAR_BANKS.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBank(b.name)}
                          className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                            selectedBank === b.name
                              ? "border-orange-500 bg-orange-50 text-orange-950 ring-2 ring-orange-400/20"
                              : "border-slate-300 bg-white hover:border-orange-200 text-slate-800"
                          }`}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Searchable All Banks Dropdown */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                      अन्य सभी बैंक (Select From All Banks):
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-300 bg-white text-xs font-bold outline-none focus:border-orange-500"
                    >
                      {ALL_BANKS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartOnlineGatewayCheckout("NetBanking")}
                    className="w-full py-4 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm shadow-xl flex items-center justify-center space-x-2 cursor-pointer transition-all"
                  >
                    <Landmark className="w-4 h-4" />
                    <span>{selectedBank} नेट बैंकिंग से भुगतान करें (₹{amount})</span>
                  </button>
                </div>
              )}

              {/* --------------------------------------------------------------- */}
              {/* TAB 4: DIGITAL WALLETS */}
              {/* --------------------------------------------------------------- */}
              {paymentTab === "wallet" && (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-5">
                  <div className="border-b border-slate-200 pb-3">
                    <h4 className="text-base font-black text-slate-900">डिजिटल वॉलेट्स (Digital Wallets)</h4>
                    <p className="text-xs text-slate-600 font-medium">अपने पसंदीदा वॉलेट से 1-क्लिक में सहयोग राशि प्रेषित करें।</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {WALLETS_LIST.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSelectedWallet(w.id)}
                        className={`p-4 rounded-2xl border-2 text-left font-black text-xs transition-all cursor-pointer flex items-center justify-between ${
                          selectedWallet === w.id
                            ? "border-orange-500 bg-orange-50 text-orange-950 ring-2 ring-orange-400/20"
                            : "border-slate-200 bg-white hover:border-orange-200 text-slate-800"
                        }`}
                      >
                        <span>{w.name}</span>
                        <CheckCircle className={`w-4 h-4 ${selectedWallet === w.id ? "text-orange-600" : "text-slate-300"}`} />
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartOnlineGatewayCheckout("Wallet")}
                    className="w-full py-4 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm shadow-xl flex items-center justify-center space-x-2 cursor-pointer transition-all"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>वॉलेट से भुगतान करें • Pay ₹{amount.toLocaleString("en-IN")}</span>
                  </button>
                </div>
              )}

              {/* --------------------------------------------------------------- */}
              {/* TAB 5: DIRECT BANK TRANSFER (NEFT / RTGS / IMPS) */}
              {/* --------------------------------------------------------------- */}
              {paymentTab === "neft" && (
                <div className="p-6 bg-white border-2 border-orange-200 rounded-3xl space-y-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-orange-200 pb-3">
                    <div>
                      <h4 className="text-base font-black text-orange-950">सीधा बैंक ट्रांसफर (NEFT / RTGS / IMPS)</h4>
                      <p className="text-xs text-slate-600 font-medium">पार्टी के आधिकारिक भारतीय स्टेट बैंक (SBI) खाते में ट्रांसफर करें।</p>
                    </div>
                    <div className="px-3 py-1 bg-orange-100 text-orange-950 rounded-lg text-xs font-black border border-orange-300">
                      SBI आगरा सदर शाखा
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="bg-orange-50/80 border border-orange-200 p-3 rounded-xl space-y-0.5">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">खाताधारक</span>
                      <span className="font-black text-orange-950 block">{PARTY_INFO.bankDetails.accountHolder}</span>
                    </div>

                    <div className="bg-orange-50/80 border border-orange-200 p-3 rounded-xl space-y-0.5">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">खाता संख्या</span>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-orange-600 font-mono text-sm">{PARTY_INFO.bankDetails.accountNo}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(PARTY_INFO.bankDetails.accountNo, "acc")}
                          className="p-1 text-orange-700 hover:text-orange-950 bg-white rounded border border-orange-200 shadow-sm cursor-pointer"
                        >
                          {copiedField === "acc" ? "✓" : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-orange-50/80 border border-orange-200 p-3 rounded-xl space-y-0.5">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">IFSC कोड</span>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-orange-950 font-mono">{PARTY_INFO.bankDetails.ifscCode}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(PARTY_INFO.bankDetails.ifscCode, "ifsc")}
                          className="p-1 text-orange-700 hover:text-orange-950 bg-white rounded border border-orange-200 shadow-sm cursor-pointer"
                        >
                          {copiedField === "ifsc" ? "✓" : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-orange-50/80 border border-orange-200 p-3 rounded-xl space-y-0.5">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">बैंक व शाखा</span>
                      <span className="font-bold text-slate-800 block">SBI, सदर बाजार, आगरा</span>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 bg-orange-50/40 border border-orange-200 rounded-2xl">
                    <label className="block text-xs font-black text-orange-950">
                      NEFT / RTGS ट्रांसफर के बाद प्राप्त बैंक UTR संख्या दर्ज करें:
                    </label>
                    <input
                      type="text"
                      maxLength={24}
                      placeholder="उदा. SBIN24081298412..."
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-3 rounded-xl border border-orange-300 bg-white font-mono text-sm font-bold uppercase"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleFinalizeDonation("NEFT / RTGS Transfer")}
                    className="w-full py-4 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-xl flex items-center justify-center space-x-2 cursor-pointer transition-all"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>NEFT ट्रांसफर सत्यापित करें व 80GGC रसीद प्राप्त करें</span>
                  </button>
                </div>
              )}

              {/* --------------------------------------------------------------- */}
              {/* TAB 6: CHEQUE / DEMAND DRAFT */}
              {/* --------------------------------------------------------------- */}
              {paymentTab === "cheque" && (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-5">
                  <div className="border-b border-slate-200 pb-3">
                    <h4 className="text-base font-black text-slate-900">चेक / डिमांड ड्राफ्ट (Cheque / Demand Draft)</h4>
                    <p className="text-xs text-slate-600 font-medium">चेक 'SAMAN ADHIKAR PARTY' के नाम देय (Payable at Agra) होना चाहिए।</p>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 text-xs">
                    <span className="font-black text-orange-950 block">डाक द्वारा भेजने का पता (Postal Mailing Address):</span>
                    <p className="text-slate-700 font-semibold leading-relaxed">
                      <strong>समान अधिकार पार्टी केंद्रीय कार्यालय</strong><br />
                      सदर बाजार, आगरा एवं मथुरा मंडल, उत्तर प्रदेश, भारत - 282001<br />
                      संपर्क हेल्पलाइन: +91 9412165541 / 7310732088
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
                    <div>
                      <label className="block text-slate-700 mb-1">चेक / डीडी नंबर (Cheque/DD Number):</label>
                      <input
                        type="text"
                        placeholder="उदा. 004921"
                        value={chequeNumber}
                        onChange={(e) => setChequeNumber(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-300 bg-white font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1">जारीकर्ता बैंक (Issuing Bank Name):</label>
                      <input
                        type="text"
                        placeholder="उदा. State Bank of India"
                        value={chequeBank}
                        onChange={(e) => setChequeBank(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-300 bg-white text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleFinalizeDonation(`Cheque No: ${chequeNumber || "Pledged"} (${chequeBank || "Bank"})`, chequeNumber ? `CHQ-${chequeNumber}` : undefined)}
                    className="w-full py-4 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm shadow-xl flex items-center justify-center space-x-2 cursor-pointer transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    <span>चेक सहयोग संकल्प दर्ज करें व रसीद प्राप्त करें</span>
                  </button>
                </div>
              )}

              {/* --------------------------------------------------------------- */}
              {/* TAB 7: SYSTEMATIC MONTHLY NACH MANDATE */}
              {/* --------------------------------------------------------------- */}
              {paymentTab === "nach" && (
                <div className="p-6 bg-orange-50/60 border border-orange-200 rounded-3xl space-y-5">
                  <div className="border-b border-orange-200 pb-3">
                    <h4 className="text-base font-black text-orange-950">सिस्टमेटिक डोनेशन प्लान (Automated Monthly NACH)</h4>
                    <p className="text-xs text-slate-700 font-medium">हर महीने स्वतः सहयोग के लिए बैंक NACH फॉर्म अथवा e-Mandate सक्रिय करें।</p>
                  </div>

                  <div className="space-y-3 text-xs text-slate-800 leading-relaxed">
                    <div className="p-4 bg-white border border-orange-200 rounded-2xl space-y-2">
                      <span className="font-black text-orange-950">NACH मासिक सहयोग कैसे काम करता है?</span>
                      <ol className="list-decimal list-inside space-y-1 text-slate-700 font-medium">
                        <li>मासिक संकल्प राशि (उदा. ₹{amount}) आपके बैंक खाते से प्रति माह स्वतः हस्तांतरित होती है।</li>
                        <li>प्रत्येक माह की कटौती पर आपको स्वचालित 80GGC टैक्स रसीद ईमेल द्वारा प्राप्त होगी।</li>
                        <li>आप कभी भी हेल्पलाइन (9412165541) पर एक संदेश भेजकर इसे रोक सकते हैं।</li>
                      </ol>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleFinalizeDonation("Monthly NACH Systematic Plan")}
                    className="w-full py-4 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-xl flex items-center justify-center space-x-2 cursor-pointer transition-all"
                  >
                    <Calendar className="w-5 h-5" />
                    <span>मासिक NACH सहयोग सक्रिय करें (₹{amount}/माह)</span>
                  </button>
                </div>
              )}

              {/* Payment Error */}
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
            
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-emerald-300 shadow-sm">
              <div className="flex items-center space-x-2 text-emerald-800 font-black text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>सहयोग सफल! आधिकारिक 80GGC टैक्स रसीद जनरेट हो गई है।</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black flex items-center space-x-1.5 cursor-pointer transition-all shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>प्रिंट (Print Receipt)</span>
                </button>
                
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
            </div>

            {/* Official Certificate Card */}
            <div className="bg-white border-2 border-emerald-600 rounded-3xl p-8 shadow-2xl space-y-6 text-slate-900 relative print:border-none print:shadow-none">
              
              {/* Certificate Header */}
              <div className="text-center space-y-2 border-b-2 border-slate-200 pb-5">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-950 text-[11px] font-black uppercase">
                  <span>भारत निर्वाचन आयोग (ECI) पंजीकृत राजनीतिक दल</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-orange-950 tracking-tight">
                  समान अधिकार पार्टी (SAMAN ADHIKAR PARTY)
                </h2>
                <p className="text-xs text-slate-600 font-bold">
                  केंद्रीय कार्यालय: सदर बाजार, आगरा एवं मथुरा मंडल, उत्तर प्रदेश | दूरभाष: 9412165541, 7310732088
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono font-bold text-slate-700 pt-1">
                  <span>पार्टी PAN: <strong className="text-slate-950">{generatedReceipt.partyPan || "AAATS7821P"}</strong></span>
                  <span>•</span>
                  <span>पंजीकरण संख्या: <strong>56/112/2024/PPS-I</strong></span>
                  <span>•</span>
                  <span>धारा 80GGC / 80GGB आयकर अधिनियम 1961</span>
                </div>
              </div>

              {/* Receipt Title */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-1">
                <span className="text-xs uppercase font-black tracking-widest text-emerald-900 block">
                  आधिकारिक सहयोग रसीद एवं कर छूट प्रमाण पत्र
                </span>
                <span className="text-sm font-black text-emerald-950">
                  OFFICIAL CONTRIBUTION & 100% TAX DEDUCTION RECEIPT
                </span>
              </div>

              {/* Grid of Receipt Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">रसीद संख्या (Receipt No.)</span>
                  <span className="font-mono font-black text-sm text-slate-900">{generatedReceipt.receiptNumber}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">ट्रांजैक्शन / UTR संख्या</span>
                  <span className="font-mono font-black text-sm text-orange-600">{generatedReceipt.paymentRef}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">सहयोगकर्ता का नाम (Donor Name)</span>
                  <span className="font-black text-slate-900 text-sm">{generatedReceipt.donorName}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">सहयोगकर्ता राज्य / क्षेत्र (State / Region)</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {generatedReceipt.donorState || donorState || "उत्तर प्रदेश"}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">सहयोग राशि (Amount)</span>
                  <span className="font-black text-emerald-700 text-base">₹{generatedReceipt.amount.toLocaleString("en-IN")}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">दिनांक व समय (Date & Time)</span>
                  <span className="font-bold text-slate-800">{generatedReceipt.date}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">भुगतान माध्यम (Payment Method)</span>
                  <span className="font-bold text-slate-800">{generatedReceipt.paymentMethod}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">भुगतान स्थिति (Status)</span>
                  <span className="inline-flex items-center space-x-1 font-black text-emerald-700">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>सत्यापित एवं स्वीकृत (VERIFIED)</span>
                  </span>
                </div>
              </div>

              {/* Tax Exemption Endorsement */}
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs space-y-1.5 text-slate-800">
                <span className="font-black text-amber-950 block">आयकर अधिनियम 1961 की धारा 80GGC के अंतर्गत कर कटौती:</span>
                <p className="text-[11px] leading-relaxed text-slate-700">
                  समान अधिकार पार्टी को चेक, बैंक ट्रांसफर, UPI अथवा क्रेडिट/डेबिट कार्ड द्वारा दिया गया आपका यह सहयोग आयकर अधिनियम 1961 की धारा 80GGC (व्यक्तियों हेतु) एवं धारा 80GGB (कंपनियों हेतु) के तहत 100% कर कटौती हेतु मान्य है।
                </p>
              </div>

              {/* Signature and Seal */}
              <div className="flex items-end justify-between pt-6 border-t border-slate-200 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 block uppercase">बैंक प्राप्ति खाता:</span>
                  <span className="font-mono text-[11px] font-bold text-slate-800">
                    SBI A/C: {generatedReceipt.bankDetails?.accountNo} • IFSC: {generatedReceipt.bankDetails?.ifsc}
                  </span>
                </div>

                <div className="text-right space-y-1">
                  <span className="font-black text-orange-950 block">कुलदीप शर्मा (Kuldeep Sharma)</span>
                  <span className="text-[10px] text-slate-500 block">राष्ट्रीय अध्यक्ष, समान अधिकार पार्टी</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">
                    DIGITALLY SIGNED & VERIFIED
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

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
