import { Router } from "express";
import { getDonations, addDonation } from "../database/repositories/donationRepository";
import { verifyAdmin } from "../middleware/auth";
import { donationLimiter } from "../middleware/rateLimiter";
import { generateSection80GGCReceipt } from "../services/cashfreeService";
import { DonationRecord } from "../types";

export const donationsRouter = Router();

// GET /api/donations (Public feed of recent contributions + aggregate stats)
donationsRouter.get("/", async (_req, res) => {
  try {
    const donations = await getDonations();
    const totalAmount = donations.reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
    const donorCount = donations.length;

    // Public list sanitizes names if marked anonymous
    const publicDonations = donations.slice(0, 50).map(d => ({
      id: d.id,
      donorName: d.isAnonymous ? "राष्ट्रभक्त नागरिक (Anonymous)" : d.donorName,
      amount: d.amount,
      frequency: d.frequency,
      precinct: d.precinct,
      timestamp: d.timestamp,
      message: d.message
    }));

    return res.json({
      success: true,
      totalAmount,
      targetAmount: 5000000,
      donorCount,
      donations: publicDonations
    });
  } catch (err: any) {
    console.error("Fetch donations error:", err);
    return res.status(500).json({ success: false, error: "दान सूची प्राप्त करने में त्रुटि।" });
  }
});

// GET /api/donations/admin/all (Full detailed donation records for Admin)
donationsRouter.get("/admin/all", verifyAdmin, async (_req, res) => {
  try {
    const donations = await getDonations();
    const totalAmount = donations.reduce((acc, d) => acc + (Number(d.amount) || 0), 0);

    return res.json({
      success: true,
      totalAmount,
      count: donations.length,
      donations
    });
  } catch (err: any) {
    console.error("Admin fetch donations error:", err);
    return res.status(500).json({ success: false, error: "दान सूची प्राप्त करने में त्रुटि।" });
  }
});

// POST /api/donations (Direct donation record with Section 80GGC tax exemption generation)
donationsRouter.post("/", donationLimiter, async (req, res) => {
  try {
    const {
      donorName,
      amount,
      frequency,
      precinct,
      isAnonymous,
      message,
      panNumber,
      phone,
      email,
      address,
      state,
      pinCode,
      citizenship,
      paymentMethod,
      transactionId
    } = req.body;

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount < 10) {
      return res.status(400).json({
        success: false,
        error: "कृपया न्यूनतम ₹10 की दान राशि दर्ज करें।"
      });
    }

    if (!donorName || !String(donorName).trim()) {
      return res.status(400).json({
        success: false,
        error: "दानदाता का नाम आवश्यक है।"
      });
    }

    const donationId = `DON-${Date.now().toString().slice(-6)}`;
    const effectiveTxnId = transactionId ? String(transactionId).trim() : `TXN-${Date.now().toString().slice(-8)}`;
    const effectivePaymentMethod = paymentMethod || "UPI / Direct Transfer";

    const newDonation: DonationRecord = {
      id: donationId,
      donorName: String(donorName).trim(),
      amount: parsedAmount,
      frequency: frequency === "monthly" ? "monthly" : "one-time",
      precinct: precinct ? String(precinct).trim() : "भारत",
      timestamp: new Date().toISOString(),
      isAnonymous: Boolean(isAnonymous),
      message: message ? String(message).trim() : undefined,
      panNumber: panNumber ? String(panNumber).trim().toUpperCase() : undefined,
      citizenship: citizenship === "NRI" ? "NRI" : "INDIAN",
      phone: phone ? String(phone).replace(/\D/g, "") : undefined,
      email: email ? String(email).trim() : undefined,
      address: address ? String(address).trim() : undefined,
      state: state ? String(state).trim() : undefined,
      pinCode: pinCode ? String(pinCode).trim() : undefined
    };

    await addDonation(newDonation);

    // Auto-generate formal Section 80GGC income tax exemption receipt
    const taxReceipt = generateSection80GGCReceipt({
      donationId: newDonation.id,
      donorName: newDonation.donorName,
      amount: newDonation.amount,
      panNumber: newDonation.panNumber,
      address: newDonation.address,
      phone: newDonation.phone,
      transactionId: effectiveTxnId,
      paymentMethod: effectivePaymentMethod,
      timestamp: newDonation.timestamp
    });

    return res.json({
      success: true,
      message: "समान अधिकार पार्टी को आर्थिक सहयोग प्रदान करने हेतु कोटि-कोटि धन्यवाद! आपका योगदान राष्ट्र निर्माण को समर्पित है।",
      donation: newDonation,
      taxReceipt,
      receipt: taxReceipt
    });
  } catch (err: any) {
    console.error("Donation recording error:", err);
    return res.status(500).json({ success: false, error: "दान सुरक्षित करने में तकनीकी त्रुटि।" });
  }
});
