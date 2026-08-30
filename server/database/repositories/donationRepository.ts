import { DonationRecord } from "../../types";
import { initDatabase, persistDatabase } from "../connection";

export async function getDonations(): Promise<DonationRecord[]> {
  const db = initDatabase();
  return db.donations;
}

export async function addDonation(donation: DonationRecord): Promise<void> {
  const db = initDatabase();
  db.donations.unshift(donation);
  persistDatabase();
}
