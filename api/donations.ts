import fs from "node:fs";
import path from "node:path";

function readDb(): any {
  const tmpFile = path.join("/tmp", "data", "production_db.json");
  const rootFile = path.join(process.cwd(), "data", "production_db.json");
  for (const filePath of [tmpFile, rootFile]) {
    try {
      if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch {}
  }
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
