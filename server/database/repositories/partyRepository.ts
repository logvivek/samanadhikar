import { PartyInfo } from "../../types";
import { initDatabase, persistDatabase } from "../connection";

export async function getPartyInfo(): Promise<PartyInfo> {
  const db = initDatabase();
  return db.partyInfo;
}

export async function savePartyInfo(updated: Partial<PartyInfo>): Promise<PartyInfo> {
  const db = initDatabase();
  db.partyInfo = { ...db.partyInfo, ...updated };
  persistDatabase();
  return db.partyInfo;
}
