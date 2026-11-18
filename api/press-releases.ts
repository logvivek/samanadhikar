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
  return { pressReleases: [], archivedPressReleases: [] };
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
      const isArchive = req.query?.mode === "archive" || String(req.url || "").includes("/archive");
      const archivedPRs = Array.isArray(db.archivedPressReleases) ? db.archivedPressReleases : [];
      if (isArchive) {
        return res.status(200).json({
          success: true,
          count: archivedPRs.length,
          archivedPressReleases: archivedPRs
        });
      }
      const pressReleases = Array.isArray(db.pressReleases) ? db.pressReleases : [];
      return res.status(200).json({
        success: true,
        count: pressReleases.length,
        archivedCount: archivedPRs.length,
        maxActiveLimit: 100,
        youtubeChannel: "https://www.youtube.com/@samanadhikarparty3851/shorts",
        pressReleases
      });
    }

    if (req.method === "POST") {
      if (!verifyAdminHeader(req)) {
        return res.status(401).json({ success: false, error: "एडमिन प्रमाणीकरण आवश्यक है।" });
      }
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const { title, titleEn, content, contentEn, category, date, location, spokesperson, imageUrl, videoUrl, videoCaption, isUrgent } = body;

      if (!title || !String(title).trim()) {
        return res.status(400).json({ success: false, error: "शीर्षक (Title) आवश्यक है।" });
      }

      const newPR = {
        id: `PR-${Date.now().toString().slice(-6)}`,
        title: String(title).trim(),
        titleEn: titleEn ? String(titleEn).trim() : "",
        content: content && String(content).trim() ? String(content).trim() : String(title).trim(),
        contentEn: contentEn ? String(contentEn).trim() : "",
        category: category || "Public Announcement",
        date: date || new Date().toISOString().split("T")[0],
        location: location || "आगरा / नई दिल्ली",
        spokesperson: spokesperson || "कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)",
        imageUrl: imageUrl || "/images/gou_mata.jpg",
        hasVideo: Boolean(videoUrl && String(videoUrl).trim()),
        videoUrl: videoUrl ? String(videoUrl).trim() : undefined,
        videoCaption: videoCaption ? String(videoCaption).trim() : undefined,
        isUrgent: Boolean(isUrgent)
      };

      db.pressReleases = Array.isArray(db.pressReleases) ? [newPR, ...db.pressReleases] : [newPR];
      writeDb(db);

      return res.status(200).json({
        success: true,
        message: "प्रेस विज्ञप्ति सफलतापूर्वक सुरक्षित हो गई!",
        activeCount: db.pressReleases.length,
        archivedCount: Array.isArray(db.archivedPressReleases) ? db.archivedPressReleases.length : 0,
        pressRelease: newPR
      });
    }

    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  } catch (err: any) {
    console.error("Vercel press-releases error:", err?.message || "Unexpected error");
    return res.status(500).json({ success: false, error: "प्रेस विज्ञप्ति प्राप्त करने में त्रुटि।" });
  }
}
