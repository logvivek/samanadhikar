import { Router } from "express";
import {
  getPressReleases,
  getArchivedPressReleases,
  addPressRelease,
  archivePressRelease,
  restorePressReleaseFromArchive,
  deletePressRelease
} from "../database/repositories/pressRepository";
import { verifyAdmin } from "../middleware/auth";
import { extractAndSaveBase64Image } from "../services/uploadService";
import { syncYouTubeShortsSeed, syncYouTubeShortVideo } from "../services/youtubeService";
import { CONFIG } from "../config";
import { PressReleaseRecord } from "../types";

export const pressRouter = Router();

// GET /api/press-releases or /api/press
pressRouter.get("/", async (_req, res) => {
  try {
    const { pressReleases } = await syncYouTubeShortsSeed();
    const archivedPRs = await getArchivedPressReleases();

    return res.json({
      success: true,
      count: pressReleases.length,
      archivedCount: archivedPRs.length,
      maxActiveLimit: CONFIG.MAX_ACTIVE_RECORDS,
      youtubeChannel: "https://www.youtube.com/@samanadhikarparty3851/shorts",
      pressReleases
    });
  } catch (err: any) {
    console.error("Fetch press releases error:", err);
    return res.status(500).json({ success: false, error: "प्रेस विज्ञप्ति प्राप्त करने में त्रुटि।" });
  }
});

// GET /api/press-releases/archive or /api/press/archive
pressRouter.get("/archive", async (_req, res) => {
  try {
    const archivedPressReleases = await getArchivedPressReleases();
    return res.json({
      success: true,
      count: archivedPressReleases.length,
      archivedPressReleases
    });
  } catch (err: any) {
    console.error("Fetch archived press releases error:", err);
    return res.status(500).json({ success: false, error: "अभिलेखागार प्राप्त करने में त्रुटि।" });
  }
});

// POST /api/press-releases/archive/:id
pressRouter.post("/archive/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await archivePressRelease(id);
    if (ok) {
      return res.json({ success: true, message: "प्रेस विज्ञप्ति सफलतापूर्वक संग्रहित (Archived) कर दी गई।" });
    }
    return res.status(404).json({ success: false, error: "प्रेस विज्ञप्ति नहीं मिली।" });
  } catch (err: any) {
    console.error("Archive press release error:", err);
    return res.status(500).json({ success: false, error: "प्रेस विज्ञप्ति संग्रहित करने में त्रुटि।" });
  }
});

// POST /api/press-releases/restore/:id
pressRouter.post("/restore/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await restorePressReleaseFromArchive(id);
    if (ok) {
      return res.json({ success: true, message: "प्रेस विज्ञप्ति अभिलेखागार से सक्रिय सूची में पुनर्स्थापित (Restored) हो गई।" });
    }
    return res.status(404).json({ success: false, error: "संग्रहित प्रेस विज्ञप्ति नहीं मिली।" });
  } catch (err: any) {
    console.error("Restore press release error:", err);
    return res.status(500).json({ success: false, error: "पुनर्स्थापित करने में त्रुटि।" });
  }
});

// POST /api/press-releases or /api/press
pressRouter.post("/", verifyAdmin, async (req, res) => {
  try {
    const {
      title,
      titleEn,
      content,
      contentEn,
      category,
      date,
      location,
      spokesperson,
      imageUrl,
      videoUrl,
      videoCaption,
      isUrgent
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, error: "शीर्षक (Title) आवश्यक है।" });
    }

    const finalContent = (content && String(content).trim().length > 0) ? String(content).trim() : String(title).trim();
    const hasVideo = Boolean(videoUrl && String(videoUrl).trim().length > 0);

    // Save any base64 image data to /uploads/ rather than bloating the database!
    const sanitizedImageUrl = extractAndSaveBase64Image(imageUrl) || "/images/gou_mata.jpg";

    const newPR: PressReleaseRecord = {
      id: `PR-${Date.now().toString().slice(-6)}`,
      title: String(title).trim(),
      titleEn: titleEn ? String(titleEn).trim() : "",
      content: finalContent,
      contentEn: contentEn ? String(contentEn).trim() : "",
      category: category || "Public Announcement",
      date: date || new Date().toISOString().split("T")[0],
      location: location || "आगरा / नई दिल्ली",
      spokesperson: spokesperson || "कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)",
      imageUrl: sanitizedImageUrl,
      hasVideo,
      videoUrl: videoUrl ? String(videoUrl).trim() : undefined,
      videoCaption: videoCaption ? String(videoCaption).trim() : undefined,
      isUrgent: Boolean(isUrgent)
    };

    await addPressRelease(newPR);
    const allActive = await getPressReleases(CONFIG.MAX_ACTIVE_RECORDS);
    const allArchived = await getArchivedPressReleases();

    return res.json({
      success: true,
      message: "प्रेस विज्ञप्ति सफलतापूर्वक सुरक्षित हो गई! (100 सक्रिय रिकॉर्ड सीमा लागू)",
      activeCount: allActive.length,
      archivedCount: allArchived.length,
      pressRelease: newPR
    });
  } catch (err: any) {
    console.error("Press Release Upload Error:", err);
    return res.status(500).json({ success: false, error: "प्रेस विज्ञप्ति अपलोड करने में त्रुटि।" });
  }
});

// DELETE /api/press-releases/:id
pressRouter.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await deletePressRelease(id);
    return res.json({ success: true, message: "प्रेस विज्ञप्ति डेटाबेस से हटा दी गई।" });
  } catch (err: any) {
    console.error("Delete press release error:", err);
    return res.status(500).json({ success: false, error: "प्रेस विज्ञप्ति हटाने में त्रुटि।" });
  }
});

// POST /api/press-releases/sync-youtube-shorts
pressRouter.post("/sync-youtube-shorts", async (req, res) => {
  try {
    const { videoUrl, title, content, category } = req.body || {};
    let addedCount = 0;

    const seedResult = await syncYouTubeShortsSeed();
    addedCount += seedResult.addedCount;

    if (videoUrl) {
      await syncYouTubeShortVideo({ videoUrl, title, content, category });
      addedCount++;
    }

    const pressReleases = await getPressReleases(CONFIG.MAX_ACTIVE_RECORDS);

    return res.json({
      success: true,
      addedCount,
      count: pressReleases.length,
      message: addedCount > 0
        ? `${addedCount} नया यूट्यूब शॉट्स वीडियो जोड़कर टॉप 7 लेटेस्ट शॉट्स सुरक्षित कर दिए गए हैं!`
        : "यूट्यूब चैनल (@samanadhikarparty3851) के नवीनतम 7 शॉट्स पहले से अपडेटेड हैं!",
      youtubeChannel: "https://www.youtube.com/@samanadhikarparty3851/shorts",
      pressReleases
    });
  } catch (err: any) {
    console.error("YouTube Shorts Sync Error:", err);
    return res.status(500).json({ success: false, error: "यूट्यूब शॉट्स सिंक करने में विफल।" });
  }
});
