import { Router } from "express";
import { getMembers, addMember } from "../database/repositories/memberRepository";
import { verifyAdmin } from "../middleware/auth";
import { mutationLimiter } from "../middleware/rateLimiter";
import { MemberRecord } from "../types";

export const membersRouter = Router();

// GET /api/members (Admin only)
membersRouter.get("/", verifyAdmin, async (_req, res) => {
  try {
    const members = await getMembers();
    return res.json({
      success: true,
      count: members.length,
      members
    });
  } catch (err: any) {
    console.error("Fetch members error:", err);
    return res.status(500).json({ success: false, error: "सदस्य सूची प्राप्त करने में त्रुटि।" });
  }
});

// POST /api/members (Public registration)
membersRouter.post("/", mutationLimiter, async (req, res) => {
  try {
    const { fullName, phone, email, state, district, assembly, occupation, membershipTier, interests } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({
        success: false,
        error: "नाम और मोबाइल नंबर अनिवार्य हैं।"
      });
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        error: "कृपया वैध 10-अंकीय मोबाइल नंबर दर्ज करें।"
      });
    }

    const memberId = `SAP-MEM-${Math.floor(100000 + Math.random() * 900000)}`;
    const effectivePrecinct = [district, state].filter(Boolean).join(", ") || "उत्तर प्रदेश";

    const newMember: MemberRecord = {
      id: memberId,
      memberCardId: memberId,
      fullName: String(fullName).trim(),
      phone: cleanPhone,
      email: email ? String(email).trim() : `${cleanPhone}@samanadhikarparty.org`,
      precinct: effectivePrecinct,
      membershipTier: membershipTier || "सक्रिय सदस्य (Active Member)",
      interests: Array.isArray(interests) && interests.length > 0 ? interests : ["समान अधिकार अभियान", "गुरुकुल योजना"],
      joinedDate: new Date().toISOString().split("T")[0],
      membershipFee: 100,
      isFeePaid: true
    };

    await addMember(newMember);

    return res.json({
      success: true,
      message: "समान अधिकार पार्टी की सदस्यता सफलतापूर्वक स्वीकार कर ली गई है! आपका सदस्यता क्रमांक जारी किया गया।",
      member: newMember
    });
  } catch (err: any) {
    console.error("Member Registration Error:", err);
    return res.status(500).json({ success: false, error: "सदस्यता पंजीकरण में तकनीकी त्रुटि।" });
  }
});
