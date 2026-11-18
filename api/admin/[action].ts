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

function signJwt(payload: Record<string, unknown>, secret: string, expiresInSec = 86400): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp: now + expiresInSec })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

function verifyJwt(token: string, secret: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expected = crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
    const sigBuf = Buffer.from(sig, "utf8");
    const expBuf = Buffer.from(expected, "utf8");
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
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
  return { donations: [], members: [], cashfreeOrders: [], paymentTransactions: [] };
}

function writeDb(db: any) {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
  const dataDir = isServerless ? path.join("/tmp", "data") : path.join(process.cwd(), "data");
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, "production_db.json"), JSON.stringify(db, null, 2), "utf-8");
  } catch {}
}

async function verifyPasswordHash(plain: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;
  if (storedHash.startsWith("scrypt:")) {
    try {
      const [, saltHex, hashHex] = storedHash.split(":");
      if (!saltHex || !hashHex) return false;
      const derived = crypto.scryptSync(plain, saltHex, 64);
      const storedBuf = Buffer.from(hashHex, "hex");
      return derived.length === storedBuf.length && crypto.timingSafeEqual(derived, storedBuf);
    } catch {
      return false;
    }
  }
  if (storedHash.startsWith("$2")) {
    try {
      const mod: any = await import("bcryptjs");
      const compare = mod?.compare || mod?.default?.compare;
      if (typeof compare === "function") return await compare(plain, storedHash);
    } catch {
      return false;
    }
  }
  return false;
}

function hashPasswordScrypt(plain: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(plain, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

function extractToken(req: any): string {
  const authHeader = req.headers?.authorization;
  const adminTokenHeader = req.headers?.["x-admin-token"];
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  if (typeof adminTokenHeader === "string") {
    return adminTokenHeader.trim();
  }
  return "";
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");

  if (req.method === "OPTIONS") return res.status(200).end();

  const rawAction = req.query?.action
    ? String(req.query.action)
    : String(req.url || "").split("?")[0].split("/").filter(Boolean).pop() || "";
  const action = rawAction.toLowerCase();

  // GET /api/admin/verify
  if (action === "verify") {
    const token = extractToken(req);
    if (!token) return res.status(200).json({ success: false, isAdmin: false });
    const decoded = verifyJwt(token, getJwtSecret());
    if (decoded && decoded.role === "admin") {
      return res.status(200).json({ success: true, isAdmin: true, username: decoded.username });
    }
    return res.status(200).json({ success: false, isAdmin: false });
  }

  // POST /api/admin/login
  if (action === "login") {
    if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method Not Allowed" });
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const username = String(body.username || "").trim();
      const password = String(body.password || "").trim();
      if (!username || !password) {
        return res.status(400).json({ success: false, error: "यूज़रनेम और पासवर्ड दोनों आवश्यक हैं।" });
      }

      const envUser = (process.env.ADMIN_USERNAME || "admin").trim();
      const envPass = (process.env.ADMIN_PASSWORD || "admin123").trim();
      const db = readDb();
      const stored = db?.adminCredentials?.username && db?.adminCredentials?.passwordHash ? db.adminCredentials : null;

      let isValid = false;
      let resolvedUsername = envUser;

      if (stored && username.toLowerCase() === String(stored.username).trim().toLowerCase()) {
        isValid = await verifyPasswordHash(password, String(stored.passwordHash));
        resolvedUsername = stored.username;
      }
      if (!isValid && username.toLowerCase() === envUser.toLowerCase() && password === envPass) {
        isValid = true;
        resolvedUsername = envUser;
      }

      if (!isValid) {
        return res.status(401).json({ success: false, error: "अवैध एडमिन यूज़रनेम या पासवर्ड।" });
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

  // POST /api/admin/change-credentials
  if (action === "change-credentials") {
    if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method Not Allowed" });
    const token = extractToken(req);
    const decoded = token ? verifyJwt(token, getJwtSecret()) : null;
    if (!decoded || decoded.role !== "admin") {
      return res.status(401).json({ success: false, error: "एडमिन प्रमाणीकरण आवश्यक है।" });
    }

    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const { currentPassword, newUsername, newPassword } = body;
      if (!currentPassword || !newUsername || !newPassword) {
        return res.status(400).json({ success: false, error: "वर्तमान पासवर्ड, नया यूज़रनेम और नया पासवर्ड आवश्यक हैं।" });
      }

      const db = readDb();
      const envPass = (process.env.ADMIN_PASSWORD || "admin123").trim();
      const storedHash = db?.adminCredentials?.passwordHash;
      const isCurrentValid = storedHash
        ? (await verifyPasswordHash(String(currentPassword).trim(), String(storedHash))) || String(currentPassword).trim() === envPass
        : String(currentPassword).trim() === envPass;

      if (!isCurrentValid) {
        return res.status(401).json({ success: false, error: "वर्तमान पासवर्ड अमान्य/गलत है।" });
      }

      const trimmedUser = String(newUsername).trim();
      const trimmedPass = String(newPassword).trim();
      if (trimmedUser.length < 3 || trimmedPass.length < 6) {
        return res.status(400).json({ success: false, error: "यूज़रनेम >= 3 व पासवर्ड >= 6 अक्षर का होना चाहिए।" });
      }

      db.adminCredentials = {
        username: trimmedUser,
        passwordHash: hashPasswordScrypt(trimmedPass),
        updatedAt: new Date().toISOString()
      };
      writeDb(db);

      const newToken = signJwt({ username: trimmedUser, role: "admin" }, getJwtSecret());
      return res.status(200).json({
        success: true,
        token: newToken,
        message: "एडमिन यूज़रनेम एवं पासवर्ड सफलतापूर्वक अपडेट हो गए!",
        username: trimmedUser
      });
    } catch (err: any) {
      console.error("Vercel change credentials error:", err?.message || "Unexpected error");
      return res.status(500).json({ success: false, error: "एडमिन यूज़रनेम/पासवर्ड अपडेट में त्रुटि।" });
    }
  }

  return res.status(404).json({ success: false, error: "Unknown admin action" });
}
