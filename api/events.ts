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
  return { events: [], archivedEvents: [] };
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
    const db = readDb();

    if (req.method === "GET") {
      const events = Array.isArray(db.events) ? db.events : [];
      const archived = Array.isArray(db.archivedEvents) ? db.archivedEvents : [];
      return res.status(200).json({
        success: true,
        count: events.length,
        archivedCount: archived.length,
        maxActiveLimit: 100,
        events
      });
    }

    if (req.method === "POST") {
      if (!verifyAdminHeader(req)) {
        return res.status(401).json({ success: false, error: "एडमिन प्रमाणीकरण आवश्यक है।" });
      }
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const { title, titleHi, date, time, locationName, address, cityState, description, type, category, featuredSpeakers, imageUrl } = body;

      if (!title || !date || (!locationName && !address)) {
        return res.status(400).json({ success: false, error: "शीर्षक, दिनांक और स्थान आवश्यक हैं।" });
      }

      const newEvent = {
        id: `EVT-${Date.now().toString().slice(-6)}`,
        title: String(title).trim(),
        titleHi: titleHi ? String(titleHi).trim() : String(title).trim(),
        date: String(date).trim(),
        displayDate: String(date).trim(),
        time: time ? String(time).trim() : "10:00 AM",
        locationName: locationName ? String(locationName).trim() : String(address).trim(),
        address: address ? String(address).trim() : "आगरा, उत्तर प्रदेश",
        cityState: cityState ? String(cityState).trim() : "उत्तर प्रदेश",
        description: description ? String(description).trim() : String(title).trim(),
        type: type || "Rally",
        category: category || "Rally",
        featuredSpeakers: Array.isArray(featuredSpeakers) && featuredSpeakers.length > 0 ? featuredSpeakers : ["कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)"],
        imageSeed: imageUrl || "/images/gou_mata.jpg",
        rsvpCount: 0,
        capacity: 5000,
        isVirtual: false
      };

      db.events = Array.isArray(db.events) ? [newEvent, ...db.events] : [newEvent];
      writeDb(db);

      return res.status(200).json({
        success: true,
        message: "नवीन कार्यक्रम सफलतापूर्वक सुरक्षित हुआ!",
        activeCount: db.events.length,
        archivedCount: Array.isArray(db.archivedEvents) ? db.archivedEvents.length : 0,
        event: newEvent
      });
    }

    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  } catch (err: any) {
    console.error("Vercel events error:", err?.message || "Unexpected error");
    return res.status(500).json({ success: false, error: "आयोजन सूची प्राप्त करने में त्रुटि।" });
  }
}
