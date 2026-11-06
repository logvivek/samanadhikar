import path from "path";
import crypto from "crypto";
import fs from "fs";

// Ensure data and uploads directories exist
export const ROOT_DIR = process.cwd();
export const DATA_DIR = path.join(ROOT_DIR, "data");
export const UPLOADS_DIR = path.join(ROOT_DIR, "uploads");
export const BACKUPS_DIR = path.join(DATA_DIR, "backups");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// Persistent Secret for JWT signing
function getOrCreateJwtSecret(): string {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length >= 16) {
    return process.env.JWT_SECRET.trim();
  }
  
  const secretFile = path.join(DATA_DIR, ".jwt_secret");
  try {
    if (fs.existsSync(secretFile)) {
      const savedSecret = fs.readFileSync(secretFile, "utf-8").trim();
      if (savedSecret.length >= 32) return savedSecret;
    }
  } catch (err) {
    console.warn("Could not read JWT secret file, generating a new one", err);
  }

  const generatedSecret = crypto.randomBytes(64).toString("hex");
  try {
    fs.writeFileSync(secretFile, generatedSecret, { encoding: "utf-8", mode: 0o600 });
  } catch (err) {
    console.warn("Could not persist JWT secret to disk", err);
  }
  return generatedSecret;
}

export const CONFIG = {
  PORT: 3000,
  HOST: "0.0.0.0",
  JWT_SECRET: getOrCreateJwtSecret(),
  JWT_EXPIRES_IN: "24h",
  SALT_ROUNDS: 12,
  MAX_ACTIVE_RECORDS: 100,
  
  // Cashfree PG Settings (Default to production https://api.cashfree.com/pg/orders)
  CASHFREE: {
    API_BASE: process.env.CASHFREE_ENV === "sandbox"
      ? "https://sandbox.cashfree.com/pg"
      : "https://api.cashfree.com/pg",
    ORDERS_ENDPOINT: process.env.CASHFREE_ENV === "sandbox"
      ? "https://sandbox.cashfree.com/pg/orders"
      : "https://api.cashfree.com/pg/orders",
    APP_ID: process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID || "",
    SECRET_KEY: process.env.CASHFREE_SECRET_KEY || "",
    API_VERSION: "2023-08-01",
    ENV: process.env.CASHFREE_ENV === "sandbox" ? "sandbox" : "production"
  },

  // Gemini Settings
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",

  // Rate Limiting
  RATE_LIMITS: {
    LOGIN_MAX: 10,
    LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MUTATION_MAX: 15,
    MUTATION_WINDOW_MS: 15 * 60 * 1000,
    PUBLIC_API_MAX: 300,
    PUBLIC_API_WINDOW_MS: 5 * 60 * 1000, // 5 minutes
    DONATION_MAX: 30,
    DONATION_WINDOW_MS: 10 * 60 * 1000
  }
};
