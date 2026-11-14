import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User
} from "firebase/auth";
import * as XLSX from "xlsx";
import firebaseConfig from "../../firebase-applet-config.json";
import { MemberRecord } from "../types";

export const GOOGLE_DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive.file"];
export const MEMBER_EXCEL_FILENAME = "member.xlsx";
export const MEMBER_EXCEL_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const DRIVE_LINK_STORAGE_KEY = "sap_member_google_drive_link";

export interface MemberExcelRow {
  MemberName: string;
  Mobilenumber: string;
  District: string;
  MemAmt: number;
  Date: string;
}

export interface DriveSyncResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  totalRows: number;
  addedRows: number;
}

// Initialize Firebase App once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
GOOGLE_DRIVE_SCOPES.forEach((scope) => provider.addScope(scope));

// Strictly in-memory OAuth access token cache (never persisted to localStorage/sessionStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initGoogleDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleDriveSignIn = async (): Promise<{
  user: User;
  accessToken: string;
}> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Google Drive access token प्राप्त नहीं हो सका।");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getCurrentGoogleUser = (): User | null => {
  return auth.currentUser;
};

export const googleDriveSignOut = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

/**
 * Extracts Google Drive File ID or Folder ID from a pasted Drive URL, if provided.
 */
export function parseGoogleDriveLink(url?: string | null): {
  type: "file" | "folder" | null;
  id: string | null;
} {
  if (!url || typeof url !== "string") return { type: null, id: null };
  const trimmed = url.trim();
  if (!trimmed) return { type: null, id: null };

  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]{10,})/);
  if (folderMatch) return { type: "folder", id: folderMatch[1] };

  const fileMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (fileMatch) return { type: "file", id: fileMatch[1] };

  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (idParamMatch) return { type: "file", id: idParamMatch[1] };

  return { type: null, id: null };
}

export function memberToExcelRow(member: Partial<MemberRecord>): MemberExcelRow {
  return {
    MemberName: String(member.fullName || "समान अधिकार पार्टी सदस्य").trim(),
    Mobilenumber: String(member.phone || "").trim(),
    District: String(member.precinct || member.stateDistrict || "उत्तर प्रदेश").trim(),
    MemAmt: Number(member.membershipFee ?? 0),
    Date: String(member.joinedDate || new Date().toISOString().split("T")[0]).trim()
  };
}

function normalizeRowKey(r: MemberExcelRow): string {
  return `${r.Mobilenumber.replace(/\D/g, "")}|${r.MemberName.toLowerCase().trim()}|${Number(r.MemAmt)}|${r.Date.trim()}`;
}

export function mergeMemberRows(
  existingRows: MemberExcelRow[],
  incomingRows: MemberExcelRow[]
): { merged: MemberExcelRow[]; addedCount: number } {
  const seen = new Set<string>();
  const merged: MemberExcelRow[] = [];

  for (const row of existingRows) {
    const clean: MemberExcelRow = {
      MemberName: String(row.MemberName || "").trim(),
      Mobilenumber: String(row.Mobilenumber || "").trim(),
      District: String(row.District || "").trim(),
      MemAmt: Number(row.MemAmt ?? 0),
      Date: String(row.Date || "").trim()
    };
    const key = normalizeRowKey(clean);
    if (!seen.has(key) && (clean.MemberName || clean.Mobilenumber)) {
      seen.add(key);
      merged.push(clean);
    }
  }

  let addedCount = 0;
  for (const row of incomingRows) {
    const clean: MemberExcelRow = {
      MemberName: String(row.MemberName || "").trim(),
      Mobilenumber: String(row.Mobilenumber || "").trim(),
      District: String(row.District || "").trim(),
      MemAmt: Number(row.MemAmt ?? 0),
      Date: String(row.Date || "").trim()
    };
    const key = normalizeRowKey(clean);
    if (!seen.has(key) && (clean.MemberName || clean.Mobilenumber)) {
      seen.add(key);
      merged.push(clean);
      addedCount += 1;
    }
  }

  return { merged, addedCount };
}

export function buildMembersWorkbookBuffer(rows: MemberExcelRow[]): ArrayBuffer {
  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: ["MemberName", "Mobilenumber", "District", "MemAmt", "Date"]
  });

  // Ensure exact column widths for clean readability in Excel / Google Sheets
  worksheet["!cols"] = [
    { wch: 28 },
    { wch: 16 },
    { wch: 24 },
    { wch: 12 },
    { wch: 14 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "member");
  const out = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return out as ArrayBuffer;
}

