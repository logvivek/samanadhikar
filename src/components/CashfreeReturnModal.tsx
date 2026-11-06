import React, { useState, useEffect } from "react";
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Printer, 
  Download, 
  Share2, 
  X, 
  ShieldCheck, 
  Heart, 
  UserCheck, 
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { PARTY_INFO } from "../data/campaignData";
import { DonationReceipt, MemberRecord } from "../types";

interface CashfreeReturnModalProps {
  onDonationSuccess?: (receipt: DonationReceipt) => void;
  onClose?: () => void;
}

export const CashfreeReturnModal: React.FC<CashfreeReturnModalProps> = ({
  onDonationSuccess,
  onClose
}) => {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<"VERIFYING" | "PAID" | "ACTIVE" | "FAILED" | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [receipt, setReceipt] = useState<DonationReceipt | null>(null);
  const [member, setMember] = useState<MemberRecord | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    // Check if user has returned from Cashfree checkout with order_id in URL
    if (typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    const paramOrderId = searchParams.get("order_id");

    if (paramOrderId) {
      setOrderId(paramOrderId);
      setIsOpen(true);
      verifyOrder(paramOrderId);
    }
  }, []);

  const verifyOrder = async (id: string) => {
    setLoading(true);
    setStatus("VERIFYING");
    setStatusMessage("कैशफ्री गेटवे से भुगतान सत्यापन हो रहा है (Verifying Cashfree Order)...");

    try {
      const res = await fetch(`/api/cashfree/order-status/${encodeURIComponent(id)}`);
      const data = await res.json();

      if (data.success && data.orderStatus === "PAID") {
        setStatus("PAID");
        if (data.receipt) {
          setReceipt(data.receipt);
          if (onDonationSuccess) {
            onDonationSuccess(data.receipt);
          }
        }
        if (data.member) {
          setMember(data.member);
        }

        // Clean query parameters from URL so refreshes don't re-trigger verification
        if (window.history && window.history.replaceState) {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      } else if (data.orderStatus === "ACTIVE") {
        setStatus("ACTIVE");
        setStatusMessage(data.message || "भुगतान अभी प्रक्रिया में है (Payment in progress). बैंक से पुष्टि होते ही रसीद उपलब्ध हो जाएगी।");
      } else {
        setStatus("FAILED");
        setStatusMessage(data.message || data.error || "भुगतान पूर्ण नहीं हुआ अथवा समय समाप्त हो गया।");
      }
    } catch (err) {
      console.error("Return order verification error:", err);
      setStatus("FAILED");
      setStatusMessage("सत्यापन के दौरान सर्वर से संपर्क नहीं हो सका। कृपया पुनः प्रयास करें।");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-orange-400 overflow-hidden text-slate-900 my-auto animate-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-6 h-6 text-orange-200 shrink-0" />
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                कैशफ्री भुगतान सत्यापन (Cashfree Web Checkout)
              </h2>
              <p className="text-[11px] text-orange-100 font-bold">
                Order ID: {orderId}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer transition-all"
            title="बंद करें"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Loading / Verifying State */}
          {status === "VERIFYING" && (
            <div className="text-center py-8 space-y-4">
              <Loader2 className="w-12 h-12 text-orange-600 animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">भुगतान की पुष्टि हो रही है...</h3>
                <p className="text-xs font-bold text-slate-600 max-w-md mx-auto">
                  {statusMessage}
                </p>
              </div>
            </div>
          )}

          {/* PAID: Donation Section 80GGC Receipt */}
          {status === "PAID" && receipt && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-emerald-950">
                  सहयोग राशि सफलतापूर्वक प्राप्त हुई!
                </h3>
                <p className="text-xs text-slate-600 font-bold">
                  समान अधिकार पार्टी आपके राष्ट्र निर्माण संकल्प व सहयोग के प्रति कृतज्ञता व्यक्त करती है।
                </p>
              </div>

              {/* Official 80GGC Receipt Card */}
              <div className="border-2 border-emerald-500 rounded-2xl p-5 bg-gradient-to-b from-emerald-50/40 via-white to-emerald-50/20 space-y-4 shadow-md text-xs">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                  <div>
                    <span className="font-black text-emerald-950 text-sm block">समान अधिकार पार्टी (SAMAN ADHIKAR PARTY)</span>
                    <span className="text-[10px] text-slate-600 font-mono">PAN: {receipt.partyPan || PARTY_INFO.panNumber} • 56/112/2024/PPS-I</span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-black text-[10px] rounded-full uppercase">
                    Sec 80GGC 100% Tax Relief
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase">रसीद संख्या (Receipt No)</span>
                    <span className="font-mono font-black text-slate-900">{receipt.receiptNumber}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase">ट्रांजैक्शन ID (Cashfree Ref)</span>
                    <span className="font-mono font-black text-orange-600 truncate block">{receipt.transactionId}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase">सहयोगकर्ता (Donor Name)</span>
                    <span className="font-black text-slate-900">{receipt.donorName}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase">राशि (Amount)</span>
                    <span className="font-black text-emerald-700 text-base">₹{receipt.amount.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-slate-700 leading-relaxed">
                  <strong>आयकर छूट सूचना:</strong> {receipt.fecTaxNotice}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs flex items-center space-x-2 cursor-pointer shadow-md transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>रसीद प्रिंट करें (Print 80GGC Receipt)</span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer transition-all"
                >
                  <span>मुख्य पृष्ठ पर लौटें</span>
                </button>
              </div>
            </div>
          )}

          {/* PAID: Member Registration Card */}
          {status === "PAID" && member && !receipt && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <UserCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-emerald-950">
                  सदस्यता पंजीकरण व भुगतान सफल!
                </h3>
                <p className="text-xs text-slate-600 font-bold">
                  समान अधिकार पार्टी परिवार में आपका हार्दिक स्वागत है।
                </p>
              </div>

              {/* Digital Membership ID Card */}
              <div className="border-2 border-orange-500 rounded-2xl p-5 bg-gradient-to-r from-orange-50 via-white to-amber-50 space-y-3 shadow-md text-xs">
                <div className="flex items-center justify-between border-b border-orange-200 pb-2">
                  <span className="font-black text-orange-950 text-sm">समान अधिकार पार्टी • डिजिटल सदस्य कार्ड</span>
                  <span className="px-2 py-0.5 bg-orange-600 text-white font-black text-[10px] rounded-full">
                    {member.membershipTier}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">नाम (Full Name)</span>
                    <span className="font-black text-slate-900">{member.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">कार्ड संख्या (Member Card ID)</span>
                    <span className="font-mono font-black text-orange-700">{member.memberCardId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">मोबाइल नंबर</span>
                    <span className="font-mono font-bold text-slate-900">{member.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">सत्यापन स्थिति</span>
                    <span className="font-black text-emerald-700">सक्रिय एवं सत्यापित (Active)</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs flex items-center space-x-2 cursor-pointer shadow-md transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>सदस्यता कार्ड प्रिंट करें</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer transition-all"
                >
                  <span>समाप्त करें</span>
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE: Payment In Progress */}
          {status === "ACTIVE" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">भुगतान प्रक्रियाधीन है (Payment Processing)</h3>
                <p className="text-xs font-bold text-slate-600 max-w-md mx-auto">
                  {statusMessage}
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => orderId && verifyOrder(orderId)}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs flex items-center space-x-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  <span>पुनः स्थिति जांचें (Recheck Status)</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer transition-all"
                >
                  <span>बंद करें</span>
                </button>
              </div>
            </div>
          )}

          {/* FAILED / CANCELLED */}
          {status === "FAILED" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-red-950">भुगतान पूर्ण नहीं हो सका</h3>
                <p className="text-xs font-bold text-red-700 max-w-md mx-auto">
                  {statusMessage}
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => orderId && verifyOrder(orderId)}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs flex items-center space-x-2 cursor-pointer shadow-md transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>पुनः जांचें</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer transition-all"
                >
                  <span>बंद करें</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
