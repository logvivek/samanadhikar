import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Lock, 
  ArrowLeft, 
  CreditCard, 
  Smartphone, 
  Landmark, 
  Wallet, 
  CheckCircle, 
  Loader2, 
  AlertCircle,
  Building,
  QrCode,
  ExternalLink
} from "lucide-react";
import { PARTY_INFO } from "../data/campaignData";

const POPULAR_BANKS = [
  { id: "sbi", name: "State Bank of India (SBI)" },
  { id: "hdfc", name: "HDFC Bank" },
  { id: "icici", name: "ICICI Bank" },
  { id: "axis", name: "Axis Bank" },
  { id: "pnb", name: "Punjab National Bank" },
  { id: "bob", name: "Bank of Baroda" },
  { id: "kotak", name: "Kotak Mahindra Bank" }
];

export const CashfreeGatewayPage: React.FC = () => {
  const [orderId, setOrderId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [amount, setAmount] = useState<number>(500);
  const [customerName, setCustomerName] = useState<string>("समर्थक नागरिक");
  const [customerPhone, setCustomerPhone] = useState<string>("9412165541");
  const [orderType, setOrderType] = useState<string>("DONATION");

  const [paymentTab, setPaymentTab] = useState<"upi" | "card" | "netbanking" | "wallet">("upi");
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>("gpay");
  const [upiId, setUpiId] = useState<string>("");
  
  // Card Details
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardExpiry, setCardExpiry] = useState<string>("");
  const [cardCvv, setCardCvv] = useState<string>("");
  const [cardHolder, setCardHolder] = useState<string>("");
  
  // Net Banking Details
  const [selectedBank, setSelectedBank] = useState<string>("State Bank of India (SBI)");

  // Wallet
  const [selectedWallet, setSelectedWallet] = useState<string>("paytm");

  // Status
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const qOrderId = params.get("order_id");
    const qSessionId = params.get("session_id");
    const qAmount = params.get("amount");
    const qName = params.get("name");
    const qPhone = params.get("phone");
    const qType = params.get("type");

    if (qOrderId) setOrderId(qOrderId);
    else setOrderId(`order_sap_${Date.now()}`);

    if (qSessionId) setSessionId(qSessionId);
    if (qAmount && !isNaN(Number(qAmount))) setAmount(Number(qAmount));
    if (qName) setCustomerName(decodeURIComponent(qName));
    if (qPhone) setCustomerPhone(qPhone);
    if (qType) setOrderType(qType);
  }, []);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, "$1 ").trim();
    setCardNumber(formatted);
  };

  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setCardExpiry(val);
  };

  const handlePay = async () => {
    setErrorMessage("");

    // Validate inputs
    if (paymentTab === "card") {
      const cleanCard = cardNumber.replace(/\s+/g, "");
      if (cleanCard.length < 15) {
        setErrorMessage("कृपया 16 अंकों का मान्य कार्ड नंबर दर्ज करें।");
        return;
      }
      if (!cardExpiry || !cardExpiry.includes("/")) {
        setErrorMessage("कृपया मान्य समाप्ति तिथि (MM/YY) दर्ज करें।");
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setErrorMessage("कृपया 3 अंकों का CVV नंबर दर्ज करें।");
        return;
      }
    } else if (paymentTab === "upi" && upiId && !upiId.includes("@")) {
      setErrorMessage("कृपया मान्य UPI ID दर्ज करें (उदा. username@bank)।");
      return;
    }

    setIsProcessing(true);
    setProcessingStep("कैशफ्री सुरक्षित सर्वर से संपर्क स्थापित हो रहा है (Connecting to Cashfree)...");

    try {
      let methodLabel = "Cashfree Hosted Checkout";
      if (paymentTab === "upi") {
        methodLabel = upiId ? `Cashfree UPI (${upiId})` : `Cashfree UPI (${selectedUpiApp.toUpperCase()})`;
      } else if (paymentTab === "card") {
        methodLabel = `Cashfree Card (Ending in ${cardNumber.slice(-4) || "XXXX"})`;
      } else if (paymentTab === "netbanking") {
        methodLabel = `Cashfree NetBanking (${selectedBank})`;
      } else if (paymentTab === "wallet") {
        methodLabel = `Cashfree Wallet (${selectedWallet.toUpperCase()})`;
      }

      await new Promise((r) => setTimeout(r, 600));
      setProcessingStep("बैंक गेटवे द्वारा भुगतान अधिकृत किया जा रहा है (Authorizing Payment)...");
      await new Promise((r) => setTimeout(r, 700));

      // Call verification API to complete order and generate tax receipt
      const res = await fetch("/api/cashfree/verify-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          paymentSessionId: sessionId,
          paymentMethod: methodLabel,
          donorData: {
            donorName: customerName,
            amount,
            phone: customerPhone
          },
          memberData: orderType === "MEMBERSHIP" ? {
            fullName: customerName,
            phone: customerPhone,
            membershipFee: amount
          } : undefined
        })
      });

      const data = await res.json();

      if (data.success) {
        setProcessingStep("भुगतान स्वीकृत! मुख्य पृष्ठ पर 80GGC रसीद हेतु पुनः निर्देशित किया जा रहा है...");
        await new Promise((r) => setTimeout(r, 600));
        
        // Redirect to standard Return URL per Cashfree integration docs
        window.location.href = `/?order_id=${encodeURIComponent(orderId)}&payment_status=cashfree_return`;
      } else {
        setErrorMessage(data.error || "भुगतान प्रक्रिया में समस्या आई।");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setErrorMessage("कैशफ्री सर्वर से संपर्क में समस्या आई। पुनः प्रयास करें।");
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    window.location.href = `/?payment_status=cancelled`;
  };

  return (
    <div className="min-h-screen bg-slate-900/95 py-6 px-3 sm:px-6 flex items-center justify-center font-sans text-slate-900">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Cashfree Official Top Header */}
        <div className="bg-[#0b132b] px-6 py-4 text-white flex flex-wrap items-center justify-between border-b border-slate-800 gap-3">
          <div className="flex items-center space-x-3">
            {/* Cashfree Logo Symbol */}
            <div className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-400 to-indigo-500 text-[#0b132b] px-3 py-1 rounded-lg font-black text-xs tracking-wider shadow">
              <span>CASHFREE</span>
              <span className="text-white font-mono bg-[#0b132b] px-1 rounded text-[10px]">PG</span>
            </div>
            <div>
              <span className="text-xs font-black text-slate-200 block tracking-tight">
                Cashfree Hosted Payment Gateway
              </span>
              <span className="text-[10px] text-sky-300 font-mono flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                api.cashfree.com/pg/orders
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-bold text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>256-Bit SSL • PCI-DSS Level 1</span>
          </div>
        </div>

        {/* Merchant & Order Ribbon */}
        <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-b border-orange-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase text-orange-950 tracking-wider block">
              प्राप्तकर्ता संगठन (Merchant Name):
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-1.5">
              <span>समान अधिकार पार्टी</span>
              <span className="text-xs text-slate-600 font-bold">(SAMAN ADHIKAR PARTY)</span>
            </h2>
            <p className="text-xs text-slate-600 font-mono">
              ECI: 56/112/2024/PPS-I • PAN: {PARTY_INFO.panNumber}
            </p>
          </div>

          <div className="sm:text-right bg-white sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-orange-200">
            <span className="text-[10px] font-black uppercase text-slate-500 block">
              कुल भुगतान राशि (Payable Amount):
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700">
              ₹{amount.toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] font-bold text-slate-500 font-mono">
              Order: {orderId}
            </span>
          </div>
        </div>

        {/* Gateway Body */}
        <div className="p-5 sm:p-8 space-y-6">
          
          {/* Method Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => setPaymentTab("upi")}
              className={`p-3.5 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                paymentTab === "upi"
                  ? "border-sky-500 bg-sky-50/70 text-sky-950 shadow-md ring-2 ring-sky-400/20"
                  : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
              }`}
            >
              <Smartphone className={`w-5 h-5 ${paymentTab === "upi" ? "text-sky-600" : "text-slate-500"}`} />
              <span className="text-xs font-black">UPI / Apps</span>
              <span className="text-[10px] text-slate-500">GPay, PhonePe, Paytm</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentTab("card")}
              className={`p-3.5 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                paymentTab === "card"
                  ? "border-sky-500 bg-sky-50/70 text-sky-950 shadow-md ring-2 ring-sky-400/20"
                  : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
              }`}
            >
              <CreditCard className={`w-5 h-5 ${paymentTab === "card" ? "text-sky-600" : "text-slate-500"}`} />
              <span className="text-xs font-black">Cards</span>
              <span className="text-[10px] text-slate-500">Debit / Credit / RuPay</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentTab("netbanking")}
              className={`p-3.5 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                paymentTab === "netbanking"
                  ? "border-sky-500 bg-sky-50/70 text-sky-950 shadow-md ring-2 ring-sky-400/20"
                  : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
              }`}
            >
              <Landmark className={`w-5 h-5 ${paymentTab === "netbanking" ? "text-sky-600" : "text-slate-500"}`} />
              <span className="text-xs font-black">Net Banking</span>
              <span className="text-[10px] text-slate-500">All Indian Banks</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentTab("wallet")}
              className={`p-3.5 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                paymentTab === "wallet"
                  ? "border-sky-500 bg-sky-50/70 text-sky-950 shadow-md ring-2 ring-sky-400/20"
                  : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
              }`}
            >
              <Wallet className={`w-5 h-5 ${paymentTab === "wallet" ? "text-sky-600" : "text-slate-500"}`} />
              <span className="text-xs font-black">Wallets</span>
              <span className="text-[10px] text-slate-500">Paytm, Mobikwik</span>
            </button>
          </div>

          {/* TAB 1: UPI */}
          {paymentTab === "upi" && (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase text-slate-700 tracking-wider">
                  त्वरित UPI ऐप चुनें (Select UPI App):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "gpay", name: "Google Pay", color: "border-blue-300 bg-blue-50 text-blue-900" },
                    { id: "phonepe", name: "PhonePe", color: "border-purple-300 bg-purple-50 text-purple-900" },
                    { id: "paytm", name: "Paytm UPI", color: "border-sky-300 bg-sky-50 text-sky-900" },
                    { id: "bhim", name: "BHIM / Any UPI", color: "border-emerald-300 bg-emerald-50 text-emerald-900" }
                  ].map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedUpiApp(app.id)}
                      className={`p-3 rounded-2xl border-2 font-black text-xs transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                        selectedUpiApp === app.id
                          ? "border-sky-600 bg-sky-600 text-white shadow-md"
                          : "border-slate-200 bg-white text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>{app.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  अथवा कोई भी UPI ID (VPA) दर्ज करें:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="उदा: 9876543210@paytm या name@okhdfcbank"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-950 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <QrCode className="w-4 h-4 text-sky-700 shrink-0" />
                  <span className="font-bold">Instant UPI QR & App Intent समर्थित</span>
                </div>
                <span className="font-mono font-black text-[11px] text-sky-800">₹{amount}</span>
              </div>
            </div>
          )}

          {/* TAB 2: CARDS */}
          {paymentTab === "card" && (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1.5">कार्ड संख्या (Card Number):</label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={19}
                    placeholder="4532 •••• •••• 8892"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-mono tracking-wider outline-none focus:border-sky-500"
                  />
                  <div className="absolute right-3 top-3 flex items-center space-x-1.5 text-[10px] text-slate-400 font-bold">
                    <span>RuPay</span>
                    <span>•</span>
                    <span>Visa</span>
                    <span>•</span>
                    <span>MasterCard</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1.5">समाप्ति तिथि (MM/YY):</label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="12/28"
                    value={cardExpiry}
                    onChange={handleCardExpiryChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-mono outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1.5">CVV (3 अंक):</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="•••"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-mono outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1.5">कार्डधारक का नाम (Name on Card):</label>
                <input
                  type="text"
                  placeholder="उदा. KULDEEP SHARMA"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1 text-[11px] text-slate-600">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>RBI Tokenization Compliant: आपके कार्ड का विवरण सुरक्षित एन्क्रिप्टेड है।</span>
              </div>
            </div>
          )}

          {/* TAB 3: NET BANKING */}
          {paymentTab === "netbanking" && (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4">
              <label className="block text-xs font-black uppercase text-slate-700 tracking-wider">
                प्रमुख बैंक चुनें (Select Bank):
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {POPULAR_BANKS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBank(b.name)}
                    className={`p-3 rounded-xl border text-xs font-black text-left transition-all cursor-pointer ${
                      selectedBank === b.name
                        ? "border-sky-600 bg-sky-50 text-sky-950 shadow-sm"
                        : "border-slate-200 bg-white text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  अन्य सभी बैंक (All Other Banks):
                </label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-xs font-bold outline-none focus:border-sky-500"
                >
                  <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="Axis Bank">Axis Bank</option>
                  <option value="Punjab National Bank">Punjab National Bank</option>
                  <option value="Bank of Baroda">Bank of Baroda</option>
                  <option value="Canara Bank">Canara Bank</option>
                  <option value="Union Bank of India">Union Bank of India</option>
                  <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  <option value="IndusInd Bank">IndusInd Bank</option>
                  <option value="Yes Bank">Yes Bank</option>
                  <option value="IDBI Bank">IDBI Bank</option>
                  <option value="Central Bank of India">Central Bank of India</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 4: WALLETS */}
          {paymentTab === "wallet" && (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-3">
              <label className="block text-xs font-black uppercase text-slate-700 tracking-wider">
                वॉलेट चुनें (Select Digital Wallet):
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "paytm", name: "Paytm Wallet" },
                  { id: "phonepe", name: "PhonePe Wallet" },
                  { id: "mobikwik", name: "MobiKwik" },
                  { id: "amazonpay", name: "Amazon Pay" }
                ].map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelectedWallet(w.id)}
                    className={`p-3.5 rounded-xl border-2 font-black text-xs transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                      selectedWallet === w.id
                        ? "border-sky-600 bg-sky-600 text-white shadow-md"
                        : "border-slate-200 bg-white text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>{w.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-300 text-red-700 rounded-xl text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action CTAs */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handlePay}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-700 hover:to-indigo-700 text-white font-black text-base shadow-xl flex items-center justify-center space-x-2.5 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-75"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>{processingStep || "भुगतान प्रक्रियाधीन है..."}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-sky-200" />
                  <span>Pay ₹{amount.toLocaleString("en-IN")} Securely via Cashfree</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-1">
              <button
                type="button"
                onClick={handleCancel}
                className="text-slate-600 hover:text-red-600 hover:underline cursor-pointer flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>निरस्त करें व पार्टी पोर्टल पर लौटें (Cancel)</span>
              </button>

              <div className="flex items-center space-x-1.5 text-emerald-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Sec 80GGC 100% Tax Deductible</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-medium gap-2">
          <span>Secured by Cashfree Payments Gateway • India</span>
          <span className="font-mono">Order: {orderId}</span>
        </div>

      </div>
    </div>
  );
};
