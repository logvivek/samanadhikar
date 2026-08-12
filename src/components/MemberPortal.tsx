import React, { useState, useEffect } from "react";
import paymentQrImg from "../assets/images/payment_upi_qr.jpg";
import { PRECINCTS_LIST, VOLUNTEER_INTERESTS, PARTY_INFO } from "../data/campaignData";
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
  AlertCircle
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

interface MemberPortalProps {
  onCloseModal?: () => void;
}

export const MemberPortal: React.FC<MemberPortalProps> = ({ onCloseModal }) => {
  const [activeTab, setActiveTab] = useState<"register" | "roster">("register");
  
  // Registration Form state
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [precinct, setPrecinct] = useState<string>(PRECINCTS_LIST[0]);
  const [membershipTier, setMembershipTier] = useState<string>("साधारण सदस्य");
  const [membershipFee, setMembershipFee] = useState<number>(10);
  const [isCustomFee, setIsCustomFee] = useState<boolean>(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["पदयात्रा व जनसंपर्क अभियान"]);
  
  // Payment Step state
  const [step, setStep] = useState<"details" | "payment">("details");
  const [paymentApp, setPaymentApp] = useState<"phonepe" | "paytm" | "gpay" | "upi" | "netbanking">("phonepe");
  const [utrNumber, setUtrNumber] = useState<string>("");
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>("");
  const [paymentError, setPaymentError] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeMemberCard, setActiveMemberCard] = useState<MemberRecord | null>(null);

  // Clean NPCI UPI URL Builder for Member Registration
  const getCleanUpiPaymentUrl = (noteOverride?: string) => {
    const payeeVpa = "samanadhikarparty@sbi";
    const payeeName = "Samanadhikar Party";
    const txnNote = noteOverride || "Member Registration";
    const amtStr = membershipFee && Number(membershipFee) > 0 ? Number(membershipFee).toFixed(2) : "100.00";

    return `upi://pay?` +
      `pa=${encodeURIComponent(payeeVpa)}` +
      `&pn=${encodeURIComponent(payeeName)}` +
      `&cu=INR` +
      `&tn=${encodeURIComponent(txnNote)}` +
      `${amtStr ? `&am=${encodeURIComponent(amtStr)}` : ''}`;
  };

  const launchMemberPaymentApp = (app: "phonepe" | "paytm" | "gpay" | "upi") => {
    const payeeVpa = "samanadhikarparty@sbi";
    const payeeName = "Samanadhikar Party";
    const txnNote = "Member Registration";
    const amtStr = membershipFee && Number(membershipFee) > 0 ? Number(membershipFee).toFixed(2) : "100.00";

    const cleanParams = `pa=${encodeURIComponent(payeeVpa)}` +
      `&pn=${encodeURIComponent(payeeName)}` +
      `&cu=INR` +
      `&tn=${encodeURIComponent(txnNote)}` +
      `${amtStr ? `&am=${encodeURIComponent(amtStr)}` : ''}`;

    const universalUrl = `upi://pay?${cleanParams}`;

    if (app === "phonepe") {
      const phonepeUrl = `phonepe://pay?${cleanParams}`;
      try {
        window.location.href = phonepeUrl;
        setTimeout(() => { window.location.href = universalUrl; }, 700);
      } catch (e) {
        window.location.href = universalUrl;
      }
      return;
    }

    if (app === "paytm") {
      const paytmUrl = `paytmmp://pay?${cleanParams}`;
      try {
        window.location.href = paytmUrl;
        setTimeout(() => { window.location.href = universalUrl; }, 700);
      } catch (e) {
        window.location.href = universalUrl;
      }
      return;
    }

    if (app === "gpay") {
      const userAgent = typeof navigator !== "undefined" ? (navigator.userAgent || navigator.vendor || (window as any).opera || "") : "";
      const isAndroid = /android/i.test(userAgent);
      if (isAndroid) {
        const androidGPayIntent = `intent://pay?${cleanParams}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
        try {
          window.location.href = androidGPayIntent;
          setTimeout(() => { window.location.href = universalUrl; }, 700);
        } catch (e) {
          window.location.href = universalUrl;
        }
        return;
      }
      window.location.href = universalUrl;
      return;
    }

    window.location.href = universalUrl;
  };

  const getUpiPaymentUrl = (app: "phonepe" | "paytm" | "gpay" | "upi") => {
    return getCleanUpiPaymentUrl();
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
        setTotalCount(data.totalMembers);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTierChange = (tier: string) => {
    setMembershipTier(tier);
    if (!isCustomFee) {
      setMembershipFee(TIER_FEE_MAP[tier] ?? 10);
    }
    setActiveMemberCard(null);
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleFormNext = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!fullName || !fullName.trim()) {
      setFormError("कृपया अपना नाम दर्ज करें।");
      return;
    }

    if (!phone || phone.trim().length < 10) {
      setFormError("कृपया अपना 10 अंकों का मोबाइल नंबर दर्ज करें।");
      return;
    }

    setFormError("");
    setPaymentError("");

    if (membershipFee > 0) {
      setStep("payment");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      submitMemberRegistration(0, "निःशुल्क पंजीकरण", "");
    }
  };

  const submitMemberRegistration = async (fee: number, pMethod: string, utr: string) => {
    setPaymentError("");

    if (fee > 0 && utr && utr.trim().length > 0) {
      const v = validateUtrNumber(utr);
      if (!v.isValid) {
        setPaymentError(v.message);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const methodLabel = pMethod || (
        paymentApp === "phonepe" ? "PhonePe UPI" :
        paymentApp === "paytm" ? "Paytm UPI" :
        paymentApp === "gpay" ? "Google Pay" :
        paymentApp === "upi" ? "BHIM UPI" : "SBI NetBanking"
      );

      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          precinct,
          membershipTier,
          interests: selectedInterests,
          membershipFee: fee,
          paymentMethod: methodLabel,
          utrNumber: utr,
          isFeePaid: fee === 0 ? true : true
        })
      });

      const data = await res.json();

      if (data.success) {
        setActiveMemberCard(data.member);
        setStep("details");
        window.scrollTo({ top: 0, behavior: "smooth" });
        fetchMembers();
      } else {
        setPaymentError(data.error || "सदस्यता पंजीकरण में त्रुटि।");
      }
    } catch (err) {
      console.error(err);
      setPaymentError("अनुरोध में त्रुटि आई।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(PARTY_INFO.bankDetails.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <section className="py-12 bg-orange-50/40 text-slate-900 min-h-screen">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 space-y-10 text-left">
        
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-orange-100 border border-orange-300 text-orange-950 text-xs font-black uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-600" />
            <span>समान अधिकार पार्टी - सदस्यता एवं डिजिटल पहचान पत्र</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-orange-950 tracking-tight">
            पार्टी से जुड़ें एवं डिजिटल पहचान पत्र प्राप्त करें
          </h2>
          <p className="text-slate-800 text-sm sm:text-base font-bold">
            समान अधिकार पार्टी के सदस्य बनें और राष्ट्र निर्माण अभियान में अपनी भागीदारी सुनिश्चित करें।
          </p>

          {/* Description */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Form Column */}
            <div className="lg:col-span-7 bg-white border border-orange-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
              <div className="border-b border-orange-200 pb-3 flex items-center justify-between">
                <h3 className="text-lg font-black text-orange-950 flex items-center space-x-2">
                  <UserPlus className="w-5 h-5 text-orange-600" />
                  <span>
                    {step === "details" ? "समान अधिकार पार्टी सदस्यता फॉर्म" : "सदस्यता शुल्क ऑनलाइन भुगतान (Payment)"}
                  </span>
                </h3>

                {step === "payment" && (
                  <button
                    type="button"
                    onClick={() => setStep("details")}
                    className="text-xs text-orange-700 hover:text-orange-900 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>विवरण बदलें</span>
                  </button>
                )}
              </div>

              {step === "details" ? (
                <form onSubmit={handleFormNext} className="space-y-4 text-xs">
                  
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">पूरा नाम (Full Name) *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setActiveMemberCard(null);
                      }}
                      placeholder="उदा. कुलदीप सिंह"
                      className="w-full px-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-slate-900 placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">मोबाइल नंबर *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setActiveMemberCard(null);
                      }}
                      placeholder="98370XXXXX"
                      className="w-full px-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-slate-900 placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">जिला / मंडल (District)</label>
                      <select
                        value={precinct}
                        onChange={(e) => {
                          setPrecinct(e.target.value);
                          setActiveMemberCard(null);
                        }}
                        className="w-full px-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
                      >
                        {PRECINCTS_LIST.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">सदस्यता स्तर (Membership Level)</label>
                      <select
                        value={membershipTier}
                        onChange={(e) => handleTierChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-orange-50/50 border border-orange-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500 focus:bg-white"
                      >
                        <option value="साधारण सदस्य">साधारण सदस्य (₹10 / वर्ष)</option>
                        <option value="सक्रिय सदस्य">सक्रिय सदस्य (₹275 / वर्ष)</option>
                        <option value="सक्रिय सहयोग सदस्यता">सक्रिय सहयोग सदस्यता (₹500 / वर्ष)</option>
                      </select>
                    </div>
                  </div>

                  {/* Membership Fee Selection */}
                  <div className="p-3 bg-orange-100/60 border border-orange-300 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-black text-orange-950">
                      <span>सदस्यता वार्षिक शुल्क (Membership Fee):</span>
                      <span className="text-sm font-black text-orange-700">₹{membershipFee}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {[10, 275, 500].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setMembershipFee(amt);
                            setIsCustomFee(false);
                            if (FEE_TIER_MAP[amt]) {
                              setMembershipTier(FEE_TIER_MAP[amt]);
                            }
                            setActiveMemberCard(null);
                          }}
                          className={`py-2 px-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                            membershipFee === amt && !isCustomFee
                              ? "bg-orange-500 border-orange-600 text-white shadow-sm"
                              : "bg-white border-orange-200 text-slate-800 hover:bg-orange-50"
                          }`}
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formError && (
                    <div className="p-3 bg-red-100 border border-red-300 text-red-900 rounded-xl text-xs font-bold flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <span>{membershipFee > 0 ? `भुगतान हेतु आगे बढ़ें (Pay ₹${membershipFee})` : "सदस्यता दर्ज करें व डिजिटल ID कार्ड पाएं"}</span>
                  </button>

                </form>
              ) : (
                /* Payment Gateway Step for Membership Fee */
                <div className="space-y-5 text-xs">
                  
                  {paymentError && (
                    <div className="p-3 bg-red-100 border border-red-300 text-red-900 rounded-xl text-xs font-bold flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{paymentError}</span>
                    </div>
                  )}
                  
                  <div className="p-4 bg-orange-100/80 border border-orange-300 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-700">चयनित सदस्यता स्तर:</div>
                      <div className="text-sm font-black text-orange-950">{membershipTier} ({fullName})</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">कुल देय शुल्क</div>
                      <div className="text-xl font-black text-emerald-700">₹{membershipFee}</div>
                    </div>
                  </div>

                  {/* Payment App Chooser */}
                  {/* Payment App Selector */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-800 block">भुगतान माध्यम चुनें (Select Payment Mode):</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentApp("phonepe")}
                        className={`p-3 rounded-xl border-2 font-black flex flex-col items-center justify-center space-y-1 cursor-pointer transition-all ${
                          paymentApp === "phonepe" ? "bg-purple-700 border-purple-800 text-white shadow-md" : "bg-purple-50 border-purple-200 text-purple-950"
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase">PhonePe</span>
                        <span>फोनपे</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentApp("paytm")}
                        className={`p-3 rounded-xl border-2 font-black flex flex-col items-center justify-center space-y-1 cursor-pointer transition-all ${
                          paymentApp === "paytm" ? "bg-sky-600 border-sky-700 text-white shadow-md" : "bg-sky-50 border-sky-200 text-sky-950"
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase">Paytm</span>
                        <span>पेटीएम</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentApp("gpay")}
                        className={`p-3 rounded-xl border-2 font-black flex flex-col items-center justify-center space-y-1 cursor-pointer transition-all ${
                          paymentApp === "gpay" ? "bg-teal-700 border-teal-800 text-white shadow-md" : "bg-teal-50 border-teal-200 text-teal-950"
                        }`}
                      >
                        <Smartphone className="w-4 h-4 text-white" />
                        <span>Google Pay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentApp("netbanking")}
                        className={`p-3 rounded-xl border-2 font-black flex flex-col items-center justify-center space-y-1 cursor-pointer transition-all ${
                          paymentApp === "netbanking" ? "bg-slate-800 border-slate-900 text-white shadow-md" : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                        <span>NetBanking</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment Details Container */}
                  <div className="p-4 bg-orange-50/80 border border-orange-200 rounded-2xl space-y-4">
                    
                    {paymentApp === "phonepe" && (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                        <div className="font-black text-purple-950 text-xs">PhonePe Gateway (Direct VPA Transfer):</div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              launchMemberPaymentApp("phonepe");
                            }}
                            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs shadow cursor-pointer hover:scale-105 transition-all"
                          >
                            <Smartphone className="w-4 h-4 text-white" />
                            <span>PhonePe ऐप खोलें (Pay ₹{membershipFee})</span>
                          </button>
                          <a
                            href={getCleanUpiPaymentUrl()}
                            className="px-3 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 font-black text-xs border border-purple-300"
                          >
                            Direct Link (PhonePe / UPI)
                          </a>
                        </div>
                        <p className="text-[10px] text-purple-900 font-medium italic">
                          💡 Note: If on desktop, scan the SBI QR Code below directly with your phone's PhonePe app.
                        </p>
                      </div>
                    )}

                    {paymentApp === "paytm" && (
                      <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-2">
                        <div className="font-black text-sky-950 text-xs">Paytm Wallet & UPI Gateway:</div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              launchMemberPaymentApp("paytm");
                            }}
                            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs shadow cursor-pointer hover:scale-105 transition-all"
                          >
                            <Smartphone className="w-4 h-4 text-white" />
                            <span>Paytm ऐप खोलें (Pay ₹{membershipFee})</span>
                          </button>
                          <a
                            href={getCleanUpiPaymentUrl()}
                            className="px-3 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-950 font-black text-xs border border-sky-300"
                          >
                            Direct Link (Paytm / UPI)
                          </a>
                        </div>
                        <p className="text-[10px] text-sky-900 font-medium italic">
                          💡 Note: On desktop browsers, scan the SBI QR Code below using Paytm.
                        </p>
                      </div>
                    )}

                    {paymentApp === "gpay" && (
                      <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
                        <div className="font-black text-teal-950 text-xs">Google Pay Gateway:</div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              launchMemberPaymentApp("gpay");
                            }}
                            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-black text-xs shadow cursor-pointer hover:scale-105 transition-all"
                          >
                            <Smartphone className="w-4 h-4 text-white" />
                            <span>Google Pay खोलें (Pay ₹{membershipFee})</span>
                          </button>
                          <a
                            href={getCleanUpiPaymentUrl()}
                            className="px-3 py-2 rounded-xl bg-teal-100 hover:bg-teal-200 text-teal-950 font-black text-xs border border-teal-300"
                          >
                            Direct Link (GPay / UPI)
                          </a>
                        </div>
                        <p className="text-[10px] text-teal-900 font-medium italic">
                          💡 Note: On desktop, scan the SBI QR Code below using Google Pay.
                        </p>
                      </div>
                    )}

                    {/* Official UPI Scanner Card */}
                    <div className="bg-white border-2 border-orange-300 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative group shrink-0 text-center">
                        <div className="p-1.5 bg-gradient-to-b from-amber-400 via-orange-500 to-amber-600 rounded-2xl shadow-lg border border-orange-300 inline-block">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getCleanUpiPaymentUrl())}`}
                            alt="समान अधिकार पार्टी - अधिकृत UPI QR Scanner"
                            className="w-40 sm:w-48 h-auto rounded-xl object-contain bg-white border border-amber-200 shadow-inner"
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
                        <div className="mt-1.5 bg-orange-950 text-amber-300 text-[9px] font-black px-2.5 py-0.5 rounded-full border border-amber-400/50 shadow-sm inline-block">
                          ✓ Verified SBI QR Scanner (₹{membershipFee})
                        </div>
                      </div>

                      <div className="space-y-2 text-center sm:text-left flex-1">
                        <div>
                          <span className="text-[10px] font-black uppercase text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200 inline-block mb-1">
                            Official Payment Scanner
                          </span>
                          <h4 className="text-sm font-black text-orange-950 leading-tight">
                            स्कैनर द्वारा सदस्यता शुल्क ({membershipFee > 0 ? `₹${membershipFee}` : "निःशुल्क"}) सीधे जमा करें
                          </h4>
                          <p className="text-[11px] text-slate-600 font-bold mt-0.5">
                            PhonePe, Google Pay, Paytm, BHIM अथवा YONO से QR कोड सीधे स्कैन करके अधिकृत SBI खाते में सदस्यता शुल्क जमा करें।
                          </p>
                        </div>

                        <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="text-[9px] text-slate-500 block font-bold uppercase">UPI VPA:</span>
                            <strong className="text-orange-950 font-mono text-xs">samanadhikarparty@sbi</strong>
                          </div>
                          <button
                            type="button"
                            onClick={copyUpiId}
                            className="px-2.5 py-1 text-[11px] font-black text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow cursor-pointer transition-all active:scale-95"
                          >
                            {copiedUpi ? "✓ कॉपी हुआ!" : "UPI ID कॉपी करें"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-black text-slate-900">
                          भुगतान UTR / Reference ID (12 अंक):
                        </label>
                        {utrNumber.trim().length > 0 && (
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            validateUtrNumber(utrNumber).isValid 
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300" 
                              : "bg-red-100 text-red-800 border border-red-300"
                          }`}>
                            {validateUtrNumber(utrNumber).isValid ? "✓ UTR सही है" : "❌ अमान्य UTR"}
                          </span>
                        )}
                      </div>

                      <input
                        type="text"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        placeholder="उदा. 420192847120 (यदि उपलब्ध हो तो UTR दर्ज करें)"
                        className={`w-full px-3.5 py-2.5 bg-white border-2 rounded-xl text-slate-900 font-mono text-xs focus:outline-none transition-all ${
                          utrNumber.trim().length === 0
                            ? "border-orange-300 focus:border-orange-500"
                            : validateUtrNumber(utrNumber).isValid
                            ? "border-emerald-500 bg-emerald-50/20"
                            : "border-red-500 bg-red-50/20"
                        }`}
                      />

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
                          💡 <strong>संकेत:</strong> यदि UTR दर्ज नहीं है, तो पुष्टि बटन दबाते ही डिजिटल ID कार्ड जनरेट हो जाएगा।
                        </p>
                      )}
                    </div>

                  </div>

                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("details")}
                      className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
                    >
                      पीछे जाएं
                    </button>

                    <button
                      type="button"
                      onClick={() => submitMemberRegistration(membershipFee, "", utrNumber)}
                      disabled={isSubmitting}
                      className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4 text-white" />
                      <span>{isSubmitting ? "सत्यापित किया जा रहा है..." : "भुगतान पुष्टि व डिजिटल ID कार्ड पाएं"}</span>
                    </button>
                  </div>

                </div>
              )}
            </div>

            {/* Right Badge Preview Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="printable-receipt bg-white border border-orange-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
                <div className="border-b border-orange-200 pb-3 flex items-center justify-between no-print">
                  <h3 className="text-xs font-black uppercase text-orange-950 tracking-wider">
                    डिजिटल पार्टी पहचान पत्र (Digital ID Card)
                  </h3>
                  <Award className="w-4 h-4 text-orange-600" />
                </div>

                {/* Card Display */}
                <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 border-2 border-orange-400 rounded-2xl p-6 text-left space-y-5 shadow-xl relative overflow-hidden text-white">
                  
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <Flame className="w-4 h-4 text-orange-950 fill-orange-950" />
                        <span className="text-xs font-black text-orange-950 tracking-wider bg-white/90 px-2 py-0.5 rounded shadow-sm">
                          {PARTY_INFO.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-orange-100 block uppercase tracking-widest mt-1">
                        आधिकारिक सदस्यता पहचान पत्र
                      </span>
                    </div>

                    <QrCode className="w-11 h-11 text-orange-950 bg-white p-1 rounded-lg shadow-sm shrink-0" />
                  </div>

                  <div className="space-y-1">
                    <div className="text-2xl font-black text-white tracking-tight">
                      {activeMemberCard ? activeMemberCard.fullName : fullName || "आपका नाम"}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-white text-orange-950 text-xs font-black">
                        {activeMemberCard ? activeMemberCard.membershipTier : membershipTier}
                      </span>
                      {activeMemberCard?.isFeePaid && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-100 text-[10px] font-black flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3 text-emerald-300" />
                          <span>शुल्क भुगता: ₹{activeMemberCard.membershipFee || membershipFee}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-white border-t border-white/30 pt-3">
                    <div>
                      <span className="text-orange-100 block text-[10px]">जिला / मंडल:</span>
                      <span className="text-white font-extrabold truncate block">
                        {activeMemberCard ? activeMemberCard.precinct : precinct}
                      </span>
                    </div>
                    <div>
                      <span className="text-orange-100 block text-[10px]">कार्ड ID:</span>
                      <span className="text-white font-black">
                        {activeMemberCard ? activeMemberCard.memberCardId : "SAP-2026-XXXX"}
                      </span>
                    </div>
                  </div>

                  {activeMemberCard?.utrNumber && (
                    <div className="text-[10px] font-mono text-orange-100 border-t border-white/20 pt-2">
                      UTR Ref: {activeMemberCard.utrNumber} ({activeMemberCard.paymentMethod})
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/30 flex items-center justify-between text-[10px] text-orange-100 font-sans font-bold">
                    <div>राष्ट्रीय अध्यक्ष हस्ताक्षर: कुलदीप शर्मा</div>
                    <div className="text-white font-black">समान अधिकार पार्टी</div>
                  </div>
                </div>

                {activeMemberCard && (
                  <button
                    onClick={() => window.print()}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
                  >
                    <Printer className="w-4 h-4 text-orange-400" />
                    <span>डिजिटल सदस्यता कार्ड प्रिंट करें</span>
                  </button>
                )}
              </div>
            </div>

          </div>

      </div>
    </section>
  );
};
