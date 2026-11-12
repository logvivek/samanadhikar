import { getPartyInfo } from "../server/database/repositories/partyRepository";
import { initDatabase } from "../server/database/connection";
import { PARTY_INFO } from "../src/data/campaignData";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    initDatabase();
    const partyInfo = await getPartyInfo();
    return res.status(200).json({
      success: true,
      partyInfo: partyInfo || PARTY_INFO
    });
  } catch (err: any) {
    console.error("Vercel party-info API error:", err);
    return res.status(200).json({
      success: true,
      partyInfo: PARTY_INFO
    });
  }
}
