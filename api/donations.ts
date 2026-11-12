import { getDonations, addDonation } from "../server/database/repositories/donationRepository";
import { initDatabase } from "../server/database/connection";
import { PARTY_INFO } from "../src/data/campaignData";
import { DonationRecord } from "../server/types";
import { buildTaxReceipt } from "../server/services/cashfreeService";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    initDatabase();

    if (req.method === "GET") {
      const donations = await getDonations();
      const totalRaised = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0) + 458500;
      const donorCount = donations.length + 3844;

      return res.status(200).json({
        success: true,
        totalRaised,
        donorCount,
        goal: 2500000,
        recentDonations: donations.slice(0, 15),
        bankDetails: PARTY_INFO.bankDetails
      });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const { donorName, amount, frequency, precinct, isAnonymous, message, paymentMethod, utrNumber, citizenship, phone, state, passportNumber } = body;

      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ success: false, error: "कृपया मान्य दान राशि दर्ज करें।" });
      }

      const id = `DON-${Date.now()}`;
      const donationRecord: DonationRecord = {
        id,
        donorName: isAnonymous ? "गुप्त राष्ट्रभक्त (Anonymous Patriot)" : (donorName || "समर्थक नागरिक"),
        amount: Number(amount),
        frequency: frequency || "one-time",
        precinct: precinct || "राष्ट्रीय मुख्यालय",
        timestamp: new Date().toISOString(),
        isAnonymous: Boolean(isAnonymous),
        message: message || "Direct Online Contribution",
        citizenship: citizenship || "INDIAN",
        phone,
        state,
        passportNumber,
        paymentMethod: paymentMethod || "Online Gateway",
        utrNumber: utrNumber || `TXN${Date.now().toString().slice(-8)}`
      };

      await addDonation(donationRecord);
      const receipt = buildTaxReceipt(donationRecord, PARTY_INFO, donationRecord.utrNumber || `TXN${Date.now()}`, donationRecord.paymentMethod);

      return res.status(200).json({
        success: true,
        donation: donationRecord,
        receipt
      });
    }

    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  } catch (err: any) {
    console.error("Vercel donations API error:", err);
    return res.status(500).json({ success: false, error: "सर्वर त्रुटि" });
  }
}
