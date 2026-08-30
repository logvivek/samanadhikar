import bcrypt from "bcryptjs";
import { CONFIG } from "../../config";
import { AdminCredentials } from "../../types";
import { initDatabase, persistDatabase } from "../connection";

export async function getAdminCredentials(): Promise<AdminCredentials> {
  const db = initDatabase();
  return db.adminCredentials;
}

export async function updateAdminCredentials(newUsername: string, newPass: string): Promise<void> {
  const db = initDatabase();
  const passwordHash = await bcrypt.hash(newPass.trim(), CONFIG.SALT_ROUNDS);
  db.adminCredentials = {
    username: newUsername.trim(),
    passwordHash,
    updatedAt: new Date().toISOString()
  };
  persistDatabase();
}
