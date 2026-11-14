import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CheckCircle, Download, Loader2, Printer, ShieldCheck } from "lucide-react";
import { DonationReceipt } from "../types";
import { PARTY_INFO } from "../data/campaignData";
import { downloadDonationReceiptPdf } from "../utils/donationReceiptPdf";

interface OfficialReceiptCardProps {
  receipt: DonationReceipt;
  orderId?: string | null;
  cashfreePaymentId?: string | null;
  internalTransactionId?: string | null;
  paymentMethod?: string | null;
  showActions?: boolean;
  onAfterPrintAction?: React.ReactNode;
}

export const OfficialReceiptCard: React.FC<OfficialReceiptCardProps> = ({
  receipt,
  orderId,
  cashfreePaymentId,
  internalTransactionId,
  paymentMethod,
  showActions = true,
  onAfterPrintAction
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  const resolvedTxnRef =
    internalTransactionId || receipt.transactionId || receipt.paymentRef || receipt.receiptNumber;
  const resolvedMethod = paymentMethod || receipt.paymentMethod || "Cashfree PG";
  const resolvedPartyPan = receipt.partyPan || PARTY_INFO.panNumber || "AAOAS8885L";
  const resolvedRegNo = receipt.partyRegNumber || "56/112/2024/PPS-I (ECI Recognized)";
  const resolvedBankAcc = receipt.bankDetails?.accountNo || PARTY_INFO.bankDetails.accountNo;
  const resolvedBankIfsc = receipt.bankDetails?.ifsc || PARTY_INFO.bankDetails.ifscCode;

  useEffect(() => {
    const payload = JSON.stringify({
      party: "Saman Adhikar Party",
      partyPan: resolvedPartyPan,
      receiptNumber: receipt.receiptNumber,
      transactionId: resolvedTxnRef,
      orderId: orderId || undefined,
      amount: receipt.amount,
      donorName: receipt.donorName,
      date: receipt.date,
      section: "80GGC/80GGB",
      verified: true
    });
    QRCode.toDataURL(payload, {
      width: 140,
      margin: 1,
      color: { dark: "#064e3b", light: "#ffffff" }
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [receipt, orderId, resolvedPartyPan, resolvedTxnRef]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await downloadDonationReceiptPdf(receipt, {
        orderId,
        cashfreePaymentId,
        internalTransactionId,
        paymentMethod: resolvedMethod
      });
    } catch (err) {
      console.error("Failed to generate 80GGC PDF:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="printable-receipt bg-white border-2 border-emerald-600 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl space-y-5 text-slate-900">
        {/* Official Certificate Header */}
        <div className="text-center space-y-1.5 border-b-2 border-slate-200 pb-4">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-950 text-[10px] font-black uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>भारत निर्वाचन आयोग (ECI) पंजीकृत राजनीतिक दल • 56/158/2024-ECI</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-orange-950 tracking-tight">
            समान अधिकार पार्टी (SAMAN ADHIKAR PARTY)
          </h2>
          <p className="text-[11px] text-slate-600 font-bold">
            केंद्रीय कार्यालय: सदर बाजार, आगरा एवं मथुरा, उत्तर प्रदेश | दूरभाष: 9412165541, 7310732088
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[10px] font-mono font-bold text-slate-700 pt-0.5">
            <span>
              पार्टी PAN: <strong className="text-slate-950">{resolvedPartyPan}</strong>
            </span>
            <span>•</span>
            <span>
              पंजीकरण: <strong>{resolvedRegNo}</strong>
            </span>
            <span>•</span>
            <span className="text-emerald-800">Sec 80GGC / 80GGB Tax Relief</span>
          </div>
        </div>

        {/* Receipt Sub-header & Highlight Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800 block">
              आधिकारिक सहयोग रसीद एवं कर छूट प्रमाण पत्र
            </span>
            <span className="text-xs font-black text-emerald-950 block">
              OFFICIAL PAYMENT RECEIPT &amp; 80GGC TAX CERTIFICATE
            </span>
            <div className="pt-1 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-emerald-700">
                ₹{Number(receipt.amount || 0).toLocaleString("en-IN")}
              </span>
              <span className="text-xs font-bold text-slate-600 uppercase">
                INR • {receipt.frequency || "one-time"}
              </span>
            </div>
          </div>

          {qrDataUrl && (
            <div className="flex items-center space-x-2.5 bg-white p-2 rounded-xl border border-emerald-200 self-start sm:self-center shrink-0">
              <img src={qrDataUrl} alt="80GGC Receipt Verification QR" className="w-16 h-16" />
              <div className="text-[9px] font-mono font-bold text-slate-600 leading-tight pr-1">
                <span className="text-emerald-800 font-black block">VERIFIED QR</span>
                <span>{receipt.receiptNumber}</span>
              </div>
            </div>
          )}
        </div>

        {/* Structured Receipt Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">
              रसीद संख्या (Receipt No.)
            </span>
            <span className="font-mono font-black text-sm text-slate-900 break-all">
              {receipt.receiptNumber}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">
              दिनांक व समय (Date &amp; Time)
            </span>
            <span className="font-bold text-slate-900">{receipt.date}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">
              सहयोगकर्ता का नाम (Donor Name)
            </span>
            <span className="font-black text-slate-900 text-sm">{receipt.donorName}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">
              राज्य / क्षेत्र (State / Region)
            </span>
            <span className="font-bold text-slate-900">
              {receipt.donorState || "उत्तर प्रदेश"}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">
              ट्रांजैक्शन संदर्भ (Transaction ID)
            </span>
            <span className="font-mono font-black text-orange-700 break-all block">
              {resolvedTxnRef}
            </span>
            {cashfreePaymentId && (
              <span className="text-[10px] text-slate-500 font-mono block">
                CF Pay ID: {cashfreePaymentId}
              </span>
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">
              ऑर्डर व माध्यम (Order &amp; Method)
            </span>
            <span className="font-mono font-bold text-slate-800 break-all block">
              {orderId || receipt.paymentRef || resolvedTxnRef}
            </span>
            <span className="text-[10px] text-emerald-700 font-bold block">{resolvedMethod}</span>
          </div>

          {(receipt.panNumber || receipt.donorPhone || receipt.donorEmail) && (
            <>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">
                  दाता PAN / नागरिकता (PAN / Citizenship)
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {receipt.panNumber || "-"} ({receipt.citizenship || "INDIAN"})
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">
                  भुगतान स्थिति (Status)
                </span>
                <span className="inline-flex items-center space-x-1 font-black text-emerald-700">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>सत्यापित एवं स्वीकृत (VERIFIED)</span>
                </span>
              </div>
            </>
          )}
        </div>

        {/* Tax Exemption Clause */}
        <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl text-[11px] space-y-1 text-slate-800 leading-relaxed">
          <span className="font-black text-amber-950 block">
            आयकर अधिनियम 1961 की धारा 80GGC / 80GGB के अंतर्गत कर कटौती:
          </span>
          <p className="text-slate-700">
            {receipt.fecTaxNotice} समान अधिकार पार्टी (PAN: {resolvedPartyPan}) को डिजिटल माध्यम से प्राप्त यह
            सहयोग राशि 100% कर कटौती हेतु मान्य है।
          </p>
        </div>

        {/* Receiving Bank & Authorized Signatory Footer */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-4 border-t border-slate-200 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">
              बैंक प्राप्ति खाता (Receiving Account):
            </span>
            <span className="font-mono text-[11px] font-bold text-slate-800 block">
              SBI A/C: {resolvedBankAcc} • IFSC: {resolvedBankIfsc}
            </span>
          </div>

          <div className="sm:text-right space-y-0.5">
            <span className="font-black text-orange-950 block">कुलदीप शर्मा (Kuldeep Sharma)</span>
            <span className="text-[10px] text-slate-500 block">राष्ट्रीय अध्यक्ष, समान अधिकार पार्टी</span>
            <span className="inline-block text-[9px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">
              DIGITALLY SIGNED &amp; VERIFIED
            </span>
          </div>
        </div>
      </div>

      {/* Print & PDF Action Bar */}
      {showActions && (
        <div className="no-print flex flex-wrap items-center justify-center gap-3 pt-1">
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
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-black text-xs flex items-center space-x-2 cursor-pointer shadow-md transition-all"
          >
            {isDownloadingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>PDF रसीद डाउनलोड करें (Download PDF)</span>
          </button>

          {onAfterPrintAction}
        </div>
      )}
    </div>
  );
};
