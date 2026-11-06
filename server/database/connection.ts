import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { CONFIG, DATA_DIR, BACKUPS_DIR } from "../config";
import {
  AdminCredentials,
  PartyInfo,
  PressReleaseRecord,
  EventRecord,
  DonationRecord,
  MemberRecord,
  EventRsvpRecord,
  CashfreeOrderRecord
} from "../types";
import { PARTY_INFO, PRESS_RELEASES_SEED, CAMPAIGN_EVENTS } from "../../src/data/campaignData";

export const DB_FILE = path.join(DATA_DIR, "production_db.json");

export interface DatabaseSchema {
  version: number;
  adminCredentials: AdminCredentials;
  partyInfo: PartyInfo;
  pressReleases: PressReleaseRecord[];
  archivedPressReleases: PressReleaseRecord[];
  events: EventRecord[];
  archivedEvents: EventRecord[];
  donations: DonationRecord[];
  members: MemberRecord[];
  eventRsvps: EventRsvpRecord[];
  cashfreeOrders: CashfreeOrderRecord[];
}

let dbMemory: DatabaseSchema | null = null;
let isSaving = false;
let pendingSave = false;

// Initial admin password hashing (Default admin password if not customized)
export function getHashedDefaultPassword(): string {
  const initialPassword = process.env.ADMIN_PASSWORD || "admin123";
  return bcrypt.hashSync(initialPassword, CONFIG.SALT_ROUNDS);
}

export function getDefaultDatabase(): DatabaseSchema {
  const defaultUser = process.env.ADMIN_USERNAME || "admin";
  const defaultHash = getHashedDefaultPassword();

  const defaultDonations: DonationRecord[] = [
    {
      id: "DON-1001",
      donorName: "रमेश चंद्र शर्मा (Ramesh Sharma)",
      amount: 5100,
      frequency: "one-time",
      precinct: "आगरा सदर",
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      isAnonymous: false,
      message: "समान अधिकार पार्टी का संकल्प ही देश को मजबूत बनाएगा। आरक्षण मुक्त भारत!"
    },
    {
      id: "DON-1002",
      donorName: "अमित भदौरिया (Amit Bhadauria)",
      amount: 1100,
      frequency: "monthly",
      precinct: "मथुरा ज़िला",
      timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
      isAnonymous: false,
      message: "जय श्री कृष्णा! मथुरा मंदिर पुनरोद्धार एवं गौ-संरक्षण हेतु पूर्ण समर्थन।"
    },
    {
      id: "DON-1003",
      donorName: "राष्ट्रभक्त नागरिक (Anonymous)",
      amount: 11000,
      frequency: "one-time",
      precinct: "दिल्ली NCR",
      timestamp: new Date(Date.now() - 3600000 * 14).toISOString(),
      isAnonymous: true,
      message: "हिंदू राष्ट्र और जनसंख्या नियंत्रण कानून समय की सबसे बड़ी मांग है।"
    },
    {
      id: "DON-1004",
      donorName: "विकास गुप्ता (Vikas Gupta)",
      amount: 2100,
      frequency: "monthly",
      precinct: "अलीगढ़",
      timestamp: new Date(Date.now() - 3600000 * 20).toISOString(),
      isAnonymous: false,
      message: "गुरुकुल योजना से हमारे बच्चों को संस्कार और उच्च शिक्षा मिलेगी।"
    }
  ];

  return {
    version: 2,
    adminCredentials: {
      username: defaultUser,
      passwordHash: defaultHash,
      updatedAt: new Date().toISOString()
    },
    partyInfo: { ...PARTY_INFO },
    pressReleases: [...(PRESS_RELEASES_SEED as PressReleaseRecord[])],
    archivedPressReleases: [],
    events: [...(CAMPAIGN_EVENTS as EventRecord[])],
    archivedEvents: [],
    donations: defaultDonations,
    members: [],
    eventRsvps: [],
    cashfreeOrders: []
  };
}

/**
 * Initializes and returns the in-memory database instance backed by disk storage
 */
export function initDatabase(): DatabaseSchema {
  if (dbMemory) return dbMemory;

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);

      // Validate & Migrate
      if (!parsed.adminCredentials || !parsed.adminCredentials.passwordHash) {
        const oldPass = parsed.adminCredentials?.password || "admin123";
        parsed.adminCredentials = {
          username: parsed.adminCredentials?.username || "admin",
          passwordHash: bcrypt.hashSync(oldPass, CONFIG.SALT_ROUNDS),
          updatedAt: new Date().toISOString()
        };
      }

      if (!parsed.pressReleases) parsed.pressReleases = [...(PRESS_RELEASES_SEED as PressReleaseRecord[])];
      if (!parsed.archivedPressReleases) parsed.archivedPressReleases = [];
      if (!parsed.events) parsed.events = [...(CAMPAIGN_EVENTS as EventRecord[])];
      if (!parsed.archivedEvents) parsed.archivedEvents = [];
      if (!parsed.donations) parsed.donations = [];
      if (!parsed.members) parsed.members = [];
      if (!parsed.eventRsvps) parsed.eventRsvps = [];
      if (!parsed.cashfreeOrders) parsed.cashfreeOrders = [];
      if (!parsed.partyInfo) parsed.partyInfo = { ...PARTY_INFO };

      dbMemory = parsed as DatabaseSchema;
      return dbMemory;
    } catch (err) {
      console.error("Failed to load production DB file, backing up and creating fresh DB:", err);
      try {
        fs.copyFileSync(DB_FILE, path.join(BACKUPS_DIR, `corrupted_db_${Date.now()}.json`));
      } catch {}
    }
  }

  dbMemory = getDefaultDatabase();
  persistDatabase();
  return dbMemory;
}

/**
 * Atomically writes memory state to disk
 */
export function persistDatabase(): void {
  if (!dbMemory) return;

  if (isSaving) {
    pendingSave = true;
    return;
  }

  isSaving = true;
  const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
  try {
    const data = JSON.stringify(dbMemory, null, 2);
    fs.writeFileSync(tempPath, data, "utf-8");
    fs.renameSync(tempPath, DB_FILE);
  } catch (err) {
    console.error("Failed to persist database to disk:", err);
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch {}
  } finally {
    isSaving = false;
    if (pendingSave) {
      pendingSave = false;
      persistDatabase();
    }
  }
}

/**
 * Resets database back to default state with safety backup
 */
export async function resetDatabaseToDefaults(): Promise<void> {
  try {
    fs.copyFileSync(DB_FILE, path.join(BACKUPS_DIR, `backup_before_reset_${Date.now()}.json`));
  } catch {}

  dbMemory = getDefaultDatabase();
  persistDatabase();
}
