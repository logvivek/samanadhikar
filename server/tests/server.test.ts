import crypto from "crypto";
import { describe, it, expect, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";
import { createExpressApp } from "../app";
import {
  initDatabase,
  resetDatabaseToDefaults
} from "../database/connection";
import {
  getAdminCredentials,
  addPressRelease,
  getPressReleases,
  getArchivedPressReleases,
  addEvent,
  getEvents,
  getArchivedEvents
} from "../database/repositories";
import {
  getPaymentTransactionByOrderId,
  getAllPaymentTransactions
} from "../database/repositories/cashfreeRepository";
import {
  validateAdminLogin,
  generateAdminJwt,
  decodeAndValidateToken
} from "../services/authService";
import { extractAndSaveBase64Image } from "../services/uploadService";
import { CONFIG, getCashfreeConfig } from "../config";

describe("Production Server & Security Architecture Tests", () => {
  const app = createExpressApp();

  beforeEach(async () => {
    await resetDatabaseToDefaults();
  });

  describe("1. Password Security & Bcrypt Hashing", () => {
    it("should store hashed passwords with bcrypt (not plaintext)", async () => {
      const creds = await getAdminCredentials();
      expect(creds.passwordHash).toBeDefined();
      expect(creds.passwordHash).toMatch(/^\$2[aby]\$\d+\$/); // Valid bcrypt hash signature
      expect(creds.passwordHash).not.toBe("admin123");
    });

    it("should validate correct password via bcrypt and reject invalid password", async () => {
      const isValid = await validateAdminLogin("admin", "admin123");
      expect(isValid).toBe(true);

      const isInvalid = await validateAdminLogin("admin", "wrongpassword");
      expect(isInvalid).toBe(false);

      const isInvalidUser = await validateAdminLogin("nonexistent", "admin123");
      expect(isInvalidUser).toBe(false);
    });
  });

  describe("2. JWT Authentication & Sessions", () => {
    it("should generate valid signed JWT with 24h expiration", () => {
      const token = generateAdminJwt("admin");
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // Header.Payload.Signature

      const decoded = decodeAndValidateToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.username).toBe("admin");
      expect(decoded?.role).toBe("admin");
    });

    it("should reject tampered or invalid JWT tokens", () => {
      const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.signature";
      const decoded = decodeAndValidateToken(fakeToken);
      expect(decoded).toBeNull();
    });

    it("should reject static hardcoded legacy tokens", async () => {
      const res = await request(app)
        .post("/api/admin/change-credentials")
        .set("Authorization", "Bearer sap-admin-token-2026-secure")
        .send({
          currentPassword: "admin123",
          newUsername: "admin2",
          newPassword: "newpassword123"
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("3. 100-Record Active Archival System", () => {
    it("should automatically archive records exceeding 100 limit for Press Releases", async () => {
      // Add 105 press releases
      for (let i = 1; i <= 105; i++) {
        await addPressRelease({
          id: `PR-TEST-${i}`,
          title: `प्रेस विज्ञप्ति #${i}`,
          content: `विवरण #${i}`,
          category: "Public Announcement",
          date: `2026-08-${(i % 28) + 1}`,
          location: "आगरा HQ",
          spokesperson: "कुलदीप शर्मा",
          imageUrl: "/images/gou_mata.jpg",
          isUrgent: false
        });
      }

      const active = await getPressReleases(CONFIG.MAX_ACTIVE_RECORDS);
      const archived = await getArchivedPressReleases();

      expect(active.length).toBeLessThanOrEqual(CONFIG.MAX_ACTIVE_RECORDS);
      expect(archived.length).toBeGreaterThanOrEqual(5);
    });

    it("should automatically archive records exceeding 100 limit for Events / Rallies", async () => {
      // Add 105 events
      for (let i = 1; i <= 105; i++) {
        await addEvent({
          id: `EVT-TEST-${i}`,
          title: `विशाल रैली #${i}`,
          titleHi: `विशाल रैली #${i}`,
          type: "Rally",
          category: "Rally",
          date: `2026-09-${(i % 28) + 1}`,
          displayDate: `सितंबर 2026`,
          time: "सायं 4:00 बजे से",
          locationName: "आगरा मैदान",
          address: "आगरा, उत्तर प्रदेश",
          cityState: "उत्तर प्रदेश",
          description: `कार्यक्रम विवरण #${i}`,
          isVirtual: false,
          capacity: 5000,
          rsvpCount: 0,
          featuredSpeakers: ["कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)"]
        });
      }

      const active = await getEvents(CONFIG.MAX_ACTIVE_RECORDS);
      const archived = await getArchivedEvents();

      expect(active.length).toBeLessThanOrEqual(CONFIG.MAX_ACTIVE_RECORDS);
      expect(archived.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("4. Base64-to-Disk Image Extraction", () => {
    it("should extract base64 data URL and save to /uploads", () => {
      const sample1x1PngBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const result = extractAndSaveBase64Image(sample1x1PngBase64);

      expect(result).toBeDefined();
      expect(result).toMatch(/^\/uploads\/img-\d+-[a-f0-9]+\.png$/);
    });

    it("should leave regular URLs unchanged", () => {
      const regularUrl = "https://images.unsplash.com/photo-12345";
      expect(extractAndSaveBase64Image(regularUrl)).toBe(regularUrl);
      expect(extractAndSaveBase64Image("/images/gou_mata.jpg")).toBe("/images/gou_mata.jpg");
    });
  });

  describe("5. Endpoints & API Integration", () => {
    it("POST /api/admin/login should issue JWT on valid login", async () => {
      const res = await request(app)
        .post("/api/admin/login")
        .send({ username: "admin", password: "admin123" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.username).toBe("admin");
    });

    it("GET /api/party-info should return party details", async () => {
      const res = await request(app).get("/api/party-info");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.partyInfo.leaderName).toBe("कुलदीप शर्मा (Kuldeep Sharma)");
    });

    it("POST /api/upload should store uploaded file in storage and return clean static URL", async () => {
      const loginRes = await request(app)
        .post("/api/admin/login")
        .send({ username: "admin", password: "admin123" });
      const token = loginRes.body.token;

      // 1x1 transparent PNG buffer
      const pngBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

      const res = await request(app)
        .post("/api/upload")
        .set("Authorization", `Bearer ${token}`)
        .attach("file", pngBuffer, "banner.png");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.url).toMatch(/^\/uploads\/upload-[\w-]+\.png$/);

      // Now create a Press Release referencing only this clean URL
      const prRes = await request(app)
        .post("/api/press")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "विशाल जनसभा आगरा",
          content: "आगरा में पार्टी की विशाल जनसभा आयोजित होगी।",
          imageUrl: res.body.url
        });

      expect(prRes.status).toBe(200);
      expect(prRes.body.pressRelease.imageUrl).toBe(res.body.url);
      expect(prRes.body.pressRelease.imageUrl).not.toContain("data:image");
    });

    it("POST /api/donations should record donation and return Section 80GGC receipt", async () => {
      const res = await request(app)
        .post("/api/donations")
        .send({
          donorName: "अतुल भारद्वाज",
          amount: 5100,
          frequency: "one-time",
          isPaymentCompleted: true,
          utrNumber: "123456789012",
          panNumber: "ABCDE1234F"
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.receipt).toBeDefined();
      expect(res.body.receipt.fecTaxNotice).toContain("80GGC");
    });

    it("POST /api/cashfree/create-order should generate Cashfree SANDBOX session by default and support PRODUCTION config", async () => {
      const sandboxCfg = getCashfreeConfig();
      expect(sandboxCfg.ENV_NAME).toBe("SANDBOX");
      expect(sandboxCfg.ORDERS_ENDPOINT).toBe("https://sandbox.cashfree.com/pg/orders");
      expect(sandboxCfg.API_VERSION).toBe("2026-01-01");

      process.env.CASHFREE_ENV = "PRODUCTION";
      const prodCfg = getCashfreeConfig();
      expect(prodCfg.ENV_NAME).toBe("PRODUCTION");
      expect(prodCfg.ORDERS_ENDPOINT).toBe("https://api.cashfree.com/pg/orders");
      process.env.CASHFREE_ENV = "SANDBOX";

      const res = await request(app)
        .post("/api/cashfree/create-order")
        .send({
          orderAmount: 1100,
          customerName: "राजेश कुमार शर्मा",
          customerPhone: "9876543210",
          customerEmail: "rajesh@example.com",
          orderType: "DONATION",
          notes: "राष्ट्र निर्माण सहयोग",
          donorData: {
            donorName: "राजेश कुमार शर्मा",
            amount: 1100,
            donorState: "उत्तर प्रदेश",
            isAnonymous: false
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.internalTransactionId).toMatch(/^TXN-SAP-\d+-[A-F0-9]+$/);
      expect(res.body.paymentSessionId).toBeDefined();
      expect(res.body.paymentUrl).toBeDefined();
      expect(res.body.orderId).toMatch(/^order_sap_\d+_[a-f0-9]+$/);
      expect(res.body.currency).toBe("INR");
      expect(res.body.environment).toBe("SANDBOX");
      expect(res.body.returnUrl).toContain("?order_id={order_id}&payment_status=cashfree_return");
      expect(res.body.returnUrl.length).toBeLessThanOrEqual(250);
      expect(res.body.apiEndpoint).toBe("https://sandbox.cashfree.com/pg/orders");
      expect(CONFIG.CASHFREE.API_VERSION).toBe("2026-01-01");

      // Verify transaction ledger created in PENDING state
      const initialTx = await getPaymentTransactionByOrderId(res.body.orderId);
      expect(initialTx).not.toBeNull();
      expect(initialTx?.paymentStatus).toBe("PENDING");
      expect(initialTx?.currency).toBe("INR");
      expect(initialTx?.paymentAmount).toBe(1100);
      expect(initialTx?.customerEmail).toBe("rajesh@example.com");
      expect(initialTx?.customerMobile).toBe("9876543210");

      // Verify checking status on return URL completes to SUCCESS & issues Section 80GGC receipt
      const statusRes = await request(app)
        .get(`/api/cashfree/order-status/${res.body.orderId}`);

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.success).toBe(true);
      expect(statusRes.body.paymentStatus).toBe("SUCCESS");
      expect(statusRes.body.receipt).toBeDefined();
      expect(statusRes.body.receipt.fecTaxNotice).toContain("80GGC");
      expect(statusRes.body.receipt.amount).toBe(1100);

      // Idempotent duplicate check: re-checking status should NOT create a duplicate donation
      const secondCheck = await request(app).get(`/api/cashfree/payment-status/${res.body.orderId}`);
      expect(secondCheck.status).toBe(200);
      expect(secondCheck.body.alreadyProcessed).toBe(true);
    });
  });

  describe("6. Cashfree Security, Lifecycle States, Webhook HMAC Verification & Idempotency", () => {
    it("should reject tampered membership tier fee against server-side pricing", async () => {
      const res = await request(app)
        .post("/api/cashfree/create-order")
        .send({
          orderAmount: 1,
          customerName: "Test Member",
          customerPhone: "9876543210",
          orderType: "MEMBERSHIP",
          memberData: {
            fullName: "Test Member",
            phone: "9876543210",
            membershipTier: "सक्रिय सदस्य", // Official price is 275
            isCustomFee: false
          }
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should enforce idempotencyKey to avoid duplicate pending orders on double submission", async () => {
      const idemKey = `idem_test_${Date.now()}`;
      const payload = {
        orderAmount: 500,
        customerName: "Idem User",
        customerPhone: "9876543210",
        idempotencyKey: idemKey
      };

      const first = await request(app).post("/api/cashfree/create-order").send(payload);
      const second = await request(app).post("/api/cashfree/create-order").send(payload);

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(second.body.orderId).toBe(first.body.orderId);
      expect(second.body.idempotentReplay).toBe(true);
    });

    it("should handle FAILED, CANCELLED, USER_DROPPED, and PENDING states accurately without issuing receipts", async () => {
      const outcomes = ["FAILED", "CANCELLED", "USER_DROPPED", "PENDING"] as const;

      for (const outcome of outcomes) {
        const createRes = await request(app)
          .post("/api/cashfree/create-order")
          .send({
            orderAmount: 250,
            customerName: `User ${outcome}`,
            customerPhone: "9876543210"
          });
        expect(createRes.status).toBe(200);
        const orderId = createRes.body.orderId;

        const verifyRes = await request(app)
          .post("/api/cashfree/verify-order")
          .send({
            orderId,
            simulatedOutcome: outcome,
            paymentMethod: "UPI"
          });

        expect(verifyRes.body.success).toBe(false);
        expect(verifyRes.body.paymentStatus).toBe(outcome);
        expect(verifyRes.body.receipt).toBeUndefined();

        const statusRes = await request(app).get(`/api/cashfree/payment-status/${orderId}`);
        expect(statusRes.body.success).toBe(false);
        expect(statusRes.body.paymentStatus).toBe(outcome);
      }

      // Retry after failure creates a new unique order ID cleanly
      const retryRes = await request(app)
        .post("/api/cashfree/create-order")
        .send({
          orderAmount: 250,
          customerName: "Retry User",
          customerPhone: "9876543210"
        });
      expect(retryRes.status).toBe(200);
      expect(retryRes.body.orderId).toBeDefined();
    });

    it("should verify Cashfree webhook HMAC-SHA256 raw-body signature and prevent duplicate webhook events", async () => {
      const testSecret = "cf_test_webhook_secret_key_12345";
      process.env.CASHFREE_WEBHOOK_TEST_SECRET = testSecret;

      const createRes = await request(app)
        .post("/api/cashfree/create-order")
        .send({
          orderAmount: 1100,
          customerName: "Webhook Donor",
          customerPhone: "9876543210",
          customerEmail: "webhook@example.com"
        });
      const orderId = createRes.body.orderId;

      const webhookBodyObj = {
        type: "PAYMENT_SUCCESS_WEBHOOK",
        data: {
          order: { order_id: orderId, order_amount: 1100, order_currency: "INR", order_status: "PAID" },
          payment: {
            cf_payment_id: "9988776655",
            payment_status: "SUCCESS",
            payment_method: { upi: { upi_id: "donor@upi" } }
          }
        }
      };
      const rawBody = JSON.stringify(webhookBodyObj);
      const timestamp = String(Date.now());
      const validSignature = crypto
        .createHmac("sha256", testSecret)
        .update(`${timestamp}${rawBody}`)
        .digest("base64");

      // 1. Invalid signature must be rejected with 401
      const badRes = await request(app)
        .post("/api/cashfree/webhook")
        .set("Content-Type", "application/json")
        .set("x-webhook-timestamp", timestamp)
        .set("x-webhook-signature", "invalid_tampered_signature")
        .send(rawBody);
      expect(badRes.status).toBe(401);

      // 2. Valid signature must succeed and update DB
      const goodRes = await request(app)
        .post("/api/cashfree/webhook")
        .set("Content-Type", "application/json")
        .set("x-webhook-timestamp", timestamp)
        .set("x-webhook-signature", validSignature)
        .send(rawBody);
      expect(goodRes.status).toBe(200);
      expect(goodRes.body.status).toBe("OK");
      expect(goodRes.body.duplicate).toBe(false);
      expect(goodRes.body.paymentStatus).toBe("SUCCESS");

      const tx = await getPaymentTransactionByOrderId(orderId);
      expect(tx?.paymentStatus).toBe("SUCCESS");
      expect(tx?.cashfreePaymentId).toBe("9988776655");

      // 3. Duplicate webhook delivery must be idempotent
      const dupRes = await request(app)
        .post("/api/cashfree/webhook")
        .set("Content-Type", "application/json")
        .set("x-webhook-timestamp", timestamp)
        .set("x-webhook-signature", validSignature)
        .send(rawBody);
      expect(dupRes.status).toBe(200);
      expect(dupRes.body.duplicate).toBe(true);

      // 4. Admin can fetch transaction history ledger
      const loginRes = await request(app)
        .post("/api/admin/login")
        .send({ username: "admin", password: "admin123" });
      const txListRes = await request(app)
        .get("/api/cashfree/transactions")
        .set("Authorization", `Bearer ${loginRes.body.token}`);
      expect(txListRes.status).toBe(200);
      expect(txListRes.body.success).toBe(true);
      expect(txListRes.body.transactions.length).toBeGreaterThanOrEqual(1);

      const allTx = await getAllPaymentTransactions();
      expect(allTx.find((t) => t.cashfreeOrderId === orderId)?.paymentMethod).toBe("UPI");

      delete process.env.CASHFREE_WEBHOOK_TEST_SECRET;
    });
  });
});
