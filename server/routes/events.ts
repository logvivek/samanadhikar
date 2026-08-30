import { Router } from "express";
import {
  getEvents,
  getArchivedEvents,
  addEvent,
  archiveEvent,
  restoreEventFromArchive,
  deleteEvent,
  addEventRsvp,
  getEventRsvps
} from "../database/repositories/eventRepository";
import { verifyAdmin } from "../middleware/auth";
import { mutationLimiter } from "../middleware/rateLimiter";
import { extractAndSaveBase64Image } from "../services/uploadService";
import { CONFIG } from "../config";
import { EventRecord, EventRsvpRecord } from "../types";

export const eventsRouter = Router();

// GET /api/events
eventsRouter.get("/", async (_req, res) => {
  try {
    const events = await getEvents(CONFIG.MAX_ACTIVE_RECORDS);
    const archived = await getArchivedEvents();
    return res.json({
      success: true,
      count: events.length,
      archivedCount: archived.length,
      maxActiveLimit: CONFIG.MAX_ACTIVE_RECORDS,
      events
    });
  } catch (err: any) {
    console.error("Fetch events error:", err);
    return res.status(500).json({ success: false, error: "आयोजन सूची प्राप्त करने में त्रुटि।" });
  }
});

// GET /api/events/archive
eventsRouter.get("/archive", async (_req, res) => {
  try {
    const archivedEvents = await getArchivedEvents();
    return res.json({
      success: true,
      count: archivedEvents.length,
      archivedEvents
    });
  } catch (err: any) {
    console.error("Fetch archived events error:", err);
    return res.status(500).json({ success: false, error: "अभिलेखागार आयोजन प्राप्त करने में त्रुटि।" });
  }
});

// POST /api/events/archive/:id
eventsRouter.post("/archive/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await archiveEvent(id);
    if (ok) {
      return res.json({ success: true, message: "आयोजन सफलतापूर्वक संग्रहित (Archived) कर दिया गया।" });
    }
    return res.status(404).json({ success: false, error: "आयोजन नहीं मिला।" });
  } catch (err: any) {
    console.error("Archive event error:", err);
    return res.status(500).json({ success: false, error: "आयोजन संग्रहित करने में त्रुटि।" });
  }
});

// POST /api/events/restore/:id
eventsRouter.post("/restore/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await restoreEventFromArchive(id);
    if (ok) {
      return res.json({ success: true, message: "आयोजन पुनः सक्रिय सूची में पुनर्स्थापित (Restored) हो गया।" });
    }
    return res.status(404).json({ success: false, error: "संग्रहित आयोजन नहीं मिला।" });
  } catch (err: any) {
    console.error("Restore event error:", err);
    return res.status(500).json({ success: false, error: "आयोजन पुनर्स्थापित करने में त्रुटि।" });
  }
});

