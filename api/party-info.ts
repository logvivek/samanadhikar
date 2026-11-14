import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_PARTY_INFO = {
  name: "समान अधिकार पार्टी",
  nameEnglish: "Saman Adhikar Party",
  leaderName: "कुलदीप शर्मा (Kuldeep Sharma)",
  leaderRole: "राष्ट्रीय अध्यक्ष (National President)",
  motto: "समान अधिकार लाना है, श्रेष्ठ भारत बनाना है!",
  mottoEnglish: "Bring Equal Rights, Build a Supreme India!",
  contactPhone1: "9412165541",
  contactPhone2: "7310732088",
  headquarters: "सदर बाजार, आगरा एवं मथुरा, उत्तर प्रदेश, भारत",
  panNumber: "AAOAS8885L"
};

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
  return {};
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

  const db = readDb();

  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      partyInfo: db.partyInfo || DEFAULT_PARTY_INFO
    });
  }

  if (req.method === "POST") {
    if (!verifyAdminHeader(req)) {
      return res.status(401).json({ success: false, error: "एडमिन प्रमाणीकरण आवश्यक है।" });
    }
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const merged = { ...(db.partyInfo || DEFAULT_PARTY_INFO), ...body };
    db.partyInfo = merged;
    writeDb(db);
    return res.status(200).json({
      success: true,
      message: "पार्टी विवरण एवं बैंक खाता जानकारी सफलतापूर्वक अपडेट हो गई!",
      partyInfo: merged
    });
  }

  return res.status(405).json({ success: false, error: "Method Not Allowed" });
}
