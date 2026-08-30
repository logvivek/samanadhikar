import { Router } from "express";
import { createCashfreeOrder, verifyCashfreePayment, buildTaxReceipt } from "../services/cashfreeService";
import { addDonation } from "../database/repositories/donationRepository";
import { addMember } from "../database/repositories/memberRepository";
import { getPartyInfo } from "../database/repositories/partyRepository";
import { donationLimiter } from "../middleware/rateLimiter";
import { DonationRecord, MemberRecord } from "../types";

export const cashfreeRouter = Router();

// POST /api/cashfree/create-order
cashfreeRouter.post("/create-order", donationLimiter, async (req, res) => {
  try {
    const { orderAmount, customerName, customerPhone, customerEmail, orderType, notes } = req.body;

    if (!orderAmount || Number(orderAmount) <= 0) {
      return res.status(400).json({ success: false, error: "कृपया मान्य भुगतान राशि दर्ज करें।" });
    }

    const result = await createCashfreeOrder({
      orderAmount: Number(orderAmount),
      customerName,
      customerPhone,
      customerEmail,
      orderType,
      notes
    });

    if (result.success) {
      return res.json(result);
    }
    return res.status(400).json(result);
  } catch (err: any) {
    console.error("Cashfree order creation error:", err);
    return res.status(500).json({ success: false, error: "कैशफ्री आर्डर प्रक्रिया में तकनीकी त्रुटि।" });
  }
});

// POST /api/cashfree/verify-order
cashfreeRouter.post("/verify-order", async (req, res) => {
  try {
    const { orderId, donorData, memberData, orderType } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, error: "Order ID आवश्यक है।" });
    }

    const { isPaid, transactionId } = await verifyCashfreePayment(String(orderId));

    if (!isPaid) {
      return res.status(400).json({ success: false, error: "भुगतान अभी पूर्ण या सत्यापित नहीं हुआ है।" });
    }

    // Handle Donation
    if (orderType === "DONATION" && donorData) {
      const newDonation: DonationRecord = {
        id: `DON-${Math.floor(1000 + Math.random() * 9000)}`,
        donorName: donorData.isAnonymous ? "गुप्त राष्ट्रभक्त (Anonymous Patriot)" : (donorData.donorName || "समर्थक"),
        amount: Number(donorData.amount),
        frequency: donorData.frequency || "one-time",
        precinct: donorData.donorState || "आगरा HQ",
        timestamp: new Date().toISOString(),
        isAnonymous: Boolean(donorData.isAnonymous),
        message: donorData.message || "Cashfree PG Verified",
        citizenship: donorData.citizenship || "INDIAN",
        phone: donorData.phone || undefined,
        state: donorData.donorState || undefined,
        passportNumber: donorData.passportNumber || undefined
      };

      await addDonation(newDonation);
      const partyInfo = await getPartyInfo();
      const receipt = buildTaxReceipt(newDonation, partyInfo, transactionId, "Cashfree PG (api.cashfree.com)");

      return res.json({
        success: true,
        donation: newDonation,
        receipt
      });
    }

    // Handle Membership
    if (orderType === "MEMBERSHIP" && memberData) {
      const memberCardId = `SAP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newMember: MemberRecord = {
        id: `MEM-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: String(memberData.fullName).trim(),
        email: `${String(memberData.phone).trim()}@samanadhikarparty.org`,
        phone: String(memberData.phone).trim(),
        precinct: memberData.precinct || "आगरा (Agra)",
        membershipTier: memberData.membershipTier || "साधारण सदस्य",
        membershipFee: Number(memberData.membershipFee) || 10,
        joinedDate: new Date().toISOString().split("T")[0],
        memberCardId,
        interests: memberData.interests || ["समान अधिकार अभियान"],
        paymentMethod: "Cashfree PG (api.cashfree.com)",
        utrNumber: transactionId,
        isFeePaid: true
      };

      await addMember(newMember);

      return res.json({
        success: true,
        member: newMember,
        message: "सदस्यता पंजीकरण व कैशफ्री भुगतान सफल!"
      });
    }

    return res.json({
      success: true,
      orderId,
      transactionId,
      message: "कैशफ्री भुगतान सफलतापूर्वक सत्यापित हुआ।"
    });
  } catch (err: any) {
    console.error("Cashfree verification error:", err);
    return res.status(500).json({ success: false, error: "भुगतान सत्यापन में तकनीकी त्रुटि।" });
  }
});
