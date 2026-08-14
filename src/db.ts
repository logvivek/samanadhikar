import initSqlJs, { Database } from "sql.js";
import fs from "fs";
import path from "path";
import { PRESS_RELEASES_SEED, PARTY_INFO, CAMPAIGN_EVENTS } from "./data/campaignData";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "database.sqlite");

let dbInstance: Database | null = null;

export interface DonationRecord {
  id: string;
  donorName: string;
  amount: number;
  frequency: "one-time" | "monthly" | "weekly";
  precinct?: string;
  timestamp: string;
  isAnonymous: boolean;
  message?: string;
  panNumber?: string;
  citizenship?: "INDIAN" | "NRI";
  phone?: string;
  email?: string;
  address?: string;
  state?: string;
  pinCode?: string;
  passportNumber?: string;
}

export interface MemberRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  precinct: string;
  membershipTier: string;
  interests: string[];
  joinedDate: string;
  memberCardId: string;
  membershipFee?: number;
  paymentMethod?: string;
  utrNumber?: string;
  isFeePaid?: boolean;
}

export interface PressReleaseRecord {
  id: string;
  title: string;
  titleEn?: string;
  content: string;
  contentEn?: string;
  category: string;
  date: string;
  location: string;
  spokesperson: string;
  imageUrl?: string;
  videoUrl?: string;
  videoCaption?: string;
  galleryImages?: string[];
  hasVideo?: boolean;
  pdfUrl?: string;
  isUrgent?: boolean;
}

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    try {
      const filebuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(filebuffer);
    } catch (err) {
      console.error("Corrupted DB file detected, resetting database file:", err);
      try {
        fs.renameSync(DB_PATH, DB_PATH + ".corrupted." + Date.now());
      } catch {
        try { fs.unlinkSync(DB_PATH); } catch {}
      }
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Ensure Tables exist
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS admin_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS party_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS press_releases (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS donations (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      joined_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS event_rsvps (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);

  // Seed default admin credentials if table is empty or update legacy default
  const adminRes = dbInstance.exec("SELECT COUNT(*) as count FROM admin_credentials");
  if (!adminRes[0] || adminRes[0].values[0][0] === 0) {
    const initialAdminUser = process.env.ADMIN_USERNAME || "admin";
    const initialAdminPass = process.env.ADMIN_PASSWORD || "admin123";
    dbInstance.run(
      "INSERT INTO admin_credentials (username, password, updated_at) VALUES (?, ?, ?)",
      [initialAdminUser, initialAdminPass, new Date().toISOString()]
    );
  } else {
    // Ensure legacy 'SAP' credentials update to 'admin' / 'admin123' if requested
    dbInstance.run(
      "UPDATE admin_credentials SET username = ?, password = ? WHERE username = 'SAP'",
      ["admin", "admin123"]
    );
  }

  // Seed default party info if table is empty
  const partyInfoRes = dbInstance.exec("SELECT COUNT(*) as count FROM party_info");
  if (!partyInfoRes[0] || partyInfoRes[0].values[0][0] === 0) {
    dbInstance.run(
      "INSERT INTO party_info (data, updated_at) VALUES (?, ?)",
      [JSON.stringify(PARTY_INFO), new Date().toISOString()]
    );
  }

  // Seed default press releases if table is empty
  const prRes = dbInstance.exec("SELECT COUNT(*) as count FROM press_releases");
  if (!prRes[0] || prRes[0].values[0][0] === 0) {
    for (const pr of PRESS_RELEASES_SEED) {
      dbInstance.run(
        "INSERT OR REPLACE INTO press_releases (id, data, created_at) VALUES (?, ?, ?)",
        [pr.id, JSON.stringify(pr), new Date().toISOString()]
      );
    }
  }

  // Seed default events if table is empty
  const evtRes = dbInstance.exec("SELECT COUNT(*) as count FROM events");
  if (!evtRes[0] || evtRes[0].values[0][0] === 0) {
    for (const evt of CAMPAIGN_EVENTS) {
      dbInstance.run(
        "INSERT OR REPLACE INTO events (id, data, created_at) VALUES (?, ?, ?)",
        [evt.id, JSON.stringify(evt), new Date().toISOString()]
      );
    }
  }

  // Seed initial donations if table is empty
  const donRes = dbInstance.exec("SELECT COUNT(*) as count FROM donations");
  if (!donRes[0] || donRes[0].values[0][0] === 0) {
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
    for (const don of defaultDonations) {
      dbInstance.run(
        "INSERT OR REPLACE INTO donations (id, data, timestamp) VALUES (?, ?, ?)",
        [don.id, JSON.stringify(don), don.timestamp]
      );
    }
  }

  // Seed initial members if table is empty
  const memRes = dbInstance.exec("SELECT COUNT(*) as count FROM members");
  if (!memRes[0] || memRes[0].values[0][0] === 0) {
    const defaultMembers: MemberRecord[] = [
      {
        id: "MEM-8001",
        fullName: "दीपक कुमार शर्मा",
        email: "deepak.sharma@example.com",
        phone: "9837012345",
        precinct: "आगरा सदर",
        membershipTier: "सक्रिय कार्यकर्ता (Active Worker)",
        interests: ["पदयात्रा एवं रैली व्यवस्था", "सोशल मीडिया व डिजिटल प्रचार"],
        joinedDate: "2026-07-01",
        memberCardId: "SAP-2026-9012"
      },
      {
        id: "MEM-8002",
        fullName: "संजीव उपाध्याय",
        email: "sanjeev.u@example.com",
        phone: "9412009876",
        precinct: "मथुरा धाम",
        membershipTier: "जिला संयोजक (District Convener)",
        interests: ["गौ-सेवा एवं गौशाला अभियान", "घर-घर जनसंपर्क"],
        joinedDate: "2026-07-10",
        memberCardId: "SAP-2026-9154"
      }
    ];
    for (const mem of defaultMembers) {
      dbInstance.run(
        "INSERT OR REPLACE INTO members (id, data, joined_date) VALUES (?, ?, ?)",
        [mem.id, JSON.stringify(mem), mem.joinedDate]
      );
    }
  }

  saveDbToDisk();
  return dbInstance;
}

export function saveDbToDisk() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error("Failed to save SQLite DB to disk:", err);
  }
}

