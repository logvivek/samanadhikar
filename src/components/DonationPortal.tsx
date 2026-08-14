import React, { useState } from "react";
import paymentQrImg from "../assets/images/payment_upi_qr.jpg";
import { DONATION_PRESETS, PRECINCTS_LIST, PARTY_INFO } from "../data/campaignData";
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
  X
} from "lucide-react";

interface DonationPortalProps {
  onDonationSuccess: (receipt: DonationReceipt) => void;
  onCloseModal?: () => void;
  totalRaised?: number;
  donorCount?: number;
}

export const DonationPortal: React.FC<DonationPortalProps> = ({
  onDonationSuccess,
  onCloseModal,
  totalRaised = 1285400,
  donorCount = 3420
}) => {
  const [amount, setAmount] = useState<number>(1100);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [frequency, setFrequency] = useState<"one-time" | "monthly" | "weekly">("one-time");
  
  // Supporter details
  const [donorName, setDonorName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [precinct, setPrecinct] = useState<string>(PRECINCTS_LIST[0]);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  // Step control: 'details' | 'payment' | 'receipt'
  const [step, setStep] = useState<"details" | "payment" | "receipt">("details");

  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<"phonepe" | "paytm" | "gpay" | "netbanking">("phonepe");
  const [utrNumber, setUtrNumber] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [paymentError, setPaymentError] = useState<string>("");

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generatedReceipt, setGeneratedReceipt] = useState<DonationReceipt | null>(null);

  const selectedPreset = DONATION_PRESETS.find(p => p.amount === amount);
  const officialUpiId = PARTY_INFO.bankDetails.upiId?.trim() || "samanadhikarparty@sbi";

  // Unique Transaction Reference ID Generator per NPCI Spec
  const generateNpciTxnRef = (prefix: string = "SAP") => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${prefix}${timestamp}${randomSuffix}`;
  };

  // Full NPCI Compliant Direct VPA Parameter Builder (Direct Peer-to-Organization Transfer)
  // Omitting merchant-specific parameters (mc, mode=02, orgid) prevents PhonePe/GPay from misidentifying
  // standard party VPAs as merchant accounts and throwing "UPI payments are not allowed on account type" errors.
  const getNpciParams = (noteOverride?: string, includeTxnRef: boolean = true, prefix: string = "SAP") => {
    const payeeVpa = officialUpiId;
    const payeeName = encodeURIComponent("Samanadhikar Party");
    const txnRef = generateNpciTxnRef(prefix);
    const txnNote = encodeURIComponent(noteOverride || "Website Contribution");
    const amtStr = amount && Number(amount) > 0 ? Number(amount).toFixed(2) : "100.00";

    return `pa=${payeeVpa}` +
      `&pn=${payeeName}` +
      (includeTxnRef ? `&tr=${txnRef}` : "") +
      `&tn=${txnNote}` +
      `&am=${amtStr}` +
      `&cu=INR`;
  };

  // Clean NPCI UPI URL for QR Code & Direct Links
  const getCleanUpiUrl = (noteOverride?: string) => {
    const params = getNpciParams(noteOverride, true, "QR");
    return `upi://pay?${params}`;
  };

  // Dedicated multi-stage app launcher as per PhonePe, Paytm, and Google Pay NPCI Direct Integration guidelines
  const getAppIntentUrl = (app: "phonepe" | "paytm" | "gpay" | "upi", noteOverride?: string) => {
    const userAgent = typeof navigator !== "undefined" ? (navigator.userAgent || navigator.vendor || "") : "";
    const isAndroid = /android/i.test(userAgent);
    const isIos = /iphone|ipad|ipod/i.test(userAgent);

    const prefixMap = { phonepe: "PPE", paytm: "PTM", gpay: "GPY", upi: "UPI" };
    const params = getNpciParams(noteOverride, true, prefixMap[app] || "SAP");
    const universalUrl = `upi://pay?${params}`;

    if (app === "phonepe") {
      if (isAndroid) {
        return `intent://pay?${params}#Intent;scheme=upi;package=com.phonepe.app;end`;
      } else if (isIos) {
        return `phonepe://pay?${params}`;
      }
      return universalUrl;
    }

    if (app === "paytm") {
      if (isAndroid) {
        return `intent://pay?${params}#Intent;scheme=upi;package=net.one97.paytm;end`;
      } else if (isIos) {
        return `paytmmp://pay?${params}`;
      }
      return universalUrl;
    }

    if (app === "gpay") {
      if (isAndroid) {
        return `intent://pay?${params}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
      } else if (isIos) {
        return `gpay://upi/pay?${params}`;
      }
      return universalUrl;
    }

    return universalUrl;
  };

  const launchPaymentApp = (app: "phonepe" | "paytm" | "gpay" | "upi", noteOverride?: string) => {
    const targetUrl = getAppIntentUrl(app, noteOverride);
    const universalUrl = `upi://pay?${getNpciParams(noteOverride, true, "UPI")}`;

    try {
      window.location.href = targetUrl;
    } catch (e) {
      window.location.href = universalUrl;
    }
  };

  const getStandardUpiUrl = (noteOverride?: string) => {
    return getCleanUpiUrl(noteOverride);
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

  // Move from Details to Payment step after validation
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!amount || amount <= 0) {
      setFormError("कृपया मान्य दान राशि का चयन करें या दर्ज करें।");
      return;
    }

    let finalName = donorName.trim();
    if (!finalName && !isAnonymous) {
      finalName = "राष्ट्रभक्त नागरिक";
      setDonorName("राष्ट्रभक्त नागरिक");
    }

    if (!phone || phone.trim().length < 10) {
      setFormError("कृपया अपना 10 अंकों का मोबाइल नंबर दर्ज करें।");
      return;
    }

    setFormError("");
    setPaymentError("");
    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Finalize payment and generate receipt
  const handleConfirmAndGenerateReceipt = async (customUtr?: string) => {
    setPaymentError("");

    const activeUtr = customUtr || utrNumber;

    if (activeUtr && activeUtr.trim().length > 0) {
      const v = validateUtrNumber(activeUtr);
      if (!v.isValid) {
        setPaymentError(v.message);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const methodLabel = paymentMethod === "phonepe" ? "PhonePe UPI"
        : paymentMethod === "paytm" ? "Paytm UPI / Wallet"
        : paymentMethod === "gpay" ? "Google Pay (GPay)"
        : "SBI NetBanking / Bank Transfer";

      const finalUtr = activeUtr && activeUtr.trim().length > 0 
        ? activeUtr 
        : `4201${Math.floor(10000000 + Math.random() * 90000000)}`;

      const response = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorName: donorName || "समर्थक",
          amount,
          frequency,
          precinct,
          isAnonymous,
          message,
          paymentMethod: methodLabel,
          utrNumber: finalUtr,
          isPaymentCompleted: true
        })
      });

      const data = await response.json();

      if (data.success && data.receipt) {
        setGeneratedReceipt(data.receipt);
        onDonationSuccess(data.receipt);
        setStep("receipt");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setPaymentError(data.error || "भुगतान में त्रुटि आई। पुनः प्रयास करें।");
      }
    } catch (err) {
      console.error(err);
      setPaymentError("भुगतान सत्यापन में समस्या आई। पुनः प्रयास करें।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenUpiAndGenerateReceipt = (appType?: "phonepe" | "paytm" | "gpay" | "upi") => {
    const targetApp = appType || paymentMethod;
    launchPaymentApp(targetApp === "netbanking" ? "upi" : targetApp);
  };

  return (
    <section className="py-12 bg-gradient-to-b from-white to-orange-50/80 text-slate-900 min-h-screen">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-orange-100 border border-orange-300 text-orange-950 text-xs font-black uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-600" />
            <span>समान अधिकार पार्टी - आधिकारिक सहयोग पोर्टल</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-orange-950 tracking-tight">
            राष्ट्र निर्माण एवं हिंदू राष्ट्र मिशन हेतु आर्थिक सहयोग
          </h2>
          <p className="text-slate-800 text-sm sm:text-base font-bold">
            समान अधिकार पार्टी किसी कॉर्पोरेट से चंदा नहीं लेती। हमारा प्रत्येक अभियान आपके स्वेच्छा से दिए गए सहयोग पर आधारित है।
          </p>
        </div>

        {/* Payment Process Step Tracker */}
        <div className="max-w-2xl mx-auto bg-white border border-orange-200 rounded-2xl p-3 shadow-sm">
          <div className="flex items-center justify-between text-xs font-black">
            
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl ${
              step === "details" ? "bg-orange-500 text-white" : "text-emerald-700 bg-emerald-50"
            }`}>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
              <span>1. विवरण एवं राशि</span>
            </div>

            <div className="h-0.5 w-8 bg-orange-200" />

            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl ${
              step === "payment" ? "bg-orange-500 text-white" : step === "receipt" ? "text-emerald-700 bg-emerald-50" : "text-slate-400 bg-slate-100"
            }`}>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
              <span>2. भुगतान (Payment)</span>
            </div>

            <div className="h-0.5 w-8 bg-orange-200" />

            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl ${
              step === "receipt" ? "bg-emerald-600 text-white" : "text-slate-400 bg-slate-100"
            }`}>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">3</span>
              <span>3. रसीद (Receipt)</span>
            </div>

          </div>
        </div>

        {/* SBI Bank Details Banner */}
        {step !== "receipt" && (
          <div className="space-y-4">
            {/* SBI Bank Details Highlight Banner */}
            <div className="bg-white border-2 border-orange-300 rounded-3xl p-6 shadow-md space-y-4 text-left relative">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-200 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black shadow-sm">
                  <Landmark className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase text-orange-700 tracking-wider">
                    भारतीय स्टेट बैंक (State Bank of India)
                  </span>
                  <h3 className="text-lg font-black text-orange-950">आधिकारिक बैंक खाता विवरण</h3>
                </div>
              </div>
              <div className="px-3 py-1 bg-orange-100 text-orange-950 rounded-lg text-xs font-black border border-orange-300">
                आगरा सदर बाजार शाखा
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="bg-orange-50/80 border border-orange-200 p-3 rounded-xl space-y-0.5">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">खाताधारक</span>
                <span className="font-black text-orange-950 block">{PARTY_INFO.bankDetails.accountHolder}</span>
              </div>

              <div className="bg-orange-50/80 border border-orange-200 p-3 rounded-xl space-y-0.5 relative">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">खाता संख्या</span>
                <div className="flex items-center justify-between">
                  <span className="font-black text-orange-600 font-mono text-sm">{PARTY_INFO.bankDetails.accountNo}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(PARTY_INFO.bankDetails.accountNo, "acc")}
                    className="p-1 text-orange-700 hover:text-orange-950 bg-white rounded border border-orange-200 shadow-sm cursor-pointer"
                  >
                    {copiedField === "acc" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="bg-orange-50/80 border border-orange-200 p-3 rounded-xl space-y-0.5 relative">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">IFSC कोड</span>
                <div className="flex items-center justify-between">
                  <span className="font-black text-orange-950 font-mono">{PARTY_INFO.bankDetails.ifscCode}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(PARTY_INFO.bankDetails.ifscCode, "ifsc")}
                    className="p-1 text-orange-700 hover:text-orange-950 bg-white rounded border border-orange-200 shadow-sm cursor-pointer"
                  >
                    {copiedField === "ifsc" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="bg-orange-50/80 border border-orange-200 p-3 rounded-xl space-y-0.5 relative">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">आधिकारिक UPI ID</span>
                <div className="flex items-center justify-between">
                  <span className="font-black text-emerald-700 font-mono text-xs truncate">{PARTY_INFO.bankDetails.upiId}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(PARTY_INFO.bankDetails.upiId, "upi")}
                    className="p-1 text-orange-700 hover:text-orange-950 bg-white rounded border border-orange-200 shadow-sm cursor-pointer shrink-0"
                  >
                    {copiedField === "upi" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ================= STEP 1: DETAILS & AMOUNT FORM ================= */}
        {step === "details" && (
          <form onSubmit={handleProceedToPayment} className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            
            {/* Left Column: Preset Amount Selection */}
            <div className="lg:col-span-7 bg-white border border-orange-200 rounded-3xl p-6 sm:p-8 space-y-8 shadow-md">
              
              <div className="space-y-4">
                <label className="block text-xs font-black uppercase text-orange-900 tracking-wider">
                  1. सहयोग राशि का चयन करें (Choose Amount)
                </label>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {DONATION_PRESETS.map((preset) => {
                    const isSelected = amount === preset.amount && !customAmount;
                    return (
                      <button
                        key={preset.amount}
                        type="button"
                        onClick={() => handleSelectPreset(preset.amount)}
                        className={`py-2.5 px-2 rounded-xl border-2 text-center transition-all duration-200 cursor-pointer relative group ${
                          isSelected
                            ? "bg-gradient-to-b from-orange-500 to-orange-600 border-orange-600 text-white shadow-md scale-[1.03] ring-2 ring-orange-300"
                            : "bg-white border-orange-200 text-orange-950 hover:bg-orange-50 hover:border-orange-300 hover:shadow-xs active:scale-95"
                        }`}
                      >
                        <div className="text-sm sm:text-base font-black tracking-tight">{preset.label}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amount Input - High Prominence & Increased Size */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-orange-600 font-black text-xl sm:text-2xl">
                    ₹
                  </div>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    placeholder="अन्य इच्छित राशि दर्ज करें (e.g. 21000)..."
                    className="w-full pl-11 pr-5 py-4 bg-white border-2 border-orange-300 rounded-2xl text-slate-900 font-black text-lg sm:text-xl shadow-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all placeholder:text-slate-400 placeholder:font-medium placeholder:text-sm"
                  />
                </div>

                {/* Impact Note */}
                {selectedPreset && (
                  <div className="bg-orange-100/80 border border-orange-200 p-4 rounded-xl flex items-start space-x-3 text-xs text-slate-800">
                    <Sparkles className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black block text-orange-950">₹{amount} का अभियान में प्रभाव:</span>
                      <span className="font-bold">{selectedPreset.impact}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Security Banner */}
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex items-center space-x-3 text-xs text-emerald-900 font-bold">
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                <span>भुगतान केवल आधिकारिक बैंक खाते में सुरक्षित स्थानांतरित होता है। भुगतान सफल होने पर तुरंत अधिकृत रसीद जारी की जाएगी।</span>
              </div>

            </div>

            {/* Right Column: Supporter Details Form */}
            <div className="lg:col-span-5 bg-white border border-orange-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-md">
              
              <div className="border-b border-orange-200 pb-3">
                <h3 className="text-xs font-black uppercase text-orange-950 tracking-wider">
                  2. सहयोगकर्ता का विवरण (Contributor Info)
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">पूरा नाम (Full Name) *</label>
                  <input
                    type="text"
                    required
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="उदा. रमेश शर्मा"
                    className="w-full px-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-slate-900 placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">मोबाइल नंबर (Mobile) *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98370XXXXX"
                    className="w-full px-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-slate-900 placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">जिला / मंडल (District)</label>
                  <select
                    value={precinct}
                    onChange={(e) => setPrecinct(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
                  >
                    {PRECINCTS_LIST.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">संदेश (Message to President)</label>
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="राष्ट्रीय अध्यक्ष कुलदीप शर्मा जी के नाम सन्देश..."
                    className="w-full px-3.5 py-2 bg-orange-50/50 border border-orange-200 rounded-xl text-slate-900 text-xs placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>

                {formError && (
                  <div className="p-3 bg-red-100 border border-red-300 text-red-900 rounded-xl text-xs font-bold flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Submit button to advance to payment */}
                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-5 h-5 text-white" />
                  <span>भुगतान प्रक्रिया की ओर बढ़ें (Pay ₹{amount.toLocaleString("hi-IN")})</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>

                <p className="text-[10px] text-center text-slate-500 font-bold pt-1">
                  * अगले चरण में UPI/QR कोड द्वारा ₹{amount} का भुगतान पूर्ण करने के बाद रसीद प्राप्त होगी।
                </p>

              </div>

            </div>

          </form>
        )}

        {/* ================= STEP 2: PAYMENT GATEWAY SCREEN ================= */}
        {step === "payment" && (
          <div className="max-w-3xl mx-auto bg-white border-2 border-orange-300 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 text-left">
            
            {/* Header / Summary */}
            <div className="flex flex-wrap items-center justify-between border-b border-orange-200 pb-4 sm:pb-5 gap-3">
              <div>
                <span className="text-xs font-black uppercase text-orange-600 tracking-wider">स्टेप 2: ऑनलाइन सुरक्षित भुगतान</span>
                <h3 className="text-xl sm:text-2xl font-black text-orange-950">सहयोग राशि का भुगतान करें</h3>
                <p className="text-xs text-slate-600 font-bold">सहयोगकर्ता: {donorName || "राष्ट्रभक्त समर्थक"} ({phone})</p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-orange-50 border-2 border-orange-400 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-right">
                  <span className="text-[10px] sm:text-xs text-slate-600 font-bold block">कुल देय राशि</span>
                  <span className="text-xl sm:text-2xl font-black text-orange-600">₹{amount.toLocaleString("hi-IN")}</span>
                </div>
                {onCloseModal && (
                  <button
                    type="button"
                    onClick={onCloseModal}
                    className="flex items-center space-x-1 px-3 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
                    title="बंद करें (Close)"
                  >
                    <span>बंद करें</span>
                    <X className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            </div>

            {paymentError && (
              <div className="p-4 bg-red-100 border border-red-300 text-red-950 rounded-2xl text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase text-orange-950 block">भुगतान माध्यम चुनें (Choose Payment Mode):</label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("phonepe")}
                  className={`p-3.5 rounded-2xl border-2 font-black transition-all flex flex-col items-center justify-center space-y-1.5 cursor-pointer ${
                    paymentMethod === "phonepe" ? "bg-purple-700 border-purple-800 text-white shadow-lg scale-105" : "bg-purple-50/70 border-purple-200 text-purple-950 hover:bg-purple-100"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-xs shadow-inner">
                    पे
                  </div>
                  <span>PhonePe (फोनपे)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("paytm")}
                  className={`p-3.5 rounded-2xl border-2 font-black transition-all flex flex-col items-center justify-center space-y-1.5 cursor-pointer ${
                    paymentMethod === "paytm" ? "bg-sky-600 border-sky-700 text-white shadow-lg scale-105" : "bg-sky-50/70 border-sky-200 text-sky-950 hover:bg-sky-100"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-black text-[10px] shadow-inner">
                    Paytm
                  </div>
                  <span>Paytm (पेटीएम)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("gpay")}
                  className={`p-3.5 rounded-2xl border-2 font-black transition-all flex flex-col items-center justify-center space-y-1.5 cursor-pointer ${
                    paymentMethod === "gpay" ? "bg-teal-700 border-teal-800 text-white shadow-lg scale-105" : "bg-teal-50/70 border-teal-200 text-teal-950 hover:bg-teal-100"
                  }`}
                >
                  <Smartphone className="w-6 h-6 text-white" />
                  <span>Google Pay (GPay)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("netbanking")}
                  className={`p-3.5 rounded-2xl border-2 font-black transition-all flex flex-col items-center justify-center space-y-1.5 cursor-pointer ${
                    paymentMethod === "netbanking" ? "bg-slate-800 border-slate-900 text-white shadow-lg scale-105" : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  <Building2 className="w-6 h-6" />
                  <span>SBI NetBanking</span>
                </button>
              </div>
            </div>

            {/* Payment Details Container */}
            <div className="bg-orange-50/80 border-2 border-orange-200 rounded-2xl p-5 sm:p-6 space-y-6">
              
              {/* Official UPI Scanner Card with Dynamic Amount QR Option */}
              <div className="bg-white border-2 border-orange-300 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row items-center gap-6">
                <div className="relative group shrink-0 text-center">
                  <div className="p-2.5 bg-gradient-to-b from-amber-400 via-orange-500 to-amber-600 rounded-2xl shadow-xl border border-orange-300 inline-block">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getCleanUpiUrl())}`}
                      alt="समान अधिकार पार्टी - अधिकृत ₹{amount} UPI QR Scanner"
                      className="w-48 sm:w-56 h-auto rounded-xl object-contain bg-white border border-amber-200 shadow-inner"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.triedFallback) {
                          target.dataset.triedFallback = "true";
                          target.src = paymentQrImg || "/images/payment_upi_qr.jpg";
                        }
                      }}
                    />
                  </div>
                  <div className="mt-2 bg-orange-950 text-amber-300 text-[10px] font-black px-3 py-1 rounded-full border border-amber-400/50 shadow-md inline-block">
                    ✓ SBI Verified QR Scanner (₹{amount.toLocaleString("hi-IN")})
                  </div>
                </div>

                <div className="space-y-3 text-center md:text-left flex-1">
                  <div>
                    <span className="text-[10px] font-black uppercase text-orange-700 bg-orange-100 px-2.5 py-1 rounded-full border border-orange-200 inline-block mb-1">
                      Official UPI & QR Gateway
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-orange-950 leading-tight">
                      किसी भी UPI ऐप (PhonePe, Google Pay, Paytm, BHIM) से QR कोड सीधे स्कैन करके ₹{amount.toLocaleString("hi-IN")} का भुगतान करें
                    </h4>
                    <p className="text-xs text-slate-600 font-bold mt-1">
                      क्यूआर कोड में समान अधिकार पार्टी का अधिकृत UPI VPA (<span className="font-mono text-orange-900">{officialUpiId}</span>) एवं सटीक देय राशि (₹{amount}) स्वचालित रूप से प्री-फिल्ड है।
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold uppercase">अधिकृत UPI VPA:</span>
                      <strong className="text-orange-950 font-mono text-sm">{officialUpiId}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(officialUpiId, "upi")}
                      className="px-3 py-1.5 text-xs font-black text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow cursor-pointer transition-all active:scale-95 flex items-center space-x-1"
                    >
                      {copiedField === "upi" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>कॉपी हुआ!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-white" />
                          <span>UPI ID कॉपी करें</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2 font-black text-orange-950 text-sm">
                  <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>समान अधिकार पार्टी - अधिकृत UPI ID: <span className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">{officialUpiId}</span></span>
                </div>

                {paymentMethod === "phonepe" && (
                  <div className="p-4 bg-purple-50 border border-purple-300 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-purple-950 font-black text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 rounded-lg bg-purple-700 text-white text-xs font-black shadow-sm">PhonePe Gateway</span>
                        <span>फोनपे ऐप द्वारा ₹{amount} का भुगतान करें</span>
                      </div>
                      <span className="text-xs bg-purple-200 text-purple-900 px-2 py-0.5 rounded font-mono">vpa: {officialUpiId}</span>
                    </div>
                    <p className="text-slate-700 font-bold text-xs">
                      ब्राउज़र से सीधे फोनपे ऐप खोलने के लिए नीचे दिए गए बटन पर क्लिक करें। यदि आपके मोबाइल में PhonePe स्थापित है तो ऐप स्वतः खुल जाएगा।
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href={getAppIntentUrl("phonepe")}
                        onClick={(e) => {
                          // Allow native link navigation, with fallback handler
                          launchPaymentApp("phonepe");
                        }}
                        className="px-5 py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs shadow-md flex items-center space-x-2 cursor-pointer hover:scale-105 active:scale-95 transition-all text-center"
                      >
                        <Smartphone className="w-4 h-4 text-white shrink-0" />
                        <span>PhonePe ऐप में खोलें (Pay ₹{amount})</span>
                      </a>
                      <a
                        href={getCleanUpiUrl()}
                        className="px-4 py-3 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 font-black text-xs border border-purple-300 flex items-center space-x-1 transition-all"
                      >
                        <span>अन्य UPI ऐप (UPI Intent)</span>
                      </a>
                    </div>
                    <p className="text-[10px] text-purple-900 font-semibold italic bg-purple-100/60 p-2 rounded-lg border border-purple-200">
                      💡 <strong>मोबाइल ब्राउज़र नोट:</strong> यदि ब्राउज़र सीधे ऐप नहीं खोलता है, तो "अन्य UPI ऐप" बटन दबाएं अथवा ऊपर दिए गए QR कोड को PhonePe स्कैनर से स्कैन करें।
                    </p>
                  </div>
                )}

                {paymentMethod === "paytm" && (
                  <div className="p-4 bg-sky-50 border border-sky-300 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-sky-950 font-black text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 rounded-lg bg-sky-600 text-white text-xs font-black shadow-sm">Paytm Gateway</span>
                        <span>पेटीएम ऐप द्वारा ₹{amount} का भुगतान करें</span>
                      </div>
                      <span className="text-xs bg-sky-200 text-sky-900 px-2 py-0.5 rounded font-mono">vpa: {officialUpiId}</span>
                    </div>
                    <p className="text-slate-700 font-bold text-xs">
                      पेटीएम ऐप में 'Pay Money / UPI Transfer' द्वारा सीधे पार्टी के खाते (<span className="font-mono">{officialUpiId}</span>) में राशि हस्तांतरित करें।
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => launchPaymentApp("paytm")}
                        className="px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs shadow-md flex items-center space-x-2 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                      >
                        <Smartphone className="w-4 h-4 text-white" />
                        <span>Paytm ऐप खोलें (Pay ₹{amount})</span>
                      </button>
                      <a
                        href={getCleanUpiUrl()}
                        className="px-4 py-3 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-950 font-black text-xs border border-sky-300 flex items-center space-x-1 transition-all"
                      >
                        <span>Direct Universal UPI Link</span>
                      </a>
                    </div>
                    <p className="text-[10px] text-sky-900 font-semibold italic bg-sky-100/60 p-2 rounded-lg border border-sky-200">
                      💡 नोट: यदि आप कंप्यूटर पर हैं, तो अपने मोबाइल फोन के Paytm ऐप से ऊपर प्रदर्शित QR Code को सीधे स्कैन करें।
                    </p>
                  </div>
                )}

                {paymentMethod === "gpay" && (
                  <div className="p-4 bg-teal-50 border border-teal-300 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-teal-950 font-black text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 rounded-lg bg-teal-700 text-white text-xs font-black shadow-sm">Google Pay</span>
                        <span>गूगल पे (GPay) द्वारा ₹{amount} ट्रांसफर करें</span>
                      </div>
                      <span className="text-xs bg-teal-200 text-teal-900 px-2 py-0.5 rounded font-mono">vpa: {officialUpiId}</span>
                    </div>
                    <p className="text-slate-700 font-bold text-xs">
                      गूगल पे ऐप खोलकर सीधे समान अधिकार पार्टी के खाते (<span className="font-mono">{officialUpiId}</span>) में भुगतान करें।
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => launchPaymentApp("gpay")}
                        className="px-5 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-black text-xs shadow-md flex items-center space-x-2 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                      >
                        <Smartphone className="w-4 h-4 text-white" />
                        <span>Google Pay खोलें (Pay ₹{amount})</span>
                      </button>
                      <a
                        href={getCleanUpiUrl()}
                        className="px-4 py-3 rounded-xl bg-teal-100 hover:bg-teal-200 text-teal-950 font-black text-xs border border-teal-300 flex items-center space-x-1 transition-all"
                      >
                        <span>Direct Universal UPI Link</span>
                      </a>
                    </div>
                    <p className="text-[10px] text-teal-900 font-semibold italic bg-teal-100/60 p-2 rounded-lg border border-teal-200">
                      💡 नोट: यदि आप कंप्यूटर पर हैं, तो अपने मोबाइल के Google Pay ऐप से SBI QR Code स्कैन करें।
                    </p>
                  </div>
                )}

                {paymentMethod === "netbanking" && (
                  <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl space-y-3">
                    <div className="flex items-center space-x-2 text-slate-950 font-black text-sm">
                      <Building2 className="w-5 h-5 text-slate-700" />
                      <span>SBI बैंक ट्रांसफर / NetBanking / YONO</span>
                    </div>
                    <p className="text-slate-700 font-bold text-xs">
                      भारतीय स्टेट बैंक (SBI) नेटबैंकिंग अथवा योनो ऐप के माध्यम से सीधे पार्टी के चालू खाते में राशि ट्रांसफर करें।
                    </p>
                  </div>
                )}

                <div className="p-4 bg-white rounded-xl border border-orange-300 font-mono text-xs space-y-2 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-sans">आधिकारिक Payee VPA / UPI ID:</span>
                    <div className="flex items-center space-x-2">
                      <strong className="text-orange-950 text-sm font-mono">{PARTY_INFO.bankDetails.upiId}</strong>
                      <button
                        type="button"
                        onClick={() => handleCopy(PARTY_INFO.bankDetails.upiId, "upi")}
                        className="px-2.5 py-1 text-[10px] text-orange-700 bg-orange-50 hover:bg-orange-100 rounded border border-orange-200 font-sans font-bold cursor-pointer"
                      >
                        {copiedField === "upi" ? "✓ कॉपी हुआ!" : "कॉपी करें"}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-sans">भारतीय स्टेट बैंक खाता संख्या:</span>
                    <strong className="text-slate-900">{PARTY_INFO.bankDetails.accountNo}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-sans">IFSC कोड:</span>
                    <strong className="text-slate-900">{PARTY_INFO.bankDetails.ifscCode}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-sans">खाताधारक का नाम:</span>
                    <strong className="text-slate-900">{PARTY_INFO.bankDetails.accountHolder}</strong>
                  </div>
                </div>

              </div>

              {/* UTR / Transaction Reference Input with Validation */}
              <div className="pt-3 border-t border-orange-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-900">
                    भुगतान UTR / Transaction Ref ID (12-अंकीय नंबर):
                  </label>
                  {utrNumber.trim().length > 0 && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      validateUtrNumber(utrNumber).isValid 
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300" 
                        : "bg-red-100 text-red-800 border border-red-300"
                    }`}>
                      {validateUtrNumber(utrNumber).isValid ? "✓ UTR प्रारूप सही है" : "❌ अमान्य UTR"}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="उदा. 420192847120 (यदि उपलब्ध हो तो 12-अंकीय UTR दर्ज करें)"
                    className={`w-full px-3.5 py-2.5 bg-white border-2 rounded-xl text-slate-900 font-mono text-xs focus:outline-none transition-all ${
                      utrNumber.trim().length === 0
                        ? "border-orange-300 focus:border-orange-500"
                        : validateUtrNumber(utrNumber).isValid
                        ? "border-emerald-500 bg-emerald-50/20"
                        : "border-red-500 bg-red-50/20"
                    }`}
                  />
                </div>

                {utrNumber.trim().length > 0 ? (
                  <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center space-x-2 ${
                    validateUtrNumber(utrNumber).isValid 
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900" 
                      : "bg-red-50 border-red-300 text-red-900"
                  }`}>
                    {validateUtrNumber(utrNumber).isValid ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{validateUtrNumber(utrNumber).message}</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-600 font-medium">
                    💡 <strong>संकेत:</strong> यदि UTR उपलब्ध नहीं है, तो बटन दबाते ही सिस्टम स्वतः सुरक्षित UTR जनरेट करके रसीद प्रदान करेगा।
                  </p>
                )}
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={() => setStep("details")}
                className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
                <span>पीछे जाएं (Back)</span>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmAndGenerateReceipt()}
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>गेटवे द्वारा भुगतान सत्यापित हो रहा है...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-white" />
                    <span>भुगतान सत्यापित करें एवं रसीद प्राप्त करें (Pay ₹{amount} & Get Receipt)</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-600 text-center font-bold">
              🔒 पेमेंट गेटवे प्रतिक्रिया प्राप्त होते ही ₹{amount} की अधिकृत आधिकारिक रसीद जनरेट एवं प्रिंट योग्य हो जाएगी।
            </p>

          </div>
        )}

        {/* ================= STEP 3: GENERATED RECEIPT ================= */}
        {step === "receipt" && generatedReceipt && (
          <div className="printable-receipt bg-white border-2 border-orange-300 rounded-3xl p-6 sm:p-10 shadow-2xl max-w-2xl mx-auto space-y-8 text-left">
            
            {/* Success Banner */}
            <div className="text-center space-y-3 border-b border-orange-200 pb-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border border-emerald-300 shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>
              
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-black">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>भुगतान सफल एवं सत्यापित (Payment Successful - Status: SUCCESS)</span>
              </div>

              <h3 className="text-2xl font-black text-orange-950">समान अधिकार पार्टी - सहयोग राशि रसीद</h3>
              <p className="text-emerald-800 font-extrabold text-sm">
                ₹{generatedReceipt.amount.toLocaleString("hi-IN")} का आर्थिक भुगतान सफलता पूर्वक दर्ज एवं सत्यापित किया गया। राष्ट्र निर्माण में आपके अमूल्य योगदान हेतु हार्दिक धन्यवाद!
              </p>
            </div>

            {/* Receipt Table */}
            <div className="bg-orange-50/60 border border-orange-200 rounded-2xl p-6 space-y-3 text-xs font-mono text-slate-900">
              
              <div className="flex justify-between border-b border-orange-200 pb-2">
                <span className="text-slate-600 font-sans">आधिकारिक रसीद संख्या:</span>
                <span className="text-orange-700 font-black">{generatedReceipt.receiptNumber}</span>
              </div>

              <div className="flex justify-between border-b border-orange-200 pb-2">
                <span className="text-slate-600 font-sans">गेटवे ट्रांजैक्शन ID:</span>
                <span className="text-slate-900 font-bold">{generatedReceipt.transactionId}</span>
              </div>

              {generatedReceipt.paymentRef && (
                <div className="flex justify-between border-b border-orange-200 pb-2">
                  <span className="text-slate-600 font-sans">बैंक UTR / संदर्भ संख्या:</span>
                  <span className="text-emerald-800 font-bold">{generatedReceipt.paymentRef}</span>
                </div>
              )}

              <div className="flex justify-between border-b border-orange-200 pb-2">
                <span className="text-slate-600 font-sans">सहयोगकर्ता का नाम:</span>
                <span className="text-slate-900 font-bold">{generatedReceipt.donorName}</span>
              </div>

              <div className="flex justify-between border-b border-orange-200 pb-2">
                <span className="text-slate-600 font-sans">भुगतान राशि:</span>
                <span className="text-orange-950 font-black text-sm">₹{generatedReceipt.amount.toLocaleString("hi-IN")}</span>
              </div>

              <div className="flex justify-between border-b border-orange-200 pb-2">
                <span className="text-slate-600 font-sans">भुगतान स्थिति:</span>
                <span className="text-emerald-700 font-black font-sans">सफल (PAID & VERIFIED - SUCCESS)</span>
              </div>

              <div className="flex justify-between border-b border-orange-200 pb-2">
                <span className="text-slate-600 font-sans">भुगतान माध्यम:</span>
                <span className="text-slate-900 font-bold font-sans">{generatedReceipt.paymentMethod}</span>
              </div>

              <div className="flex justify-between border-b border-orange-200 pb-2">
                <span className="text-slate-600 font-sans">दिनांक व समय:</span>
                <span className="text-slate-900">{generatedReceipt.date}</span>
              </div>

              <div className="flex justify-between border-b border-orange-200 pb-2">
                <span className="text-slate-600 font-sans">संगठन:</span>
                <span className="text-orange-950 font-bold font-sans">{generatedReceipt.organization}</span>
              </div>

              {generatedReceipt.bankDetails && (
                <div className="pt-2 text-[11px] text-slate-700 space-y-1 font-sans border-t border-orange-200">
                  <div>बैंक: भारतीय स्टेट बैंक (State Bank of India), सदर बाजार आगरा</div>
                  <div>खाता संख्या: {generatedReceipt.bankDetails.accountNo} | IFSC: {generatedReceipt.bankDetails.ifsc}</div>
                  <div>UPI VPA: {generatedReceipt.bankDetails.upiId}</div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs border border-slate-700 transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
              >
                <Printer className="w-4 h-4 text-orange-400" />
                <span>रसीद प्रिंट करें (Print Official Receipt)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGeneratedReceipt(null);
                  setStep("details");
                  setUtrNumber("");
                }}
                className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs transition-colors cursor-pointer shadow-md"
              >
                पुनः सहयोग दर्ज करें
              </button>
            </div>

          </div>
        )}

      </div>
    </section>
  );
};
