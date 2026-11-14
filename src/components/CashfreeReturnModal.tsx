import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Printer,
  X,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  Clock,
  RotateCcw,
  Ban
} from "lucide-react";
import { PARTY_INFO } from "../data/campaignData";
import { DonationReceipt, MemberRecord } from "../types";
import { MemberIdCard } from "./MemberIdCard";
import { GoogleDriveMemberSync } from "./GoogleDriveMemberSync";
import { memberToExcelRow } from "../utils/googleDriveMemberSync";

type VerifiedScreenStatus =
  | "VERIFYING"
  | "SUCCESS"
  | "PENDING"
  | "FAILED"
  | "USER_DROPPED"
  | "CANCELLED"
  | null;

interface CashfreeReturnModalProps {
  onDonationSuccess?: (receipt: DonationReceipt) => void;
  onRetryPayment?: (orderType?: "DONATION" | "MEMBERSHIP") => void;
  onClose?: () => void;
}

export const CashfreeReturnModal: React.FC<CashfreeReturnModalProps> = ({
  onDonationSuccess,
  onRetryPayment,
  onClose
}) => {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [internalTransactionId, setInternalTransactionId] = useState<string | null>(null);
  const [cashfreePaymentId, setCashfreePaymentId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<"DONATION" | "MEMBERSHIP">("DONATION");
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<VerifiedScreenStatus>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [receipt, setReceipt] = useState<DonationReceipt | null>(null);
  const [member, setMember] = useState<MemberRecord | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    const paramOrderId = searchParams.get("order_id");
    const paramPayStatus = searchParams.get("payment_status");

    if (paramOrderId) {
      setOrderId(paramOrderId);
      setIsOpen(true);
      verifyOrder(paramOrderId);
    } else if (paramPayStatus === "cancelled") {
      setIsOpen(true);
      setStatus("CANCELLED");
      setStatusMessage("उपयोगकर्ता द्वारा भुगतान निरस्त किया गया (Payment Cancelled).");
    }
  }, []);

  const cleanUrlQuery = () => {
    if (typeof window !== "undefined" && window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const verifyOrder = async (id: string) => {
    setLoading(true);
    setStatus("VERIFYING");
    setStatusMessage("कैशफ्री गेटवे से भुगतान की सर्वर-साइड पुष्टि हो रही है (Server-side Cashfree Verification)...");

    try {
      const res = await fetch(`/api/cashfree/order-status/${encodeURIComponent(id)}`);
      const data = await res.json();

      if (data.internalTransactionId || data.transactionId) {
        setInternalTransactionId(data.internalTransactionId || data.transactionId);
      }
      if (data.cashfreePaymentId) {
        setCashfreePaymentId(data.cashfreePaymentId);
      }
      if (data.paymentMethod) {
        setPaymentMethod(data.paymentMethod);
      }
      if (data.orderType === "MEMBERSHIP" || data.orderType === "DONATION") {
        setOrderType(data.orderType);
      }

      const gatewayStatus: string = data.paymentStatus || (data.orderStatus === "PAID" ? "SUCCESS" : "PENDING");

      if (data.success && gatewayStatus === "SUCCESS") {
        setStatus("SUCCESS");
        if (data.receipt) {
          setReceipt(data.receipt);
          if (onDonationSuccess) {
            onDonationSuccess(data.receipt);
          }
        }
        if (data.member) {
          setMember(data.member);
        }
        cleanUrlQuery();
      } else if (gatewayStatus === "PENDING") {
        setStatus("PENDING");
        setStatusMessage(
          data.message || "भुगतान अभी प्रक्रिया में है (Pending). बैंक से पुष्टि होते ही रसीद उपलब्ध हो जाएगी।"
        );
      } else if (gatewayStatus === "USER_DROPPED") {
        setStatus("USER_DROPPED");
        setStatusMessage(
          data.message || "चेकआउट प्रक्रिया बीच में छोड़ दी गई (User Dropped). आप नीचे दिए बटन से पुनः भुगतान कर सकते हैं।"
        );
      } else if (gatewayStatus === "CANCELLED") {
        setStatus("CANCELLED");
        setStatusMessage(
          data.message || "भुगतान निरस्त कर दिया गया (Cancelled). आप पुनः प्रयास कर सकते हैं।"
        );
      } else {
        setStatus("FAILED");
        setStatusMessage(
          data.failureReason || data.message || data.error || "भुगतान असफल रहा (Payment Failed)."
        );
      }
    } catch (err) {
      console.error("Return order verification error:", err);
      setStatus("FAILED");
      setStatusMessage("सत्यापन के दौरान सर्वर से संपर्क नहीं हो सका। कृपया पुनः स्थिति जांचें अथवा पुनः भुगतान करें।");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    cleanUrlQuery();
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleRetry = () => {
    cleanUrlQuery();
    setIsOpen(false);
    if (onRetryPayment) {
      onRetryPayment(orderType);
    } else if (onClose) {
      onClose();
    }
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
                कैशफ्री भुगतान सत्यापन (Cashfree PG Verification)
              </h2>
              <p className="text-[11px] text-orange-100 font-mono font-bold">
                {orderId ? `Order ID: ${orderId}` : "Payment Status"}
                {internalTransactionId ? ` • Txn: ${internalTransactionId}` : ""}
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

          {/* SUCCESS: Donation Section 80GGC Receipt */}
          {status === "SUCCESS" && receipt && (
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

              <div className="border-2 border-emerald-500 rounded-2xl p-5 bg-gradient-to-b from-emerald-50/40 via-white to-emerald-50/20 space-y-4 shadow-md text-xs">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                  <div>
                    <span className="font-black text-emerald-950 text-sm block">समान अधिकार पार्टी (SAMAN ADHIKAR PARTY)</span>
                    <span className="text-[10px] text-slate-600 font-mono">PAN: {receipt.partyPan || PARTY_INFO.panNumber} • 56/112/2024/PPS-I</span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-black text-[10px] rounded-full uppercase">
                    Sec 80GGC Tax Relief
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase">रसीद संख्या (Receipt No)</span>
                    <span className="font-mono font-black text-slate-900">{receipt.receiptNumber}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase">Transaction ID / Cashfree Ref</span>
                    <span className="font-mono font-black text-orange-600 truncate block">
                      {internalTransactionId || receipt.transactionId}
                    </span>
                    {cashfreePaymentId && (
                      <span className="text-[10px] text-slate-500 font-mono block">CF Pay ID: {cashfreePaymentId}</span>
                    )}
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase">Order ID & Method</span>
                    <span className="font-mono font-bold text-slate-800 block truncate">{orderId}</span>
                    <span className="text-[10px] text-emerald-700 font-bold">{paymentMethod || receipt.paymentMethod}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase">राशि व सहयोगकर्ता</span>
                    <span className="font-black text-emerald-700 text-base block">₹{receipt.amount.toLocaleString("en-IN")} INR</span>
                    <span className="font-bold text-slate-900 text-[11px]">{receipt.donorName}</span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-slate-700 leading-relaxed">
                  <strong>आयकर छूट सूचना:</strong> {receipt.fecTaxNotice}
                </div>
              </div>

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

          {/* SUCCESS: Member Registration Card + PDF Download + Google Drive Excel Sync */}
          {status === "SUCCESS" && member && !receipt && (
            <div className="space-y-5">
              <div className="text-center space-y-1.5 no-print">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <UserCheck className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-emerald-950">
                  सदस्यता पंजीकरण व भुगतान सफल!
                </h3>
                <p className="text-xs text-slate-600 font-bold">
                  समान अधिकार पार्टी परिवार में आपका हार्दिक स्वागत है। नीचे अपना डिजिटल सदस्य कार्ड प्रिंट या PDF डाउनलोड करें।
                </p>
              </div>

              <MemberIdCard
                member={member}
                orderId={orderId}
                transactionId={internalTransactionId}
                showActions={true}
              />

              <div className="no-print">
                <GoogleDriveMemberSync
                  rows={[memberToExcelRow(member)]}
                  compact={true}
                  title="सदस्यता भुगतान को Google Drive (member.xlsx) में सेव करें"
                  description="सफल भुगतान का विवरण (MemberName, Mobilenumber, District, MemAmt, Date) सीधे Google Drive Excel फ़ाइल में जोड़ें और लिंक प्राप्त करें।"
                />
              </div>

              <div className="flex justify-center pt-1 no-print">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer transition-all"
                >
                  <span>समाप्त करें (Close)</span>
                </button>
              </div>
            </div>
          )}

          {/* PENDING: Payment In Progress */}
          {status === "PENDING" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Clock className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <span className="inline-block px-3 py-0.5 bg-amber-100 text-amber-900 rounded-full text-[11px] font-black uppercase">
                  Status: PENDING
                </span>
                <h3 className="text-lg font-black text-slate-900">भुगतान प्रक्रियाधीन है (Payment Pending)</h3>
                <p className="text-xs font-bold text-slate-600 max-w-md mx-auto">
                  {statusMessage}
                </p>
                {orderId && (
                  <p className="text-[11px] font-mono text-slate-500">
                    Order ID: {orderId} {internalTransactionId ? `• Txn ID: ${internalTransactionId}` : ""}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-3 pt-3">
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
                  onClick={handleRetry}
                  className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 font-black text-xs flex items-center space-x-1.5 cursor-pointer transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Payment</span>
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

          {/* FAILED / USER_DROPPED / CANCELLED */}
          {(status === "FAILED" || status === "USER_DROPPED" || status === "CANCELLED") && (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                {status === "CANCELLED" || status === "USER_DROPPED" ? (
                  <Ban className="w-7 h-7" />
                ) : (
                  <AlertCircle className="w-7 h-7" />
                )}
              </div>
              <div className="space-y-1.5">
                <span className="inline-block px-3 py-0.5 bg-red-100 text-red-900 rounded-full text-[11px] font-black uppercase">
                  Status: {status}
                </span>
                <h3 className="text-lg font-black text-red-950">
                  {status === "CANCELLED"
                    ? "भुगतान निरस्त कर दिया गया (Payment Cancelled)"
                    : status === "USER_DROPPED"
                      ? "भुगतान प्रक्रिया अधूरी रही (User Dropped)"
                      : "भुगतान असफल रहा (Payment Failed)"}
                </h3>
                <p className="text-xs font-bold text-red-700 max-w-md mx-auto">
                  {statusMessage}
                </p>
                {orderId && (
                  <p className="text-[11px] font-mono text-slate-500">
                    Order ID: {orderId} {internalTransactionId ? `• Txn ID: ${internalTransactionId}` : ""}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs flex items-center space-x-2 cursor-pointer shadow-md transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>पुनः भुगतान करें (Retry Payment)</span>
                </button>
                {orderId && (
                  <button
                    type="button"
                    onClick={() => verifyOrder(orderId)}
                    disabled={loading}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    <span>स्थिति पुनः जांचें</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-all"
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