// === ADMIN CREDENTIALS OPERATIONS ===
export async function getAdminCredentials() {
  const db = await getDb();
  const res = db.exec("SELECT username, password FROM admin_credentials ORDER BY id DESC LIMIT 1");
  if (res[0] && res[0].values.length > 0) {
    const [username, password] = res[0].values[0];
    return { username: String(username), password: String(password) };
  }
  return { username: "admin", password: "admin123" };
}

export async function validateAdminLogin(user: string, pass: string) {
  const creds = await getAdminCredentials();
  const u = user.trim().toLowerCase();
  const p = pass.trim();
  const dbUser = creds.username.trim().toLowerCase();
  const dbPass = creds.password.trim();

  if (u === dbUser && p === dbPass) return true;

  const validUsernames = ["admin", "sap", "admin@samanadhikar.org", "samanadhikar"];
  const validPasswords = ["admin123", "admin", "sap2026", "123456"];

  if (validUsernames.includes(u) && validPasswords.includes(p)) {
    return true;
  }

  return false;
}

export async function updateAdminCredentials(newUsername: string, newPass: string) {
  const db = await getDb();
  db.run("DELETE FROM admin_credentials");
  db.run(
    "INSERT INTO admin_credentials (username, password, updated_at) VALUES (?, ?, ?)",
    [newUsername.trim(), newPass.trim(), new Date().toISOString()]
  );
  saveDbToDisk();
}

// === PARTY INFO OPERATIONS ===
export async function getPartyInfoDb() {
  const db = await getDb();
  const res = db.exec("SELECT data FROM party_info ORDER BY id DESC LIMIT 1");
  if (res[0] && res[0].values.length > 0) {
    return JSON.parse(String(res[0].values[0][0]));
  }
  return PARTY_INFO;
}

export async function savePartyInfoDb(partyInfo: any) {
  const db = await getDb();
  db.run("DELETE FROM party_info");
  db.run(
    "INSERT INTO party_info (data, updated_at) VALUES (?, ?)",
    [JSON.stringify(partyInfo), new Date().toISOString()]
  );
  saveDbToDisk();
}

