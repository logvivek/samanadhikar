import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";

function getJwtSecret(): string {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length >= 16) {
    return process.env.JWT_SECRET.trim();
  }
  const seed = `${process.env.ADMIN_USERNAME || "admin"}:${process.env.ADMIN_PASSWORD || "admin123"}:${process.env.VERCEL_PROJECT_ID || "sap-2026"}`;
  return crypto.createHash("sha256").update(seed).digest("hex");
}

function signJwt(payload: Record<string, unknown>, secret: string, expiresInSec = 86400): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp: now + expiresInSec })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

function readStoredCredentials(): { username: string; passwordHash?: string } | null {
  const candidates = [
    path.join("/tmp", "data", "production_db.json"),
    path.join(process.cwd(), "data", "production_db.json")
  ];
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        if (parsed?.adminCredentials?.username && parsed?.adminCredentials?.passwordHash) {
          return parsed.adminCredentials;
        }
      }
    } catch {}
  }
  return null;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method Not Allowed" });

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    body = body || {};

    const username = String(body.username || "").trim();
    const password = String(body.password || "").trim();

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "यूज़रनेम और पासवर्ड दोनों आवश्यक हैं।"
      });
    }

    const envUser = (process.env.ADMIN_USERNAME || "admin").trim();
    const envPass = (process.env.ADMIN_PASSWORD || "admin123").trim();
    const stored = readStoredCredentials();

    let isValid = false;
    let resolvedUsername = envUser;

    if (stored && username.toLowerCase() === String(stored.username).trim().toLowerCase()) {
      isValid = await bcrypt.compare(password, String(stored.passwordHash));
      resolvedUsername = stored.username;
    }

    // Also allow configured env credentials when stored hash is unavailable or overridden by env
    if (!isValid && username.toLowerCase() === envUser.toLowerCase() && password === envPass) {
      isValid = true;
      resolvedUsername = envUser;
    }

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: "अवैध एडमिन यूज़रनेम या पासवर्ड।"
      });
    }

    const token = signJwt({ username: resolvedUsername, role: "admin" }, getJwtSecret());
    return res.status(200).json({
      success: true,
      token,
      message: "एडमिन लॉगिन सफल!",
      username: resolvedUsername
    });
  } catch (err: any) {
    console.error("Vercel admin login error:", err?.message || "Unexpected error");
    return res.status(500).json({ success: false, error: "लॉगिन प्रक्रिया में तकनीकी त्रुटि।" });
  }
}
