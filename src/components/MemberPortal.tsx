import React, { useState, useEffect } from "react";
import paymentQrImg from "../assets/images/payment_upi_qr.jpg";
import { PRECINCTS_LIST, PARTY_INFO, INDIAN_STATES } from "../data/campaignData";
import { MemberRecord } from "../types";
import { validateUtrNumber } from "../utils/utrValidation";
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  QrCode, 
  CheckCircle, 
  Printer, 
  Award, 
  MapPin, 
  Phone, 
  Mail, 
  Sparkles,
  Flame,
  Check,
  CreditCard,
  Smartphone,
  Building2,
  BadgeCheck,
  ArrowLeft,
  AlertCircle,
  Lock,
  Wallet,
  Landmark,
  FileText,
  Copy,
  X
} from "lucide-react";

const TIER_FEE_MAP: Record<string, number> = {
  "साधारण सदस्य": 10,
  "सक्रिय सदस्य": 275,
  "सक्रिय सहयोग सदस्यता": 500
};

const FEE_TIER_MAP: Record<number, string> = {
  10: "साधारण सदस्य",
  275: "सक्रिय सदस्य",
  500: "सक्रिय सहयोग सदस्यता"
};

const POPULAR_BANKS = [
  { id: "sbi", name: "State Bank of India (SBI)" },
  { id: "hdfc", name: "HDFC Bank" },
  { id: "icici", name: "ICICI Bank" },
  { id: "axis", name: "Axis Bank" },
  { id: "pnb", name: "Punjab National Bank" },
  { id: "bob", name: "Bank of Baroda" }
];

const WALLETS_LIST = [
  { id: "paytm_wallet", name: "Paytm Wallet" },
  { id: "phonepe_wallet", name: "PhonePe Wallet" },
  { id: "amazon_pay", name: "Amazon Pay" },
  { id: "mobikwik", name: "MobiKwik" }
];

interface MemberPortalProps {
  onCloseModal?: () => void;
}