// POST /api/events
eventsRouter.post("/", verifyAdmin, mutationLimiter, async (req, res) => {
  try {
    const {
      title,
      titleHi,
      date,
      time,
      locationName,
      address,
      cityState,
      precinctDistrict,
      description,
      descriptionHi,
      type,
      category,
      featuredSpeakers,
      imageUrl,
      capacity,
      isVirtual,
      virtualLink
    } = req.body;

    if (!title || !date || (!locationName && !address)) {
      return res.status(400).json({ success: false, error: "शीर्षक, दिनांक और स्थान आवश्यक हैं।" });
    }

    const sanitizedImageUrl = extractAndSaveBase64Image(imageUrl) || "/images/gou_mata.jpg";

    const newEvent: EventRecord = {
      id: `EVT-${Date.now().toString().slice(-6)}`,
      title: String(title).trim(),
      titleHi: titleHi ? String(titleHi).trim() : String(title).trim(),
      date: String(date).trim(),
      displayDate: String(date).trim(),
      time: time ? String(time).trim() : "10:00 AM",
      locationName: locationName ? String(locationName).trim() : (address ? String(address).trim() : "आगरा HQ"),
      address: address ? String(address).trim() : "आगरा, उत्तर प्रदेश",
      cityState: cityState ? String(cityState).trim() : "उत्तर प्रदेश",
      precinctDistrict: precinctDistrict ? String(precinctDistrict).trim() : undefined,
      description: description ? String(description).trim() : String(title).trim(),
      descriptionHi: descriptionHi ? String(descriptionHi).trim() : undefined,
      type: type || "Rally",
      category: category || "Rally",
      featuredSpeakers: Array.isArray(featuredSpeakers) && featuredSpeakers.length > 0
        ? featuredSpeakers
        : ["कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)"],
      imageSeed: sanitizedImageUrl,
      rsvpCount: 0,
      capacity: capacity ? Number(capacity) : 5000,
      isVirtual: Boolean(isVirtual),
      virtualLink: virtualLink ? String(virtualLink).trim() : undefined
    };

    await addEvent(newEvent);
    const allActive = await getEvents(CONFIG.MAX_ACTIVE_RECORDS);
    const allArchived = await getArchivedEvents();

    return res.json({
      success: true,
      message: "नवीन कार्यक्रम सफलतापूर्वक सुरक्षित हुआ! (100 सक्रिय रिकॉर्ड सीमा लागू)",
      activeCount: allActive.length,
      archivedCount: allArchived.length,
      event: newEvent
    });
  } catch (err: any) {
    console.error("Add event error:", err);
    return res.status(500).json({ success: false, error: "कार्यक्रम जोड़ने में त्रुटि।" });
  }
});

// DELETE /api/events/:id
eventsRouter.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteEvent(id);
    return res.json({ success: true, message: "कार्यक्रम डेटाबेस से हटा दिया गया।" });
  } catch (err: any) {
    console.error("Delete event error:", err);
    return res.status(500).json({ success: false, error: "कार्यक्रम हटाने में त्रुटि।" });
  }
});

// POST /api/events/rsvp
eventsRouter.post("/rsvp", mutationLimiter, async (req, res) => {
  try {
    const { eventId, fullName, phone, email, guestsCount } = req.body;

    if (!eventId || !fullName || !phone) {
      return res.status(400).json({
        success: false,
        error: "कार्यक्रम ID, पूरा नाम और मोबाइल नंबर आवश्यक हैं।"
      });
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        error: "कृपया वैध 10-अंकीय मोबाइल नंबर दर्ज करें।"
      });
    }

    const events = await getEvents(CONFIG.MAX_ACTIVE_RECORDS);
    const matchedEvent = events.find(e => e.id === eventId);
    const eventTitle = matchedEvent ? matchedEvent.title : "समान अधिकार पार्टी सभा";

    const rsvp: EventRsvpRecord = {
      id: `RSVP-${Date.now().toString().slice(-6)}`,
      eventId: String(eventId),
      eventTitle,
      attendeeName: String(fullName).trim(),
      attendeeEmail: email ? String(email).trim() : `${cleanPhone}@rsvp.sap`,
      guestsCount: guestsCount ? Math.max(1, Number(guestsCount)) : 1,
      qrCodeToken: `QR-RSVP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      timestamp: new Date().toISOString()
    };

    await addEventRsvp(rsvp);

    return res.json({
      success: true,
      message: "कार्यक्रम हेतु आपकी उपस्थिति (RSVP) सफलतापूर्वक दर्ज कर ली गई है! धन्यवाद।",
      rsvp
    });
  } catch (err: any) {
    console.error("RSVP Error:", err);
    return res.status(500).json({ success: false, error: "RSVP दर्ज करने में तकनीकी त्रुटि।" });
  }
});

// GET /api/events/rsvps/all (Admin only)
eventsRouter.get("/rsvps/all", verifyAdmin, async (_req, res) => {
  try {
    const rsvps = await getEventRsvps();
    return res.json({ success: true, count: rsvps.length, rsvps });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "RSVP सूची प्राप्त करने में त्रुटि।" });
  }
});
