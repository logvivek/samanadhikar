import fs from "node:fs";
import path from "node:path";

function getDbFilePath() {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
  const dataDir = isServerless ? path.join("/tmp", "data") : path.join(process.cwd(), "data");
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  } catch {}
  return path.join(dataDir, "production_db.json");
}

function readDb(): any {
  const dbFile = getDbFilePath();
  try {
    if (fs.existsSync(dbFile)) return JSON.parse(fs.readFileSync(dbFile, "utf-8"));
  } catch {}
  return { donations: [] };
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const db = readDb();
    const donations = Array.isArray(db.donations) ? db.donations : [];
    const totalRaised = donations.reduce((sum: number, d: any) => sum + (Number(d.amount) || 0), 0) + 458500;
    const donorCount = donations.length + 3844;

    if (req.method === "GET") {
      return res.status(200).json({
        success: true,
        totalRaised,
        donorCount,
        goal: 2500000,
        recentDonations: donations.slice(0, 15)
      });
    }

    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  } catch (err: any) {
    console.error("Vercel donations error:", err?.message || "Unexpected error");
    return res.status(500).json({ success: false, error: "सर्वर त्रुटि" });
  }
}
