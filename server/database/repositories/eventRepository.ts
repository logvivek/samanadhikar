import { CONFIG } from "../../config";
import { EventRecord, EventRsvpRecord } from "../../types";
import { initDatabase, persistDatabase } from "../connection";

/**
 * Ensures max active records constraint (auto-archives excess)
 */
export function autoArchiveExcessEvents(): void {
  const db = initDatabase();
  if (db.events.length > CONFIG.MAX_ACTIVE_RECORDS) {
    db.events.sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));
    const excess = db.events.slice(CONFIG.MAX_ACTIVE_RECORDS);
    db.events = db.events.slice(0, CONFIG.MAX_ACTIVE_RECORDS);

    for (const evt of excess) {
      db.archivedEvents.unshift({
        ...evt,
        archivedAt: evt.archivedAt || new Date().toISOString()
      });
    }
    persistDatabase();
  }
}

export async function getEvents(limit: number = CONFIG.MAX_ACTIVE_RECORDS): Promise<EventRecord[]> {
  const db = initDatabase();
  return db.events.slice(0, limit);
}

export async function getArchivedEvents(): Promise<EventRecord[]> {
  const db = initDatabase();
  return db.archivedEvents;
}

export async function addEvent(evt: EventRecord): Promise<void> {
  const db = initDatabase();
  const existingIdx = db.events.findIndex(e => e.id === evt.id);
  if (existingIdx >= 0) {
    db.events[existingIdx] = evt;
  } else {
    db.events.unshift(evt);
  }
  autoArchiveExcessEvents();
  persistDatabase();
}

export async function archiveEvent(id: string): Promise<boolean> {
  const db = initDatabase();
  const idx = db.events.findIndex(e => e.id === id);
  if (idx === -1) return false;

  const [item] = db.events.splice(idx, 1);
  item.archivedAt = new Date().toISOString();
  db.archivedEvents.unshift(item);
  persistDatabase();
  return true;
}

export async function restoreEventFromArchive(id: string): Promise<boolean> {
  const db = initDatabase();
  const idx = db.archivedEvents.findIndex(e => e.id === id);
  if (idx === -1) return false;

  const [item] = db.archivedEvents.splice(idx, 1);
  delete item.archivedAt;
  db.events.unshift(item);
  autoArchiveExcessEvents();
  persistDatabase();
  return true;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const db = initDatabase();
  const beforeLen1 = db.events.length;
  const beforeLen2 = db.archivedEvents.length;
  db.events = db.events.filter(e => e.id !== id);
  db.archivedEvents = db.archivedEvents.filter(e => e.id !== id);
  const changed = db.events.length !== beforeLen1 || db.archivedEvents.length !== beforeLen2;
  if (changed) persistDatabase();
  return changed;
}

// === EVENT RSVPS ===
export async function getEventRsvps(): Promise<EventRsvpRecord[]> {
  const db = initDatabase();
  return db.eventRsvps;
}

export async function addEventRsvp(rsvp: EventRsvpRecord): Promise<void> {
  const db = initDatabase();
  db.eventRsvps.unshift(rsvp);
  // Increment RSVP count on event
  const evt = db.events.find(e => e.id === rsvp.eventId);
  if (evt) {
    evt.rsvpCount = (evt.rsvpCount || 0) + rsvp.guestsCount;
  }
  persistDatabase();
}