export const MemberPortal: React.FC<MemberPortalProps> = ({ onCloseModal }) => {
  const [activeTab, setActiveTab] = useState<"register" | "roster">("register");
  
  // Registration Form state
  const [fullName, setFullName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [precinct, setPrecinct] = useState<string>(PRECINCTS_LIST[0]);
  const [membershipTier, setMembershipTier] = useState<string>("साधारण सदस्य");
  const [membershipFee, setMembershipFee] = useState<number>(10);
  const [isCustomFee, setIsCustomFee] = useState<boolean>(false);
  const [statutoryDeclaration, setStatutoryDeclaration] = useState<boolean>(true);
  
  // Payment Step state
  const [step, setStep] = useState<"details" | "payment">("details");
  const [paymentTab, setPaymentTab] = useState<"upi" | "card" | "netbanking" | "wallet" | "neft">("upi");
  const [utrNumber, setUtrNumber] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [formError, setFormError] = useState<string>("");
  const [paymentError, setPaymentError] = useState<string>("");

  // Card fields
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardExpiry, setCardExpiry] = useState<string>("");
  const [cardCvv, setCardCvv] = useState<string>("");

  // Netbanking & Wallet fields
  const [selectedBank, setSelectedBank] = useState<string>("State Bank of India (SBI)");
  const [selectedWallet, setSelectedWallet] = useState<string>("paytm_wallet");

  // Gateway Simulation Modal
  const [showSimulatedGateway, setShowSimulatedGateway] = useState<boolean>(false);
  const [gatewayStep, setGatewayStep] = useState<"processing" | "otp" | "success">("processing");
  const [simulatedOtp, setSimulatedOtp] = useState<string>("592814");
  const [enteredOtp, setEnteredOtp] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeMemberCard, setActiveMemberCard] = useState<MemberRecord | null>(null);

  const officialUpiId = PARTY_INFO.bankDetails.upiId?.trim() || "samanadhikarparty@sbi";

  // Unique Transaction Reference ID Generator per NPCI Spec
  const generateMemberTxnRef = (prefix: string = "SMP") => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${prefix}${timestamp}${randomSuffix}`;
  };

  const getNpciMemberParams = (noteOverride?: string, prefix: string = "SMP") => {
    const payeeVpa = officialUpiId;
    const payeeName = encodeURIComponent("Samanadhikar Party");
    const txnRef = generateMemberTxnRef(prefix);
    const txnNote = encodeURIComponent(noteOverride || "Member Registration");
    const amtStr = membershipFee && Number(membershipFee) > 0 ? Number(membershipFee).toFixed(2) : "10.00";

    return `pa=${payeeVpa}` +
      `&pn=${payeeName}` +
      `&tr=${txnRef}` +
      `&tn=${txnNote}` +
      `&am=${amtStr}` +
      `&cu=INR`;
  };

  const getCleanUpiPaymentUrl = (noteOverride?: string) => {
    const params = getNpciMemberParams(noteOverride, "MQR");
    return `upi://pay?${params}`;
  };

  const getMemberAppIntentUrl = (app: "phonepe" | "paytm" | "gpay" | "upi", noteOverride?: string) => {
    const userAgent = typeof navigator !== "undefined" ? (navigator.userAgent || navigator.vendor || "") : "";
    const isAndroid = /android/i.test(userAgent);
    const isIos = /iphone|ipad|ipod/i.test(userAgent);

    const prefixMap = { phonepe: "MPPE", paytm: "MPTM", gpay: "MGPY", upi: "MUPI" };
    const params = getNpciMemberParams(noteOverride, prefixMap[app] || "SMP");
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

  const launchMemberPaymentApp = (app: "phonepe" | "paytm" | "gpay" | "upi", noteOverride?: string) => {
    const params = getNpciMemberParams(noteOverride, "MUPI");
    const universalUrl = `upi://pay?${params}`;
    const targetUrl = getMemberAppIntentUrl(app, noteOverride);

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

  const [membersList, setMembersList] = useState<MemberRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number>(1450);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      if (data.members) {
        setMembersList(data.members);
      }
      if (data.totalMembers) {
        setTotalCount(data.totalMembers);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!fullName || fullName.trim().length < 2) {
      setFormError("कृपया अपना पूरा नाम दर्ज करें।");
      return;
    }

    if (!phone || phone.trim().length < 10) {
      setFormError("कृपया अपना 10 अंकों का वैध मोबाइल नंबर दर्ज करें।");
      return;
    }

    if (!statutoryDeclaration) {
      setFormError("कृपया सदस्यता शपथ व वैधानिक घोषणा को स्वीकार करें।");
      return;
    }

    if (membershipFee === 0) {
      submitMemberRegistration(0, "निःशुल्क कार्यकर्ता पंजीकरण", "");
    } else {
      setStep("payment");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const submitMemberRegistration = async (fee: number, customMethod?: string, customUtr?: string) => {
    setIsSubmitting(true);
    setPaymentError("");

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
      const method = customMethod || (
        paymentTab === "upi" ? "PhonePe / Paytm / UPI" :
        paymentTab === "card" ? "Debit / Credit Card" :
        paymentTab === "netbanking" ? `NetBanking (${selectedBank})` :
        paymentTab === "wallet" ? `Digital Wallet (${selectedWallet})` :
        "Bank Transfer (NEFT/RTGS)"
      );

      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        precinct,
        membershipTier,
        interests: ["समान अधिकार अभियान"],
        membershipFee: fee,
        paymentMethod: method,
        utrNumber: activeUtr ? activeUtr.trim().toUpperCase() : undefined,
        isFeePaid: fee > 0 ? true : false
      };

      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success && data.member) {
        setActiveMemberCard(data.member);
        setShowSimulatedGateway(false);
        setStep("details");
        fetchMembers();
      } else {
        setPaymentError(data.error || "पंजीकरण में समस्या आई।");
      }
    } catch (e) {
      console.error(e);
      setPaymentError("सर्वर से जुड़ने में त्रुटि आई।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartOnlineGateway = () => {
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
        setPaymentError("कृपया 3 अंकों का CVV दर्ज करें।");
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

  const handleVerifyOtpAndSubmit = () => {
    if (!enteredOtp || enteredOtp.trim().length < 4) {
      setPaymentError("कृपया 6 अंकों का OTP दर्ज करें।");
      return;
    }
    setGatewayStep("processing");

    setTimeout(() => {
      const label = paymentTab === "card" ? "Credit/Debit Card" : paymentTab === "netbanking" ? `NetBanking (${selectedBank})` : `Wallet (${selectedWallet})`;
      const simulatedTxn = `MEM-PAY-${Date.now().toString().slice(-8)}`;
      submitMemberRegistration(membershipFee, label, simulatedTxn);
    }, 1200);
  };

  return (
    <section className="py-10 bg-gradient-to-b from-orange-50/40 via-white to-orange-50/60 text-slate-900 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-4 py-1 rounded-full bg-orange-100 border border-orange-300 text-orange-950 text-xs font-black uppercase tracking-wider shadow-sm">
            <Flame className="w-4 h-4 text-orange-600 fill-orange-600 shrink-0" />
            <span>समान अधिकार पार्टी - सदस्यता अभियान 2026</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-orange-950 tracking-tight">
            सनातन राष्ट्र एवं समानता की क्रांति में सहभागी बनें
          </h2>

          <p className="text-slate-700 text-sm sm:text-base font-bold max-w-2xl mx-auto">
            आरक्षण समाप्ति, जनसंख्या नियंत्रण कानून, 780+ जिलों में वैदिक गुरुकुल तथा गौमाता को राष्ट्रमाता का दर्जा दिलाने हेतु समान अधिकार पार्टी की आधिकारिक सदस्यता ग्रहण करें।
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-full font-bold">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>सत्यापित डिजिटल सदस्यता पहचान पत्र (Digital ID Card)</span>
            </span>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-100 border border-amber-300 text-amber-950 rounded-full font-bold">
              <Users className="w-3.5 h-3.5 text-amber-700" />
              <span>{totalCount.toLocaleString("en-IN")}+ पंजीकृत राष्ट्रभक्त कार्यकर्ता</span>
            </span>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Form / Payment Column */}
          <div className="lg:col-span-7 bg-white border-2 border-orange-300 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            
            {step === "details" ? (
              <form onSubmit={handleDetailsSubmit} className="space-y-6 text-xs font-bold">
                
                <div className="flex items-center space-x-2 border-b border-orange-200 pb-3">
                  <UserPlus className="w-5 h-5 text-orange-600" />
                  <h3 className="text-base font-black text-orange-950">सदस्यता पंजीकरण फॉर्म (Member Registration)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 mb-1">
                      पूरा नाम (Full Name) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="उदा. अमित भारद्वाज"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1">
                      मोबाइल नंबर (WhatsApp / Call) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={12}
                      placeholder="10-अंकीय मोबाइल नंबर"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 outline-none transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1">जिला / मंडल (District):</label>
                    <select
                      value={precinct}
                      onChange={(e) => setPrecinct(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 outline-none transition-all bg-white"
                    >
                      {PRECINCTS_LIST.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Membership Tier & Fee Selector */}
                <div className="space-y-3 pt-2 border-t border-orange-200">
                  <label className="block text-xs font-black uppercase text-orange-950 tracking-wider">
                    सदस्यता का स्तर एवं सहयोग शुल्क (Select Tier & Fee):
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setMembershipTier("साधारण सदस्य");
                        setMembershipFee(10);
                        setIsCustomFee(false);
                      }}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        membershipTier === "साधारण सदस्य" && !isCustomFee
                          ? "border-orange-500 bg-orange-50 text-orange-950 shadow-md ring-2 ring-orange-400/20"
                          : "border-slate-200 bg-white hover:border-orange-200 text-slate-800"
                      }`}
                    >
                      <span className="font-black text-sm block">साधारण सदस्य</span>
                      <span className="text-xs text-orange-600 font-black block mt-0.5">₹10 शुल्क</span>
                      <span className="text-[10px] text-slate-500 block mt-1">प्राथमिक सदस्यता कार्ड</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMembershipTier("सक्रिय सदस्य");
                        setMembershipFee(275);
                        setIsCustomFee(false);
                      }}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        membershipTier === "सक्रिय सदस्य" && !isCustomFee
                          ? "border-orange-500 bg-orange-50 text-orange-950 shadow-md ring-2 ring-orange-400/20"
                          : "border-slate-200 bg-white hover:border-orange-200 text-slate-800"
                      }`}
                    >
                      <span className="font-black text-sm block">सक्रिय सदस्य</span>
                      <span className="text-xs text-orange-600 font-black block mt-0.5">₹275 शुल्क</span>
                      <span className="text-[10px] text-slate-500 block mt-1">कार्यकर्ता किट व आईडी</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMembershipTier("सक्रिय सहयोग सदस्यता");
                        setMembershipFee(500);
                        setIsCustomFee(false);
                      }}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        membershipTier === "सक्रिय सहयोग सदस्यता" && !isCustomFee
                          ? "border-orange-500 bg-orange-50 text-orange-950 shadow-md ring-2 ring-orange-400/20"
                          : "border-slate-200 bg-white hover:border-orange-200 text-slate-800"
                      }`}
                    >
                      <span className="font-black text-sm block">संरक्षक सदस्य</span>
                      <span className="text-xs text-orange-600 font-black block mt-0.5">₹500+ शुल्क</span>
                      <span className="text-[10px] text-slate-500 block mt-1">विशेष सहयोग पत्र</span>
                    </button>
                  </div>
                </div>

                {/* Declaration */}
                <div className="p-3.5 bg-orange-50/60 border border-orange-200 rounded-2xl space-y-1">
                  <label className="flex items-start space-x-2.5 cursor-pointer text-xs text-slate-800 font-semibold leading-relaxed">
                    <input
                      type="checkbox"
                      required
                      checked={statutoryDeclaration}
                      onChange={(e) => setStatutoryDeclaration(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-orange-600 rounded shrink-0"
                    />
                    <span>
                      मैं समान अधिकार पार्टी के संविधान, सिद्धांतों और सनातन राष्ट्र निर्माण के संकल्प में पूर्ण निष्ठा व्यक्त करता/करती हूँ।
                    </span>
                  </label>
                </div>

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-xl text-xs font-bold flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-4 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm shadow-xl flex items-center justify-center space-x-2 cursor-pointer transition-all hover:scale-101 active:scale-99"
                >
                  <span>भुगतान हेतु आगे बढ़ें • Pay ₹{membershipFee}</span>
                </button>

              </form>
            ) : (
              /* Payment Methods in Step 2 */
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-orange-200 pb-3">
                  <button
                    type="button"
                    onClick={() => setStep("details")}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>विवरण बदलें</span>
                  </button>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">सदस्यता शुल्क</span>
                    <span className="text-lg font-black text-orange-600">₹{membershipFee}</span>
                  </div>
                </div>

                {/* Payment Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentTab("upi")}
                    className={`p-3 rounded-2xl border-2 text-center text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                      paymentTab === "upi"
                        ? "border-orange-600 bg-orange-50 text-orange-950 shadow-md"
                        : "border-slate-200 text-slate-700"
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-orange-600" />
                    <span>UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentTab("card")}
                    className={`p-3 rounded-2xl border-2 text-center text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                      paymentTab === "card"
                        ? "border-orange-600 bg-orange-50 text-orange-950 shadow-md"
                        : "border-slate-200 text-slate-700"
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-orange-600" />
                    <span>कार्ड (Card)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentTab("netbanking")}
                    className={`p-3 rounded-2xl border-2 text-center text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                      paymentTab === "netbanking"
                        ? "border-orange-600 bg-orange-50 text-orange-950 shadow-md"
                        : "border-slate-200 text-slate-700"
                    }`}
                  >
                    <Landmark className="w-4 h-4 text-orange-600" />
                    <span>नेट बैंकिंग</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentTab("wallet")}
                    className={`p-3 rounded-2xl border-2 text-center text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                      paymentTab === "wallet"
                        ? "border-orange-600 bg-orange-50 text-orange-950 shadow-md"
                        : "border-slate-200 text-slate-700"
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-orange-600" />
                    <span>वॉलेट (Wallet)</span>
                  </button>
                </div>

                {/* UPI Tab */}
                {paymentTab === "upi" && (
                  <div className="p-5 bg-orange-50/60 border border-orange-200 rounded-3xl space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => launchMemberPaymentApp("phonepe")}
                        className="p-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-black text-xs shadow flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>PhonePe (₹{membershipFee})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => launchMemberPaymentApp("gpay")}
                        className="p-3 bg-slate-900 hover:bg-black text-white rounded-xl font-black text-xs shadow flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Google Pay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => launchMemberPaymentApp("paytm")}
                        className="p-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-black text-xs shadow flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Paytm UPI</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
                      <div className="flex flex-col items-center p-3 bg-white border border-orange-200 rounded-2xl">
                        <img 
                          src={paymentQrImg} 
                          alt="SBI UPI QR" 
                          className="w-36 h-36 object-contain rounded-xl"
                        />
                        <span className="text-[10px] text-slate-600 font-bold mt-1">UPI ID: {officialUpiId}</span>
                      </div>

                      <div className="space-y-3 text-xs font-bold">
                        <label className="block text-slate-800">12-अंकीय UPI UTR (RRN) दर्ज करें:</label>
                        <input
                          type="text"
                          maxLength={24}
                          placeholder="उदा. 420192847120"
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-orange-300 bg-white font-mono text-sm uppercase"
                        />
                        <button
                          type="button"
                          onClick={() => submitMemberRegistration(membershipFee, "UPI Payment", utrNumber)}
                          disabled={isSubmitting}
                          className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow cursor-pointer transition-all"
                        >
                          {isSubmitting ? "सत्यापन जारी है..." : "पुष्टि करें व डिजिटल ID कार्ड पाएं"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Card Tab */}
                {paymentTab === "card" && (
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4 text-xs font-bold">
                    <div>
                      <label className="block text-slate-700 mb-1">कार्ड नंबर (Card Number):</label>
                      <input
                        type="text"
                        maxLength={19}
                        placeholder="4532 •••• •••• 8921"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 mb-1">समाप्ति (MM/YY):</label>
                        <input
                          type="text"
                          maxLength={5}
                          placeholder="12/28"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 mb-1">CVV:</label>
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="•••"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleStartOnlineGateway}
                      className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow cursor-pointer"
                    >
                      कार्ड द्वारा भुगतान करें • Pay ₹{membershipFee}
                    </button>
                  </div>
                )}

                {/* Netbanking Tab */}
                {paymentTab === "netbanking" && (
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4 text-xs font-bold">
                    <label className="block text-slate-700">बैंक चुनें (Select Bank):</label>
                    <div className="grid grid-cols-2 gap-2">
                      {POPULAR_BANKS.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBank(b.name)}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                            selectedBank === b.name
                              ? "border-orange-500 bg-orange-50 text-orange-950 font-black"
                              : "border-slate-300 bg-white text-slate-800"
                          }`}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleStartOnlineGateway}
                      className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow cursor-pointer"
                    >
                      {selectedBank} से भुगतान करें (₹{membershipFee})
                    </button>
                  </div>
                )}

                {/* Wallet Tab */}
                {paymentTab === "wallet" && (
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4 text-xs font-bold">
                    <label className="block text-slate-700">वॉलेट चुनें (Select Wallet):</label>
                    <div className="grid grid-cols-2 gap-2">
                      {WALLETS_LIST.map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setSelectedWallet(w.id)}
                          className={`p-3 rounded-xl border text-left cursor-pointer ${
                            selectedWallet === w.id
                              ? "border-orange-500 bg-orange-50 text-orange-950 font-black"
                              : "border-slate-300 bg-white text-slate-800"
                          }`}
                        >
                          {w.name}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleStartOnlineGateway}
                      className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow cursor-pointer"
                    >
                      वॉलेट से भुगतान करें (₹{membershipFee})
                    </button>
                  </div>
                )}

                {paymentError && (
                  <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-xl text-xs font-bold flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* Right Column: Digital ID Card Preview */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border-2 border-orange-300 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              
              <div className="flex items-center justify-between border-b border-orange-200 pb-3">
                <h3 className="text-xs font-black uppercase text-orange-950 tracking-wider">
                  डिजिटल पार्टी पहचान पत्र (Digital ID Card)
                </h3>
                <Award className="w-4 h-4 text-orange-600" />
              </div>

              {/* ID Card */}
              <div className="bg-gradient-to-br from-orange-600 via-amber-600 to-orange-700 rounded-2xl p-6 text-white space-y-5 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <Flame className="w-4 h-4 text-orange-200 fill-orange-200" />
                      <span className="text-xs font-black tracking-wider text-white">
                        {PARTY_INFO.name}
                      </span>
                    </div>
                    <span className="text-[9px] font-black text-orange-100 block uppercase tracking-widest mt-1">
                      आधिकारिक सदस्यता पहचान पत्र
                    </span>
                  </div>
                  <QrCode className="w-10 h-10 text-orange-950 bg-white p-1 rounded-lg shadow-sm" />
                </div>

                <div className="space-y-1">
                  <div className="text-xl font-black tracking-tight">
                    {activeMemberCard ? activeMemberCard.fullName : (fullName || "आपका नाम")}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-white text-orange-950 text-xs font-black">
                      {activeMemberCard ? activeMemberCard.membershipTier : membershipTier}
                    </span>
                    {activeMemberCard?.isFeePaid && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-100 text-[10px] font-black">
                        ✓ सत्यापित
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono border-t border-white/30 pt-3">
                  <div>
                    <span className="text-orange-200 block text-[10px]">जिला / मंडल:</span>
                    <span className="font-extrabold truncate block">
                      {activeMemberCard ? activeMemberCard.precinct : precinct}
                    </span>
                  </div>
                  <div>
                    <span className="text-orange-200 block text-[10px]">कार्ड ID:</span>
                    <span className="font-black">
                      {activeMemberCard ? activeMemberCard.memberCardId : "SAP-2026-XXXX"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/30 flex items-center justify-between text-[10px] text-orange-100">
                  <span>हस्ताक्षर: कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)</span>
                  <span className="font-black">समान अधिकार पार्टी</span>
                </div>
              </div>

              {activeMemberCard && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow"
                >
                  <Printer className="w-4 h-4 text-orange-400" />
                  <span>डिजिटल सदस्यता कार्ड प्रिंट करें</span>
                </button>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* Simulated Gateway Modal for Membership */}
      {showSimulatedGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-2 border-orange-400 space-y-6 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black text-slate-900 uppercase">सदस्यता शुल्क भुगतान गेटवे</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSimulatedGateway(false)}
                className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {gatewayStep === "processing" && (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <span className="font-black text-sm">बैंक सर्वर से सुरक्षित संपर्क स्थापित हो रहा है...</span>
              </div>
            )}

            {gatewayStep === "otp" && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <h4 className="text-base font-black">₹{membershipFee} का सदस्यता शुल्क अधिकृत करें</h4>
                  <p className="text-xs text-slate-600 font-medium">पंजीकृत मोबाइल (••••••••{phone.slice(-2) || "88"}) पर प्रेषित OTP दर्ज करें।</p>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <span className="text-xs text-amber-900 font-bold block">टेस्ट OTP:</span>
                  <span className="font-mono font-black text-lg text-amber-950 tracking-widest">{simulatedOtp}</span>
                </div>

                <input
                  type="text"
                  maxLength={6}
                  placeholder="6-अंकीय OTP"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 text-center font-mono text-xl tracking-widest font-black outline-none"
                />

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
                    onClick={handleVerifyOtpAndSubmit}
                    className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow cursor-pointer"
                  >
                    सत्यापित करें व ID पाएं
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
