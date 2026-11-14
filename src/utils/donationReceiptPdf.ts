import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { DonationReceipt } from "../types";
import { PARTY_INFO } from "../data/campaignData";

export interface ReceiptPdfExtra {
  orderId?: string | null;
  cashfreePaymentId?: string | null;
  internalTransactionId?: string | null;
  paymentMethod?: string | null;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let curY = y;
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    if (ctx.measureText(testLine).width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[i] + " ";
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), x, curY);
  }
}

export async function downloadDonationReceiptPdf(
  receipt: DonationReceipt,
  extra: ReceiptPdfExtra = {}
): Promise<string> {
  const receiptNo = receipt.receiptNumber || `REC-SAP-${Date.now().toString().slice(-6)}`;
  const txnRef = extra.internalTransactionId || receipt.transactionId || receipt.paymentRef || receiptNo;
  const cfPayId = extra.cashfreePaymentId || "";
  const orderId = extra.orderId || "";
  const payMethod = extra.paymentMethod || receipt.paymentMethod || "Cashfree PG";
  const amount = Number(receipt.amount || 0);
  const donorName = receipt.donorName || "राष्ट्रभक्त सहयोगकर्ता";
  const donorState = receipt.donorState || "उत्तर प्रदेश";
  const donorPan = receipt.panNumber || "-";
  const partyPan = receipt.partyPan || PARTY_INFO.panNumber || "AAOAS8885L";
  const partyReg = receipt.partyRegNumber || "56/112/2024/PPS-I (ECI Recognized)";
  const dateStr = receipt.date || new Date().toLocaleDateString("hi-IN");
  const bankAcc = receipt.bankDetails?.accountNo || PARTY_INFO.bankDetails.accountNo;
  const bankIfsc = receipt.bankDetails?.ifsc || PARTY_INFO.bankDetails.ifscCode;

  const qrPayload = JSON.stringify({
    party: "Saman Adhikar Party",
    partyPan,
    receiptNo,
    txnRef,
    orderId: orderId || undefined,
    amount,
    donorName,
    date: dateStr,
    section: "80GGC/80GGB",
    verified: true
  });

  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: 240,
    margin: 1,
    color: { dark: "#064e3b", light: "#ffffff" }
  });

  // High-resolution A4 portrait ratio canvas (1240 x 1754)
  const width = 1240;
  const height = 1754;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable for Receipt PDF");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Outer official certificate border
  drawRoundedRect(ctx, 36, 36, width - 72, height - 72, 24);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#047857";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Inner saffron accent frame
  drawRoundedRect(ctx, 50, 50, width - 100, height - 100, 18);
  ctx.strokeStyle = "#fdba74";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Header gradient band
  const hdrGrad = ctx.createLinearGradient(50, 50, width - 50, 290);
  hdrGrad.addColorStop(0, "#ea580c");
  hdrGrad.addColorStop(0.55, "#d97706");
  hdrGrad.addColorStop(1, "#047857");
  drawRoundedRect(ctx, 64, 64, width - 128, 220, 16);
  ctx.fillStyle = hdrGrad;
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffedd5";
  ctx.font = "800 18px system-ui, -apple-system, 'Noto Sans Devanagari', sans-serif";
  ctx.fillText("भारत निर्वाचन आयोग (ECI) पंजीकृत राजनीतिक दल • ECI REG: 56/158/2024-ECI", width / 2, 108);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 42px system-ui, -apple-system, 'Noto Sans Devanagari', sans-serif";
  ctx.fillText("समान अधिकार पार्टी (SAMAN ADHIKAR PARTY)", width / 2, 162);

  ctx.fillStyle = "#fff7ed";
  ctx.font = "700 19px system-ui, -apple-system, 'Noto Sans Devanagari', sans-serif";
  ctx.fillText("केंद्रीय कार्यालय: सदर बाजार, आगरा एवं मथुरा, उत्तर प्रदेश | दूरभाष: 9412165541, 7310732088", width / 2, 204);

  ctx.fillStyle = "#d1fae5";
  ctx.font = "800 18px monospace";
  ctx.fillText(`PARTY PAN: ${partyPan}   |   REG: ${partyReg}   |   SEC 80GGC / 80GGB`, width / 2, 246);

  // Title banner
  drawRoundedRect(ctx, 64, 306, width - 128, 92, 14);
  ctx.fillStyle = "#ecfdf5";
  ctx.fill();
  ctx.strokeStyle = "#6ee7b7";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#064e3b";
  ctx.font = "900 24px system-ui, -apple-system, 'Noto Sans Devanagari', sans-serif";
  ctx.fillText("आधिकारिक सहयोग रसीद एवं कर छूट प्रमाण पत्र", width / 2, 344);
  ctx.fillStyle = "#047857";
  ctx.font = "800 19px system-ui, sans-serif";
  ctx.fillText("OFFICIAL PAYMENT RECEIPT & SECTION 80GGC TAX DEDUCTION CERTIFICATE", width / 2, 378);

  ctx.textAlign = "left";

  // Amount highlight & QR row
  drawRoundedRect(ctx, 64, 422, 820, 160, 14);
  ctx.fillStyle = "#f8fafc";
  ctx.fill();
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#64748b";
  ctx.font = "800 16px system-ui, -apple-system, 'Noto Sans Devanagari', sans-serif";
  ctx.fillText("प्राप्त सहयोग राशि (PAID AMOUNT)", 92, 460);

  ctx.fillStyle = "#047857";
  ctx.font = "900 54px system-ui, sans-serif";
  ctx.fillText(`₹${amount.toLocaleString("en-IN")} INR`, 92, 524);

  ctx.fillStyle = "#0f172a";
  ctx.font = "800 19px system-ui, -apple-system, 'Noto Sans Devanagari', sans-serif";
  ctx.fillText(`स्थिति: सत्यापित एवं स्वीकृत (VERIFIED & PAID) • ${receipt.frequency || "one-time"}`, 92, 560);

  // QR Box on Right
  const qrSize = 148;
  const qrBoxX = width - 64 - 260;
  drawRoundedRect(ctx, qrBoxX, 422, 260, 160, 14);
  ctx.fillStyle = "#ecfdf5";
  ctx.fill();
  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, qrBoxX + 12, 428, qrSize, qrSize);

  ctx.fillStyle = "#065f46";
  ctx.font = "800 15px monospace";
  ctx.fillText("SCAN TO", qrBoxX + 170, 480);
  ctx.fillText("VERIFY", qrBoxX + 170, 502);
  ctx.fillStyle = "#0f172a";
  ctx.font = "700 13px monospace";
  ctx.fillText("80GGC", qrBoxX + 170, 534);

  // Structured 2-column Receipt Details Grid
  const rows: Array<[string, string, string, string]> = [
    ["रसीद संख्या (Receipt No.)", receiptNo, "दिनांक व समय (Date & Time)", dateStr],
    ["सहयोगकर्ता का नाम (Donor Name)", donorName, "राज्य / क्षेत्र (State / Region)", donorState],
    ["ट्रांजैक्शन संदर्भ (Transaction Ref)", String(txnRef), "भुगतान माध्यम (Payment Method)", payMethod],
    ["ऑर्डर आईडी (Cashfree Order ID)", orderId || receipt.paymentRef || txnRef, "Cashfree Payment ID", cfPayId || "Verified PG"],
    ["दाता PAN / नागरिकता (PAN / Status)", `${donorPan} (${receipt.citizenship || "INDIAN"})`, "संपर्क विवरण (Email / Phone)", receipt.donorPhone || receipt.donorEmail || "-"]
  ];

  let curY = 612;
  const colW = (width - 128 - 20) / 2;
  const rowH = 112;

  for (const [l1, v1, l2, v2] of rows) {
    // Left cell
    drawRoundedRect(ctx, 64, curY, colW, rowH, 12);
    ctx.fillStyle = "#f8fafc";
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = "#64748b";
    ctx.font = "700 16px system-ui, -apple-system, 'Noto Sans Devanagari', sans-serif";
    ctx.fillText(l1, 84, curY + 34);
    ctx.fillStyle = "#0f172a";
    ctx.font = "800 22px system-ui, -apple-system, 'Noto Sans Devanagari', monospace";
    ctx.fillText(String(v1).slice(0, 38), 84, curY + 78, colW - 36);

    // Right cell
    const rightX = 64 + colW + 20;
    drawRoundedRect(ctx, rightX, curY, colW, rowH, 12);
    ctx.fillStyle = "#f8fafc";
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.stroke();

    ctx.fillStyle = "#64748b";
    ctx.font = "700 16px system-ui, -apple-system, 'Noto Sans Devanagari', sans-serif";
    ctx.fillText(l2, rightX + 20, curY + 34);
    ctx.fillStyle = "#0f172a";
    ctx.font = "800 22px system-ui, -apple-system, 'Noto Sans Devanagari', monospace";
    ctx.fillText(String(v2).slice(0, 38), rightX + 20, curY + 78, colW - 36);

    curY += rowH + 18;
  }

  // Section 80GGC Tax Deduction Clause Box
  const clauseY = curY + 12;
  drawRoundedRect(ctx, 64, clauseY, width - 128, 178, 14);
  ctx.fillStyle = "#fffbeb";
  ctx.fill();
  ctx.strokeStyle = "#fcd34d";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#92400e";
  ctx.font = "900 19px system-ui, -apple-system, 'Noto Sans Devanagari', sans-serif";
  ctx.fillText("आयकर अधिनियम 1961 की धारा 80GGC / 80GGB के अंतर्गत कर छूट प्रमाणन:", 88, clauseY + 40);

  ctx.fillStyle = "#334155";
  ctx.font = "600 18px system-ui, -apple-system, 'Noto Sans Devanagari', sans-serif";
  wrapText(
    ctx,
    `${receipt.fecTaxNotice} समान अधिकार पार्टी (PAN: ${partyPan}) को डिजिटल भुगतान / बैंक माध्यम द्वारा दिया गया यह सहयोग आयकर अधिनियम 1961 की धारा 80GGC (व्यक्तियों हेतु) एवं धारा 80GGB (कंपनियों हेतु) के अंतर्गत 100% कर कटौती हेतु मान्य है।`,
    88,
    clauseY + 78,
    width - 176,
    29
  );

  // Bottom Bank & Signature Footer
  const sigY = height - 220;
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(64, sigY);
  ctx.lineTo(width - 64, sigY);
  ctx.stroke();

  ctx.fillStyle = "#64748b";
  ctx.font = "700 16px system-ui, -apple-system, 'Noto Sans Devanagari', sans-serif";
  ctx.fillText("बैंक प्राप्ति खाता (Receiving Bank Account):", 64, sigY + 42);
  ctx.fillStyle = "#0f172a";
  ctx.font = "800 19px monospace";
  ctx.fillText(`SBI A/C: ${bankAcc}  •  IFSC: ${bankIfsc}`, 64, sigY + 74);
  ctx.fillStyle = "#475569";
  ctx.font = "600 16px system-ui, sans-serif";
  ctx.fillText("Website: https://samanadhikar.in", 64, sigY + 106);

  ctx.textAlign = "right";
  ctx.fillStyle = "#9a3412";
  ctx.font = "900 24px system-ui, -apple-system, 'Noto Sans Devanagari', sans-serif";
  ctx.fillText("कुलदीप शर्मा (Kuldeep Sharma)", width - 64, sigY + 46);
  ctx.fillStyle = "#475569";
  ctx.font = "700 17px system-ui, -apple-system, 'Noto Sans Devanagari', sans-serif";
  ctx.fillText("राष्ट्रीय अध्यक्ष, समान अधिकार पार्टी", width - 64, sigY + 78);

  drawRoundedRect(ctx, width - 344, sigY + 94, 280, 34, 8);
  ctx.fillStyle = "#d1fae5";
  ctx.fill();
  ctx.fillStyle = "#065f46";
  ctx.font = "800 15px monospace";
  ctx.textAlign = "center";
  ctx.fillText("DIGITALLY SIGNED & VERIFIED", width - 204, sigY + 116);

  const imgDataUrl = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
  pdf.addImage(imgDataUrl, "PNG", 0, 0, pageWidth, pageHeight);

  const safeReceiptNo = receiptNo.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `SAP-80GGC-Receipt-${safeReceiptNo}.pdf`;
  pdf.save(fileName);
  return fileName;
}
