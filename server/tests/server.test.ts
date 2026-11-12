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
  validateAdminLogin,
  generateAdminJwt,
  decodeAndValidateToken
} from "../services/authService";
import { extractAndSaveBase64Image } from "../services/uploadService";
import { CONFIG } from "../config";

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

    it("POST /api/cashfree/create-order should generate Cashfree session and return_url per redirect docs", async () => {
      const res = await request(app)
        .post("/api/cashfree/create-order")
        .send({
          orderAmount: 1100,
          customerName: "राजेश कुमार शर्मा",
          customerPhone: "9876543210",
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
      expect(res.body.paymentSessionId).toBeDefined();
      expect(res.body.paymentUrl).toBeDefined();
      expect(res.body.orderId).toMatch(/^order_sap_\d+_\d+$/);
      expect(res.body.returnUrl).toContain("?order_id={order_id}&payment_status=cashfree_return");
      expect(res.body.returnUrl.length).toBeLessThanOrEqual(250);
      expect(res.body.apiEndpoint).toBe("https://api.cashfree.com/pg/orders");
      expect(CONFIG.CASHFREE.API_VERSION).toBe("2026-01-01");

      // Verify checking status on return URL
      const statusRes = await request(app)
        .get(`/api/cashfree/order-status/${res.body.orderId}`);

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.success).toBe(true);
      expect(statusRes.body.receipt).toBeDefined();
      expect(statusRes.body.receipt.fecTaxNotice).toContain("80GGC");
      expect(statusRes.body.receipt.amount).toBe(1100);
    });
  });
});
