import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { MemberRecord } from "../types";

export interface MemberCardPdfOptions {
  orderId?: string | null;
  transactionId?: string | null;
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

/**
 * Generates a high-resolution PNG data URL of the Digital Member ID Card
 * using HTML5 Canvas so Hindi Devanagari & Latin typography render cleanly,
 * then wraps it into a printable PDF via jsPDF.
 */
export async function downloadMemberIdCardPdf(
  member: MemberRecord,
  options: MemberCardPdfOptions = {}
): Promise<string> {
  const cardId = member.memberCardId || member.id || `SAP-2026-${Date.now().toString().slice(-4)}`;
  const fullName = member.fullName || "समान अधिकार पार्टी सदस्य";
  const mobile = member.phone || "-";
  const district = member.precinct || member.stateDistrict || "आगरा (Agra)";
  const tier = member.membershipTier || "साधारण सदस्य";
  const amount = Number(member.membershipFee ?? 0);
  const dateStr = member.joinedDate || new Date().toISOString().split("T")[0];
  const paymentRef = options.transactionId || member.utrNumber || options.orderId || cardId;

  const qrPayload = JSON.stringify({
    party: "Saman Adhikar Party",
    cardId,
    name: fullName,
    mobile,
    district,
    tier,
    amount,
    date: dateStr,
    verified: true
  });

  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: 240,
    margin: 1,
    color: {
      dark: "#431407",
      light: "#ffffff"
    }
  });

  const width = 1200;
  const height = 740;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context unavailable for PDF generation");
  }

  // White card outer backdrop
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Outer card shell with saffron-orange gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#ea580c");
  bgGrad.addColorStop(0.55, "#d97706");
  bgGrad.addColorStop(1, "#c2410c");
  drawRoundedRect(ctx, 20, 20, width - 40, height - 40, 32);
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Subtle decorative watermark stripes
  ctx.save();
  drawRoundedRect(ctx, 20, 20, width - 40, height - 40, 32);
  ctx.clip();
  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  ctx.beginPath();
  ctx.arc(width - 120, 140, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(140, height - 80, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Top Header Band
  ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
  drawRoundedRect(ctx, 44, 44, width - 88, 128, 22);
  ctx.fill();

  // Party Name & Official Header
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 38px system-ui, -apple-system, 'Noto Sans Devanagari', sans-serif";
  ctx.fillText("समान अधिकार पार्टी (SAMAN ADHIKAR PARTY)", 72, 102);

  ctx.fillStyle = "#ffedd5";
  ctx.font = "700 20px system-ui, -apple-system, 'Noto Sans Devanagari', sans-serif";
  ctx.fillText("आधिकारिक डिजिटल सदस्यता पहचान पत्र • OFFICIAL DIGITAL MEMBER ID CARD", 72, 138);

  // ECI Reg Pill on top right
  drawRoundedRect(ctx, width - 350, 70, 278, 46, 23);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.fillStyle = "#9a3412";
  ctx.font = "800 17px monospace";
  ctx.fillText("ECI REG: 56/112/2024/PPS-I", width - 332, 99);

  // Main White Inner Panel
  drawRoundedRect(ctx, 44, 192, width - 88, 404, 24);
  ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
  ctx.fill();

  // QR Box on Right inside Inner Panel
  const qrSize = 216;
  const qrX = width - 44 - qrSize - 32;
  const qrY = 224;
  drawRoundedRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 60, 18);
  ctx.fillStyle = "#fff7ed";
  ctx.fill();
  ctx.strokeStyle = "#fdba74";
  ctx.lineWidth = 2;
  ctx.stroke();

  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = "#9a3412";
  ctx.font = "800 16px monospace";
  ctx.textAlign = "center";
  ctx.fillText(cardId, qrX + qrSize / 2, qrY + qrSize + 28);
  ctx.textAlign = "left";

  // Member Details on Left
  ctx.fillStyle = "#0f172a";
  ctx.font = "900 44px system-ui, -apple-system, 'Noto Sans Devanagari', sans-serif";
  ctx.fillText(fullName, 76, 256, qrX - 110);

  // Membership Tier Pill
  drawRoundedRect(ctx, 76, 276, 300, 40, 20);
  ctx.fillStyle = "#ea580c";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 19px system-ui, -apple-system, 'Noto Sans Devanagari', sans-serif";
  ctx.fillText(tier, 96, 303, 260);

  // Verified & Paid Pill
  drawRoundedRect(ctx, 392, 276, 240, 40, 20);
  ctx.fillStyle = "#047857";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 18px system-ui, sans-serif";
  ctx.fillText("✓ PAID & VERIFIED", 412, 303);

  // Detail Grid (2 Columns x 3 Rows)
  const drawField = (label: string, value: string, x: number, y: number, maxW: number) => {
    ctx.fillStyle = "#64748b";
    ctx.font = "700 16px system-ui, -apple-system, 'Noto Sans Devanagari', sans-serif";
    ctx.fillText(label, x, y);
    ctx.fillStyle = "#0f172a";
    ctx.font = "800 24px system-ui, -apple-system, 'Noto Sans Devanagari', sans-serif";
    ctx.fillText(value, x, y + 30, maxW);
  };

  drawField("सदस्यता कार्ड संख्या (Member Card ID)", cardId, 76, 366, 370);
  drawField("मोबाइल नंबर (Mobile Number)", mobile, 480, 366, 340);

  drawField("ज़िला / मंडल (District)", district, 76, 444, 370);
  drawField("सदस्यता शुल्क (Paid Amount)", `₹${amount.toLocaleString("en-IN")} INR`, 480, 444, 340);

  drawField("सदस्यता तिथि (Joined Date)", dateStr, 76, 522, 370);
  drawField("भुगतान संदर्भ (Payment Ref / UTR)", String(paymentRef).slice(0, 30), 480, 522, 360);

  // Bottom Signature & Footer Strip
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 21px system-ui, -apple-system, 'Noto Sans Devanagari', sans-serif";
  ctx.fillText("अधिकृत हस्ताक्षर: कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)", 52, 650);

  ctx.fillStyle = "#ffedd5";
  ctx.font = "700 17px system-ui, -apple-system, 'Noto Sans Devanagari', sans-serif";
  ctx.fillText("समान अधिकार लाना है, श्रेष्ठ भारत बनाना है! • samanadhikar.in", 52, 684);

  ctx.textAlign = "right";
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 19px monospace";
  ctx.fillText(`ISSUED: ${dateStr}`, width - 52, 654);
  ctx.fillStyle = "#fed7aa";
  ctx.font = "700 15px monospace";
  ctx.fillText(options.orderId ? `ORDER: ${options.orderId}` : "CASHFREE PG VERIFIED", width - 52, 684);
  ctx.textAlign = "left";

  const cardDataUrl = canvas.toDataURL("image/png");

  // Create A4 Landscape PDF centered with official card & verification summary
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 297 mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 210 mm

  // Crisp margin & header on PDF sheet
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(154, 52, 18);
  pdf.text("SAMAN ADHIKAR PARTY - OFFICIAL DIGITAL MEMBER ID CARD", pageWidth / 2, 16, {
    align: "center"
  });

  const cardWidthMm = 230;
  const cardHeightMm = (cardWidthMm * height) / width; // ~141.8 mm
  const cardX = (pageWidth - cardWidthMm) / 2;
  const cardY = 24;

  pdf.addImage(cardDataUrl, "PNG", cardX, cardY, cardWidthMm, cardHeightMm);

  // Verification metadata footer in ASCII-safe text
  const footerY = cardY + cardHeightMm + 12;
  pdf.setDrawColor(234, 88, 12);
  pdf.setLineWidth(0.4);
  pdf.line(cardX, footerY - 4, cardX + cardWidthMm, footerY - 4);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor(51, 65, 85);
  pdf.text(
    `Card ID: ${cardId}   |   Mobile: ${mobile}   |   Amount Paid: INR ${amount}   |   Date: ${dateStr}`,
    pageWidth / 2,
    footerY + 2,
    { align: "center" }
  );
  pdf.text(
    `Verification Ref: ${paymentRef}   |   Portal: https://samanadhikar.in`,
    pageWidth / 2,
    footerY + 8,
    { align: "center" }
  );

  // Cut guideline note at bottom
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    "This is a digitally verified membership credential issued by Saman Adhikar Party (ECI Reg: 56/112/2024/PPS-I).",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  const safeCardId = cardId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `SAP-Member-ID-${safeCardId}.pdf`;
  pdf.save(fileName);
  return fileName;
}
