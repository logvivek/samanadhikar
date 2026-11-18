import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function getJwtSecret(): string {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length >= 16) {
    return process.env.JWT_SECRET.trim();
  }
  const seed = `${process.env.ADMIN_USERNAME || "admin"}:${process.env.ADMIN_PASSWORD || "admin123"}:${process.env.VERCEL_PROJECT_ID || "sap-2026"}`;
  return crypto.createHash("sha256").update(seed).digest("hex");
}

function verifyAdminHeader(req: any): boolean {
  const authHeader = req.headers?.authorization;
  const adminTokenHeader = req.headers?.["x-admin-token"];
  const token =
    typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.substring(7).trim()
      : typeof adminTokenHeader === "string"
        ? adminTokenHeader.trim()
        : "";
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const [header, body, sig] = parts;
    const expected = crypto.createHmac("sha256", getJwtSecret()).update(`${header}.${body}`).digest("base64url");
    const sigBuf = Buffer.from(sig, "utf8");
    const expBuf = Buffer.from(expected, "utf8");
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return false;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return Boolean(payload?.role === "admin" && (!payload.exp || payload.exp >= Math.floor(Date.now() / 1000)));
  } catch {
    return false;
  }
}

function readDb(): any {
  const tmpFile = path.join("/tmp", "data", "production_db.json");
  const rootFile = path.join(process.cwd(), "data", "production_db.json");
  for (const filePath of [tmpFile, rootFile]) {
    try {
      if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch {}
  }
  return { members: [] };
}

function writeDb(db: any) {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
  const dataDir = isServerless ? path.join("/tmp", "data") : path.join(process.cwd(), "data");
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, "production_db.json"), JSON.stringify(db, null, 2), "utf-8");
  } catch {}
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      if (!verifyAdminHeader(req)) {
        return res.status(401).json({ success: false, error: "एडमिन प्रमाणीकरण आवश्यक है।" });
      }
      const db = readDb();
      const members = Array.isArray(db.members) ? db.members : [];
      return res.status(200).json({
        success: true,
        count: members.length,
        members
      });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const { fullName, phone, email, state, district, membershipTier, interests } = body;

      if (!fullName || !phone) {
        return res.status(400).json({ success: false, error: "नाम और मोबाइल नंबर अनिवार्य हैं।" });
      }

      const cleanPhone = String(phone).replace(/\D/g, "");
      if (cleanPhone.length < 10) {
        return res.status(400).json({ success: false, error: "कृपया वैध 10-अंकीय मोबाइल नंबर दर्ज करें।" });
      }

      const memberId = `SAP-MEM-${Math.floor(100000 + Math.random() * 900000)}`;
      const effectivePrecinct = [district, state].filter(Boolean).join(", ") || "उत्तर प्रदेश";
      const newMember = {
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

      const db = readDb();
      db.members = Array.isArray(db.members) ? [newMember, ...db.members] : [newMember];
      writeDb(db);

      return res.status(200).json({
        success: true,
        message: "समान अधिकार पार्टी की सदस्यता सफलतापूर्वक स्वीकार कर ली गई है!",
        member: newMember
      });
    }

    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  } catch (err: any) {
    console.error("Vercel members error:", err?.message || "Unexpected error");
    return res.status(500).json({ success: false, error: "सदस्य डेटा प्रोसेस करने में त्रुटि।" });
  }
}
