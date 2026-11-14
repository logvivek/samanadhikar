import crypto from "node:crypto";

function getJwtSecret(): string {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length >= 16) {
    return process.env.JWT_SECRET.trim();
  }
  const seed = `${process.env.ADMIN_USERNAME || "admin"}:${process.env.ADMIN_PASSWORD || "admin123"}:${process.env.VERCEL_PROJECT_ID || "sap-2026"}`;
  return crypto.createHash("sha256").update(seed).digest("hex");
}

function verifyJwt(token: string, secret: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expected = crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
    const sigBuf = Buffer.from(sig, "utf8");
    const expBuf = Buffer.from(expected, "utf8");
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");

  if (req.method === "OPTIONS") return res.status(200).end();

  const authHeader = req.headers?.authorization;
  const adminTokenHeader = req.headers?.["x-admin-token"];
  let token: string | undefined;

  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (typeof adminTokenHeader === "string") {
    token = adminTokenHeader.trim();
  }

  if (!token) {
    return res.status(200).json({ success: false, isAdmin: false });
  }

  const decoded = verifyJwt(token, getJwtSecret());
  if (decoded && decoded.role === "admin") {
    return res.status(200).json({
      success: true,
      isAdmin: true,
      username: decoded.username
    });
  }

  return res.status(200).json({ success: false, isAdmin: false });
}
