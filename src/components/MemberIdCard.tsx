import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Award, CheckCircle, Download, Flame, Loader2, Printer, ShieldCheck } from "lucide-react";
import { PARTY_INFO } from "../data/campaignData";
import { MemberRecord } from "../types";
import { downloadMemberIdCardPdf } from "../utils/memberCardPdf";

interface MemberIdCardProps {
  member: MemberRecord;
  orderId?: string | null;
  transactionId?: string | null;
  showActions?: boolean;
}

export const MemberIdCard: React.FC<MemberIdCardProps> = ({
  member,
  orderId,
  transactionId,
  showActions = true
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [downloadedFileName, setDownloadedFileName] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const cardId = member.memberCardId || member.id || "SAP-2026-0001";
  const amount = Number(member.membershipFee ?? 0);
  const joinedDate = member.joinedDate || new Date().toISOString().split("T")[0];
  const paymentRef = transactionId || member.utrNumber || orderId || cardId;

  useEffect(() => {
    let active = true;
    const payload = JSON.stringify({
      party: "Saman Adhikar Party",
      cardId,
      name: member.fullName,
      mobile: member.phone,
      district: member.precinct,
      tier: member.membershipTier,
      amount,
      date: joinedDate
    });

    QRCode.toDataURL(payload, {
      width: 180,
      margin: 1,
      color: { dark: "#431407", light: "#ffffff" }
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        // Fallback silently if QR fails
      });

    return () => {
      active = false;
    };
  }, [cardId, member.fullName, member.phone, member.precinct, member.membershipTier, amount, joinedDate]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setPdfError(null);
    setDownloadedFileName(null);
    setIsDownloadingPdf(true);
    try {
      const fileName = await downloadMemberIdCardPdf(member, {
        orderId,
        transactionId
      });
      setDownloadedFileName(fileName);
    } catch (err: any) {
      setPdfError(err?.message || "PDF डाउनलोड करने में तकनीकी त्रुटि आई।");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Printable Official Digital ID Card */}
      <div className="printable-receipt rounded-2xl bg-gradient-to-br from-orange-600 via-amber-600 to-orange-700 p-5 sm:p-6 text-white shadow-xl border-2 border-orange-400 space-y-4 relative overflow-hidden">
        {/* Header Band */}
        <div className="flex items-start justify-between gap-3 border-b border-white/25 pb-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-orange-100 fill-orange-100 shrink-0" />
              <span className="text-sm sm:text-base font-black tracking-wide text-white">
                {PARTY_INFO.name} (SAMAN ADHIKAR PARTY)
              </span>
            </div>
            <span className="text-[10px] font-black text-orange-100 uppercase tracking-widest block">
              आधिकारिक डिजिटल सदस्यता पहचान पत्र • ECI REG: 56/112/2024/PPS-I
            </span>
          </div>

          <div className="bg-white p-1.5 rounded-xl shadow-md shrink-0 text-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR for ${cardId}`}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain block"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-50 flex items-center justify-center text-orange-800 text-[10px] font-mono font-bold">
                QR
              </div>
            )}
            <span className="block text-[9px] font-mono font-black text-orange-950 mt-0.5">
              {cardId}
            </span>
          </div>
        </div>

        {/* Member Identity */}
        <div className="bg-white/95 text-slate-900 rounded-xl p-4 space-y-3 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-100 pb-2.5">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                सदस्य का नाम (Member Name)
              </span>
              <h4 className="text-lg sm:text-xl font-black text-slate-950 leading-tight">
                {member.fullName}
              </h4>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-600 text-white text-[11px] font-black flex items-center space-x-1">
                <Award className="w-3 h-3" />
                <span>{member.membershipTier}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-black flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>PAID & VERIFIED</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                मोबाइल नंबर (Mobile)
              </span>
              <span className="font-mono font-black text-slate-900">{member.phone || "-"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                ज़िला / मंडल (District)
              </span>
              <span className="font-extrabold text-slate-900 block truncate">
                {member.precinct || "उत्तर प्रदेश"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                सदस्यता शुल्क (MemAmt)
              </span>
              <span className="font-black text-emerald-700">₹{amount.toLocaleString("en-IN")} INR</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                सदस्यता तिथि (Date)
              </span>
              <span className="font-mono font-bold text-slate-900">{joinedDate}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                Transaction / Payment Ref
              </span>
              <span className="font-mono font-bold text-orange-700 block truncate">
                {paymentRef}
                {orderId ? ` • Order: ${orderId}` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Signature Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-orange-100 pt-1">
          <span className="font-bold">अधिकृत हस्ताक्षर: कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)</span>
          <span className="font-mono font-black text-white">samanadhikar.in</span>
        </div>
      </div>

      {/* Print & PDF Download Controls */}
      {showActions && (
        <div className="no-print space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs flex items-center space-x-2 cursor-pointer shadow-md transition-all"
            >
              <Printer className="w-4 h-4 text-orange-400" />
              <span>डिजिटल ID कार्ड प्रिंट करें (Print ID Card)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-black text-xs flex items-center space-x-2 cursor-pointer shadow-md transition-all"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>PDF तैयार हो रही है...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>PDF डाउनलोड करें (Download PDF File)</span>
                </>
              )}
            </button>
          </div>

          {downloadedFileName && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center justify-center space-x-1.5">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>PDF फ़ाइल डाउनलोड हो गई: {downloadedFileName}</span>
            </div>
          )}

          {pdfError && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold text-center">
              {pdfError}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
