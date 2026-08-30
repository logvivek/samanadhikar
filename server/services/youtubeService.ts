import { CONFIG } from "../config";
import { PressReleaseRecord } from "../types";
import { PRESS_RELEASES_SEED } from "../../src/data/campaignData";
import {
  getPressReleases,
  addPressRelease,
  deletePressRelease
} from "../database/repositories/pressRepository";

/**
 * Prunes active YouTube shorts to retain the most recent 7 items
 */
export async function pruneYouTubeShortsToLatest7(): Promise<void> {
  const allPRs = await getPressReleases(CONFIG.MAX_ACTIVE_RECORDS);
  const ytShorts = allPRs.filter((pr) =>
    pr.id.startsWith("pr-yt-") || pr.id.startsWith("seed-yt-")
  );

  ytShorts.sort((a, b) => {
    const dateA = new Date(a.date).getTime() || 0;
    const dateB = new Date(b.date).getTime() || 0;
    if (dateB !== dateA) return dateB - dateA;
    return b.id.localeCompare(a.id);
  });

  if (ytShorts.length > 7) {
    const excess = ytShorts.slice(7);
    for (const pr of excess) {
      await deletePressRelease(pr.id);
    }
  }
}

/**
 * Ensures seed shorts are synced and returns status
 */
export async function syncYouTubeShortsSeed(): Promise<{ addedCount: number; pressReleases: PressReleaseRecord[] }> {
  let pressReleases = await getPressReleases(CONFIG.MAX_ACTIVE_RECORDS);
  const existingIds = new Set(pressReleases.map((pr) => pr.id));
  let addedCount = 0;

  for (const pr of PRESS_RELEASES_SEED) {
    if (!existingIds.has(pr.id)) {
      await addPressRelease(pr as PressReleaseRecord);
      addedCount++;
    } else {
      const existing = pressReleases.find(p => p.id === pr.id);
      if (existing && existing.imageUrl !== pr.imageUrl) {
        await addPressRelease({ ...existing, imageUrl: pr.imageUrl });
      }
    }
  }

  await pruneYouTubeShortsToLatest7();
  pressReleases = await getPressReleases(CONFIG.MAX_ACTIVE_RECORDS);

  return {
    addedCount,
    pressReleases
  };
}

/**
 * Adds a new custom YouTube short and enforces the 7-shorts limit
 */
export async function syncYouTubeShortVideo(data: {
  videoUrl: string;
  title?: string;
  content?: string;
  category?: string;
}): Promise<PressReleaseRecord> {
  const customId = `pr-yt-${Date.now().toString().slice(-6)}`;
  const newShortPR: PressReleaseRecord = {
    id: customId,
    title: data.title || "नवीनतम यूट्यूब शॉट्स वीडियो | समान अधिकार पार्टी",
    titleEn: "Latest Official YouTube Short - Saman Adhikar Party",
    content: data.content || `समान अधिकार पार्टी के आधिकारिक यूट्यूब चैनल (@samanadhikarparty3851/shorts) से नवीनतम वीडियो कवरेज।\n\nयूट्यूब पर चैनल को सब्सक्राइब करें: https://www.youtube.com/@samanadhikarparty3851/shorts`,
    category: data.category || "Public Announcement",
    date: new Date().toISOString().split("T")[0],
    location: "आगरा HQ / यूट्यूब लाइव",
    spokesperson: "कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)",
    hasVideo: true,
    videoUrl: String(data.videoUrl).trim(),
    videoCaption: "आधिकारिक यूट्यूब शॉट्स (@samanadhikarparty3851)",
    imageUrl: "/images/gou_mata.jpg",
    isUrgent: true
  };

  await addPressRelease(newShortPR);
  await pruneYouTubeShortsToLatest7();
  return newShortPR;
}