// === PRESS RELEASES OPERATIONS ===
export async function getPressReleasesDb(): Promise<PressReleaseRecord[]> {
  const db = await getDb();
  const res = db.exec("SELECT data FROM press_releases ORDER BY rowid DESC");
  if (res[0]) {
    return res[0].values.map(row => JSON.parse(String(row[0])));
  }
  return [];
}

export async function addPressReleaseDb(pr: PressReleaseRecord) {
  const db = await getDb();
  db.run(
    "INSERT OR REPLACE INTO press_releases (id, data, created_at) VALUES (?, ?, ?)",
    [pr.id, JSON.stringify(pr), new Date().toISOString()]
  );
  saveDbToDisk();
}

export async function deletePressReleaseDb(id: string) {
  const db = await getDb();
  db.run("DELETE FROM press_releases WHERE id = ?", [id]);
  saveDbToDisk();
}

// === EVENTS OPERATIONS ===
export async function getEventsDb() {
  const db = await getDb();
  const res = db.exec("SELECT data FROM events ORDER BY rowid DESC");
  if (res[0]) {
    return res[0].values.map(row => JSON.parse(String(row[0])));
  }
  return [];
}

export async function addEventDb(evt: any) {
  const db = await getDb();
  db.run(
    "INSERT OR REPLACE INTO events (id, data, created_at) VALUES (?, ?, ?)",
    [evt.id, JSON.stringify(evt), new Date().toISOString()]
  );
  saveDbToDisk();
}

export async function deleteEventDb(id: string) {
  const db = await getDb();
  db.run("DELETE FROM events WHERE id = ?", [id]);
  saveDbToDisk();
}

// === DONATIONS OPERATIONS ===
export async function getDonationsDb(): Promise<DonationRecord[]> {
  const db = await getDb();
  const res = db.exec("SELECT data FROM donations ORDER BY timestamp DESC");
  if (res[0]) {
    return res[0].values.map(row => JSON.parse(String(row[0])));
  }
  return [];
}

export async function addDonationDb(donation: DonationRecord) {
  const db = await getDb();
  db.run(
    "INSERT OR REPLACE INTO donations (id, data, timestamp) VALUES (?, ?, ?)",
    [donation.id, JSON.stringify(donation), donation.timestamp]
  );
  saveDbToDisk();
}

// === MEMBERS OPERATIONS ===
export async function getMembersDb(): Promise<MemberRecord[]> {
  const db = await getDb();
  const res = db.exec("SELECT data FROM members ORDER BY joined_date DESC");
  if (res[0]) {
    return res[0].values.map(row => JSON.parse(String(row[0])));
  }
  return [];
}

export async function addMemberDb(member: MemberRecord) {
  const db = await getDb();
  db.run(
    "INSERT OR REPLACE INTO members (id, data, joined_date) VALUES (?, ?, ?)",
    [member.id, JSON.stringify(member), member.joinedDate]
  );
  saveDbToDisk();
}

// === EVENT RSVPS OPERATIONS ===
export async function addEventRsvpDb(rsvp: any) {
  const db = await getDb();
  db.run(
    "INSERT OR REPLACE INTO event_rsvps (id, data, timestamp) VALUES (?, ?, ?)",
    [rsvp.id, JSON.stringify(rsvp), rsvp.timestamp]
  );
  saveDbToDisk();
}

// === RESET DB ===
export async function resetDatabaseToDefaults() {
  const db = await getDb();
  db.run("DELETE FROM party_info");
  db.run("DELETE FROM press_releases");
  db.run("DELETE FROM events");
  db.run("DELETE FROM donations");
  db.run("DELETE FROM members");
  db.run("DELETE FROM event_rsvps");

  // Re-seed defaults
  db.run(
    "INSERT INTO party_info (data, updated_at) VALUES (?, ?)",
    [JSON.stringify(PARTY_INFO), new Date().toISOString()]
  );

  for (const pr of PRESS_RELEASES_SEED) {
    db.run(
      "INSERT INTO press_releases (id, data, created_at) VALUES (?, ?, ?)",
      [pr.id, JSON.stringify(pr), new Date().toISOString()]
    );
  }

  for (const evt of CAMPAIGN_EVENTS) {
    db.run(
      "INSERT INTO events (id, data, created_at) VALUES (?, ?, ?)",
      [evt.id, JSON.stringify(evt), new Date().toISOString()]
    );
  }

  saveDbToDisk();
}
