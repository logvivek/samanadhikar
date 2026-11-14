import path from "path";
import crypto from "crypto";
import fs from "fs";

// Ensure data and uploads directories exist with serverless /tmp fallback
export const ROOT_DIR = process.cwd();
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
export const DATA_DIR = isServerless ? path.join("/tmp", "data") : path.join(ROOT_DIR, "data");
export const UPLOADS_DIR = isServerless ? path.join("/tmp", "uploads") : path.join(ROOT_DIR, "uploads");
export const BACKUPS_DIR = path.join(DATA_DIR, "backups");

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
} catch {
  // Read-only filesystem fallback
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
  } catch {
    // Ignore read error
  }

  const generatedSecret = crypto.randomBytes(64).toString("hex");
  try {
    fs.writeFileSync(secretFile, generatedSecret, { encoding: "utf-8", mode: 0o600 });
  } catch {
    // In serverless read-only environment, keep in memory
  }
  return generatedSecret;
}

export interface RuntimeCashfreeConfig {
  API_BASE: string;
  ORDERS_ENDPOINT: string;
  CHECKOUT_BASE: string;
  APP_ID: string;
  SECRET_KEY: string;
  API_VERSION: string;
  ENV: "sandbox" | "production";
  ENV_NAME: "SANDBOX" | "PRODUCTION";
  IS_CONFIGURED: boolean;
}

/**
 * Resolves Cashfree PG API v3 configuration dynamically from backend environment variables.
 * Defaults to SANDBOX initially, with PRODUCTION configuration support via CASHFREE_ENV=PRODUCTION.
 * Never exposes SECRET_KEY to frontend or logs.
 */
export function getCashfreeConfig(): RuntimeCashfreeConfig {
  const appId = (process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID || "").trim();
  const secretKey = (process.env.CASHFREE_SECRET_KEY || "").trim();
  const explicitEnv = (process.env.CASHFREE_ENV || "").trim().toUpperCase();

  let isProduction = false;
  if (explicitEnv === "PRODUCTION" || explicitEnv === "PROD") {
    isProduction = true;
  } else if (explicitEnv === "SANDBOX" || explicitEnv === "TEST") {
    isProduction = false;
  } else if (appId && secretKey) {
    // Auto-detect environment from key format when CASHFREE_ENV is omitted:
    // Sandbox keys start with TEST or contain _test_; Production keys contain _prod_
    const isTestCreds = appId.toUpperCase().startsWith("TEST") || secretKey.includes("_test_");
    isProduction = !isTestCreds;
  }

  return {
    API_BASE: isProduction
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg",
    ORDERS_ENDPOINT: isProduction
      ? "https://api.cashfree.com/pg/orders"
      : "https://sandbox.cashfree.com/pg/orders",
    CHECKOUT_BASE: isProduction
      ? "https://payments.cashfree.com/order"
      : "https://payments-test.cashfree.com/order",
    APP_ID: appId,
    SECRET_KEY: secretKey,
    API_VERSION: (process.env.CASHFREE_API_VERSION || "2026-01-01").trim(),
    ENV: isProduction ? "production" : "sandbox",
    ENV_NAME: isProduction ? "PRODUCTION" : "SANDBOX",
    IS_CONFIGURED: Boolean(appId && secretKey)
  };
}

export const CONFIG = {
  PORT: 3000,
  HOST: "0.0.0.0",
  JWT_SECRET: getOrCreateJwtSecret(),
  JWT_EXPIRES_IN: "24h",
  SALT_ROUNDS: 12,
  MAX_ACTIVE_RECORDS: 100,

  // Cashfree PG API v3 Settings (Sandbox default, Production supported)
  CASHFREE: getCashfreeConfig(),

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
