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
  return { archivedPressReleases: [] };
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ success: false, error: "Method Not Allowed" });

  const db = readDb();
  const archivedPressReleases = Array.isArray(db.archivedPressReleases) ? db.archivedPressReleases : [];
  return res.status(200).json({
    success: true,
    count: archivedPressReleases.length,
    archivedPressReleases
  });
}