export function downloadMembersExcelLocally(rows: MemberExcelRow[]) {
  const buffer = buildMembersWorkbookBuffer(rows);
  const blob = new Blob([buffer], { type: MEMBER_EXCEL_MIME });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = MEMBER_EXCEL_FILENAME;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildMultipartBody(
  metadata: Record<string, unknown>,
  fileBuffer: ArrayBuffer,
  mimeType: string
): { body: Blob; contentType: string } {
  const boundary = `sap_drive_boundary_${Date.now()}`;
  const metadataPart =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`;
  const closing = `\r\n--${boundary}--`;

  const body = new Blob([metadataPart, fileBuffer, closing], {
    type: `multipart/related; boundary=${boundary}`
  });

  return {
    body,
    contentType: `multipart/related; boundary=${boundary}`
  };
}

/**
 * Finds or creates `member.xlsx` in Google Drive using the signed-in user's OAuth token,
 * downloads existing rows if present, appends new successful membership payment rows
 * without duplicates, and returns the live Google Drive `webViewLink`.
 */
export async function syncMembersToGoogleDrive(
  incomingRows: MemberExcelRow[],
  options: { targetDriveLink?: string } = {}
): Promise<DriveSyncResult> {
  const token = cachedAccessToken;
  if (!token) {
    throw new Error("Google Drive में रिकॉर्ड सेव करने के लिए कृपया पहले Sign in with Google करें।");
  }

  const parsedTarget = parseGoogleDriveLink(options.targetDriveLink);
  let targetFileId: string | null = parsedTarget.type === "file" ? parsedTarget.id : null;
  const targetFolderId: string | null = parsedTarget.type === "folder" ? parsedTarget.id : null;
  let existingLink: string | null = null;

  // 1. Verify target fileId if provided, otherwise search for `member.xlsx` created by app
  if (targetFileId) {
    const checkResp = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(targetFileId)}?fields=id,name,webViewLink,trashed`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!checkResp.ok) {
      targetFileId = null;
    } else {
      const meta = await checkResp.json();
      if (meta.trashed) {
        targetFileId = null;
      } else {
        existingLink = meta.webViewLink || null;
      }
    }
  }

  if (!targetFileId) {
    const qParts = [`name = '${MEMBER_EXCEL_FILENAME}'`, "trashed = false"];
    if (targetFolderId) {
      qParts.push(`'${targetFolderId}' in parents`);
    }
    const query = encodeURIComponent(qParts.join(" and "));
    const searchResp = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink,modifiedTime)&orderBy=modifiedTime desc`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (searchResp.status === 401) {
      cachedAccessToken = null;
      throw new Error("Google सत्र समाप्त हो गया है। कृपया पुनः Sign in with Google करें।");
    }

    if (searchResp.ok) {
      const searchData = await searchResp.json();
      const firstFile = Array.isArray(searchData.files) && searchData.files[0];
      if (firstFile?.id) {
        targetFileId = firstFile.id;
        existingLink = firstFile.webViewLink || null;
      }
    }
  }

  // 2. If `member.xlsx` already exists, read its current rows so we append safely
  let existingRows: MemberExcelRow[] = [];
  if (targetFileId) {
    const downloadResp = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(targetFileId)}?alt=media`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    if (downloadResp.ok) {
      const buf = await downloadResp.arrayBuffer();
      if (buf.byteLength > 0) {
        try {
          const wb = XLSX.read(buf, { type: "array" });
          const firstSheetName = wb.SheetNames[0];
          if (firstSheetName) {
            const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
              wb.Sheets[firstSheetName]
            );
            existingRows = rawRows.map((r) => ({
              MemberName: String(r.MemberName ?? r["Member Name"] ?? "").trim(),
              Mobilenumber: String(r.Mobilenumber ?? r["Mobile Number"] ?? r.Phone ?? "").trim(),
              District: String(r.District ?? "").trim(),
              MemAmt: Number(r.MemAmt ?? r.Amount ?? 0),
              Date: String(r.Date ?? "").trim()
            }));
          }
        } catch {
          // If file was blank/corrupt, overwrite cleanly with merged rows
          existingRows = [];
        }
      }
    }
  }

  const { merged, addedCount } = mergeMemberRows(existingRows, incomingRows);
  const workbookBuffer = buildMembersWorkbookBuffer(merged);

  // 3. Upload (PATCH if exists, POST if new)
  if (targetFileId) {
    const { body, contentType } = buildMultipartBody(
      { name: MEMBER_EXCEL_FILENAME, mimeType: MEMBER_EXCEL_MIME },
      workbookBuffer,
      MEMBER_EXCEL_MIME
    );

    const updateResp = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(targetFileId)}?uploadType=multipart&fields=id,name,webViewLink`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": contentType
        },
        body
      }
    );

    if (!updateResp.ok) {
      const errText = await updateResp.text().catch(() => "");
      throw new Error(`Google Drive अपडेट त्रुटि (${updateResp.status}): ${errText || "अपडेट विफल"}`);
    }

    const updated = await updateResp.json();
    const link = updated.webViewLink || existingLink || `https://drive.google.com/file/d/${updated.id}/view`;
    return {
      fileId: updated.id,
      fileName: updated.name || MEMBER_EXCEL_FILENAME,
      webViewLink: link,
      totalRows: merged.length,
      addedRows: addedCount
    };
  }

  // Create new member.xlsx in Google Drive
  const createMetadata: Record<string, unknown> = {
    name: MEMBER_EXCEL_FILENAME,
    mimeType: MEMBER_EXCEL_MIME
  };
  if (targetFolderId) {
    createMetadata.parents = [targetFolderId];
  }

  const { body, contentType } = buildMultipartBody(
    createMetadata,
    workbookBuffer,
    MEMBER_EXCEL_MIME
  );

  const createResp = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": contentType
      },
      body
    }
  );

  if (!createResp.ok) {
    const errText = await createResp.text().catch(() => "");
    throw new Error(`Google Drive फ़ाइल निर्माण त्रुटि (${createResp.status}): ${errText || "निर्माण विफल"}`);
  }

  const created = await createResp.json();
  const link = created.webViewLink || `https://drive.google.com/file/d/${created.id}/view`;
  return {
    fileId: created.id,
    fileName: created.name || MEMBER_EXCEL_FILENAME,
    webViewLink: link,
    totalRows: merged.length,
    addedRows: addedCount
  };
}
