import { CONFIG } from "../../config";
import { PressReleaseRecord } from "../../types";
import { initDatabase, persistDatabase } from "../connection";

/**
 * Ensures max active records constraint (auto-archives excess)
 */
export function autoArchiveExcessPressReleases(): void {
  const db = initDatabase();
  if (db.pressReleases.length > CONFIG.MAX_ACTIVE_RECORDS) {
    db.pressReleases.sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));
    const excess = db.pressReleases.slice(CONFIG.MAX_ACTIVE_RECORDS);
    db.pressReleases = db.pressReleases.slice(0, CONFIG.MAX_ACTIVE_RECORDS);

    for (const pr of excess) {
      db.archivedPressReleases.unshift({
        ...pr,
        archivedAt: pr.archivedAt || new Date().toISOString()
      });
    }
    persistDatabase();
  }
}

export async function getPressReleases(limit: number = CONFIG.MAX_ACTIVE_RECORDS): Promise<PressReleaseRecord[]> {
  const db = initDatabase();
  return db.pressReleases.slice(0, limit);
}

export async function getArchivedPressReleases(): Promise<PressReleaseRecord[]> {
  const db = initDatabase();
  return db.archivedPressReleases;
}

export async function addPressRelease(pr: PressReleaseRecord): Promise<void> {
  const db = initDatabase();
  const existingIdx = db.pressReleases.findIndex(p => p.id === pr.id);
  if (existingIdx >= 0) {
    db.pressReleases[existingIdx] = pr;
  } else {
    db.pressReleases.unshift(pr);
  }
  autoArchiveExcessPressReleases();
  persistDatabase();
}

export async function archivePressRelease(id: string): Promise<boolean> {
  const db = initDatabase();
  const idx = db.pressReleases.findIndex(p => p.id === id);
  if (idx === -1) return false;

  const [item] = db.pressReleases.splice(idx, 1);
  item.archivedAt = new Date().toISOString();
  db.archivedPressReleases.unshift(item);
  persistDatabase();
  return true;
}

export async function restorePressReleaseFromArchive(id: string): Promise<boolean> {
  const db = initDatabase();
  const idx = db.archivedPressReleases.findIndex(p => p.id === id);
  if (idx === -1) return false;

  const [item] = db.archivedPressReleases.splice(idx, 1);
  delete item.archivedAt;
  db.pressReleases.unshift(item);
  autoArchiveExcessPressReleases();
  persistDatabase();
  return true;
}

export async function deletePressRelease(id: string): Promise<boolean> {
  const db = initDatabase();
  const beforeLen1 = db.pressReleases.length;
  const beforeLen2 = db.archivedPressReleases.length;
  db.pressReleases = db.pressReleases.filter(p => p.id !== id);
  db.archivedPressReleases = db.archivedPressReleases.filter(p => p.id !== id);
  const changed = db.pressReleases.length !== beforeLen1 || db.archivedPressReleases.length !== beforeLen2;
  if (changed) persistDatabase();
  return changed;
}
