import { MemberRecord } from "../../types";
import { initDatabase, persistDatabase } from "../connection";

export async function getMembers(): Promise<MemberRecord[]> {
  const db = initDatabase();
  return db.members;
}

export async function addMember(member: MemberRecord): Promise<void> {
  const db = initDatabase();
  db.members.unshift(member);
  persistDatabase();
}
