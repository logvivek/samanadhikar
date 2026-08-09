export interface UtrValidationResult {
  isValid: boolean;
  type: "12-digit UPI RRN" | "Alphanumeric Txn Ref" | "Empty" | "Invalid";
  message: string;
  cleanUtr: string;
}

/**
 * Validates PhonePe, Paytm, Google Pay, BHIM, SBI UTR or Transaction Ref IDs.
 * - 12-digit numeric UPI UTR / RRN (e.g. 420192847120)
 * - 10-24 character alphanumeric Transaction ID (e.g. T26072819238472910, PAYTM1234567890)
 */
export function validateUtrNumber(utr: string | undefined | null): UtrValidationResult {
  if (!utr) {
    return {
      isValid: false,
      type: "Empty",
      message: "कृपया PhonePe/Paytm/GPay में प्राप्त 12 अंकों का UTR या Transaction ID दर्ज करें।",
      cleanUtr: ""
    };
  }

  const cleanUtr = utr.trim().replace(/\s+/g, "").toUpperCase();

  if (cleanUtr.length === 0) {
    return {
      isValid: false,
      type: "Empty",
      message: "कृपया PhonePe/Paytm/GPay में प्राप्त 12 अंकों का UTR या Transaction ID दर्ज करें।",
      cleanUtr: ""
    };
  }

  // 1. Standard 12-digit numeric UPI UTR / RRN
  if (/^\d{12}$/.test(cleanUtr)) {
    return {
      isValid: true,
      type: "12-digit UPI RRN",
      message: "✓ वैध 12-अंकीय UPI UTR (RRN) संख्या दर्ज की गई है",
      cleanUtr
    };
  }

  // 2. Alphanumeric Transaction Ref ID (PhonePe/Paytm/GPay/Bank)
  if (/^[A-Z0-9]{10,24}$/.test(cleanUtr) && /\d/.test(cleanUtr)) {
    return {
      isValid: true,
      type: "Alphanumeric Txn Ref",
      message: "✓ वैध ऑनलाइन ट्रांजैक्शन ID (Ref ID)",
      cleanUtr
    };
  }

  // Specific diagnostic error messages
  if (cleanUtr.length < 10) {
    return {
      isValid: false,
      type: "Invalid",
      message: `❌ संख्या बहुत छोटी है (${cleanUtr.length} अक्षर)। UPI UTR सामान्यतः 12 अंकों की होती है (उदा: 420192847120)।`,
      cleanUtr
    };
  }

  if (/[^A-Z0-9-]/.test(cleanUtr)) {
    return {
      isValid: false,
      type: "Invalid",
      message: "❌ अमान्य प्रतीक: केवल अंग्रेजी अक्षर एवं अंक (0-9) ही मान्य हैं।",
      cleanUtr
    };
  }

  return {
    isValid: false,
    type: "Invalid",
    message: "❌ अमान्य UTR प्रारूप। PhonePe/Paytm/GPay में प्राप्त 12-अंकीय UTR (उदा: 420192847120) दर्ज करें।",
    cleanUtr
  };
}
