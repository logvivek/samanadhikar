import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { CONFIG } from "../config";
import { JwtAdminPayload } from "../types";
import { getAdminCredentials } from "../database/repositories/adminRepository";

/**
 * Validates admin credentials using bcrypt compare
 */
export async function validateAdminLogin(user: string, pass: string): Promise<boolean> {
  const adminCreds = await getAdminCredentials();
  const u = user.trim().toLowerCase();
  const dbUser = adminCreds.username.trim().toLowerCase();

  if (u !== dbUser) {
    return false;
  }

  return bcrypt.compare(pass.trim(), adminCreds.passwordHash);
}

/**
 * Generates a signed JWT token for an authenticated administrator
 */
export function generateAdminJwt(username: string): string {
  const payload: JwtAdminPayload = {
    username,
    role: "admin"
  };

  return jwt.sign(payload, CONFIG.JWT_SECRET, {
    expiresIn: "24h",
    algorithm: "HS256"
  });
}

/**
 * Decodes and validates JWT token without throwing exceptions
 */
export function decodeAndValidateToken(token: string): JwtAdminPayload | null {
  try {
    return jwt.verify(token, CONFIG.JWT_SECRET) as JwtAdminPayload;
  } catch {
    return null;
  }
}

/**
 * Verifies JWT token and throws on invalid/expired token
 */
export function verifyAdminToken(token: string): JwtAdminPayload {
  return jwt.verify(token, CONFIG.JWT_SECRET) as JwtAdminPayload;
}

/**
 * Password hashing utility
 */
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText.trim(), CONFIG.SALT_ROUNDS);
}

/**
 * Password comparison utility
 */
export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText.trim(), hash);
}
