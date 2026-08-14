import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import {
  getDb,
  validateAdminLogin,
  getAdminCredentials,
  updateAdminCredentials,
  getPartyInfoDb,
  savePartyInfoDb,
  getPressReleasesDb,
  addPressReleaseDb,
  deletePressReleaseDb,
  getEventsDb,
  addEventDb,
  deleteEventDb,
  getDonationsDb,
  addDonationDb,
  getMembersDb,
  addMemberDb,
  addEventRsvpDb,
  resetDatabaseToDefaults,
  PressReleaseRecord,
  DonationRecord,
  MemberRecord
} from "./src/db";
import { PRESS_RELEASES_SEED } from "./src/data/campaignData";

const __dirname = process.cwd();

// Lazy Gemini client helper
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}

async function startServer() {
  // Initialize Lite DB
  await getDb();

  const app = express();
  const PORT = 3000;

  // Support JSON and large Base64 image payload uploads for press releases
  app.use(express.json({ limit: "25mb" }));

  // === ADMIN AUTHENTICATION ===
  const ADMIN_SECRET_TOKEN = "sap-admin-token-2026-secure";

  // Helper middleware to check Admin Authorization
  const verifyAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const adminToken = req.headers["x-admin-token"] || (req.headers.authorization && req.headers.authorization.replace("Bearer ", ""));
    if (adminToken === ADMIN_SECRET_TOKEN) {
      return next();
    }
    return res.status(401).json({
      success: false,
      error: "केवल अधिकृत एडमिन (Admin) ही समाचार व प्रेस विज्ञप्ति अपलोड अथवा हटा सकते हैं। कृपया एडमिन लॉगिन करें।"
    });
  };

  // ADMIN LOGIN (Validates username & password against Lite DB)
  app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: "यूज़रनेम और पासवर्ड दोनों आवश्यक हैं।" });
    }

    const isValid = await validateAdminLogin(String(username), String(password));
    if (isValid) {
      const creds = await getAdminCredentials();
      return res.json({
        success: true,
        token: ADMIN_SECRET_TOKEN,
        message: "एडमिन लॉगिन सफल!",
        username: creds.username
      });
    }

    return res.status(401).json({
      success: false,
      error: "अवैध एडमिन यूज़रनेम या पासवर्ड।"
    });
  });

  // ADMIN VERIFY TOKEN
  app.get("/api/admin/verify", async (req, res) => {
    const adminToken = req.headers["x-admin-token"] || (req.headers.authorization && req.headers.authorization.replace("Bearer ", ""));
    if (adminToken === ADMIN_SECRET_TOKEN) {
      const creds = await getAdminCredentials();
      return res.json({ success: true, isAdmin: true, username: creds.username });
    }
    return res.json({ success: false, isAdmin: false });
  });

  // CHANGE ADMIN USERNAME / PASSWORD IN LITE DB
  app.post("/api/admin/change-credentials", verifyAdmin, async (req, res) => {
    try {
      const { currentPassword, newUsername, newPassword } = req.body;
      if (!currentPassword || !newUsername || !newPassword) {
        return res.status(400).json({ error: "वर्तमान पासवर्ड, नया यूज़रनेम और नया पासवर्ड आवश्यक हैं।" });
      }

      const creds = await getAdminCredentials();
      if (currentPassword.trim() !== creds.password) {
        return res.status(401).json({ error: "वर्तमान पासवर्ड अमान्य/गलत है।" });
      }

      if (newUsername.trim().length < 3) {
        return res.status(400).json({ error: "यूज़रनेम कम से कम 3 अक्षरों का होना चाहिए।" });
      }

      if (newPassword.trim().length < 4) {
        return res.status(400).json({ error: "नया पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।" });
      }

      await updateAdminCredentials(newUsername.trim(), newPassword.trim());

      return res.json({
        success: true,
        message: "एडमिन यूज़रनेम एवं पासवर्ड डेटाबेस (Lite DB) में सफलतापूर्वक अपडेट हो गए!",
        username: newUsername.trim()
      });
    } catch (err: any) {
      console.error("Change credentials error:", err);
      return res.status(500).json({ error: "एडमिन यूज़रनेम/पासवर्ड अपडेट में त्रुटि।" });
    }
  });

  // === API ENDPOINTS ===

  // 0. PARTY INFO CUSTOMIZATION API
  app.get("/api/party-info", async (req, res) => {
    const partyInfo = await getPartyInfoDb();
    res.json({
      success: true,
      partyInfo
    });
  });

  app.post("/api/party-info", verifyAdmin, async (req, res) => {
    try {
      const current = await getPartyInfoDb();
      const updated = { ...current, ...req.body };
      await savePartyInfoDb(updated);

      return res.json({
        success: true,
        message: "पार्टी जानकारी डेटाबेस (Lite DB) में सफलतापूर्वक अपडेट हो गई!",
        partyInfo: updated
      });
    } catch (err: any) {
      console.error("Party Info Update Error:", err);
      return res.status(500).json({ error: "पार्टी जानकारी अपडेट में त्रुटि।" });
    }
  });

  // EVENTS API
  app.get("/api/events", async (req, res) => {
    const events = await getEventsDb();
    res.json({
      success: true,
      count: events.length,
      events
    });
  });

  app.post("/api/events", verifyAdmin, async (req, res) => {
    try {
      const { title, titleHi, type, category, date, displayDate, time, locationName, address, description, featuredSpeakers, isVirtual, capacity, precinctDistrict } = req.body;
      
      const eventType = type || category || "Rally";
      const formattedDate = date || new Date().toISOString().split("T")[0];
      
      let formattedDisplayDate = displayDate;
      if (!formattedDisplayDate && formattedDate) {
        try {
          formattedDisplayDate = new Date(formattedDate).toLocaleDateString("hi-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
          });
        } catch {
          formattedDisplayDate = formattedDate;
        }
      }

      let parsedSpeakers: string[] = ["कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)"];
      if (Array.isArray(featuredSpeakers) && featuredSpeakers.length > 0) {
        parsedSpeakers = featuredSpeakers;
      } else if (typeof featuredSpeakers === "string" && featuredSpeakers.trim()) {
        parsedSpeakers = featuredSpeakers.split(",").map(s => s.trim()).filter(Boolean);
      }

      const newEvt = {
        id: `evt-${Date.now()}`,
        title: title || titleHi || "समान अधिकार पार्टी सभा",
        titleHi: titleHi || title || "समान अधिकार पार्टी सभा",
        type: eventType,
        category: eventType,
        date: formattedDate,
        displayDate: formattedDisplayDate || formattedDate,
        time: time || "सायं 4:00 बजे से",
        locationName: locationName || "आगरा HQ",
        address: address || locationName || "आगरा",
        cityState: "उत्तर प्रदेश",
        precinctDistrict: precinctDistrict || "आगरा-मथुरा मण्डल",
        description: description || "समान अधिकार पार्टी का विशाल जन-समारोह।",
        isVirtual: Boolean(isVirtual),
        capacity: capacity || 10000,
        rsvpCount: 0,
        featuredSpeakers: parsedSpeakers
      };

      await addEventDb(newEvt);
      return res.json({ success: true, message: "कार्यक्रम डेटाबेस में सफलतापूर्वक प्रकाशित!", event: newEvt });
    } catch (err) {
      console.error("Add event error:", err);
      return res.status(500).json({ error: "कार्यक्रम जोड़ने में विफल।" });
    }
  });

  app.delete("/api/events/:id", verifyAdmin, async (req, res) => {
    const { id } = req.params;
    await deleteEventDb(id);
    return res.json({ success: true, message: "कार्यक्रम डेटाबेस से हटा दिया गया।" });
  });

  // ADMIN RESET API
  app.post("/api/admin/reset", verifyAdmin, async (req, res) => {
    await resetDatabaseToDefaults();
    return res.json({ success: true, message: "समस्त डेटाबेस (Lite DB) मूल डिफ़ॉल्ट स्थिति में रीसेट हो गया है।" });
  });

  // Helper function to prune seed YouTube Shorts to keep strictly the latest 7
  async function pruneYouTubeShortsToLatest7() {
    const allPRs = await getPressReleasesDb();
    // Only prune seed / auto-synced YouTube shorts (id starting with pr-yt- or seed-yt-), NEVER delete user-created PRs (PR-...)
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
        await deletePressReleaseDb(pr.id);
      }
    }
  }

  // 1. PRESS RELEASES & YOUTUBE SHORTS API
  app.get("/api/press-releases", async (req, res) => {
    let pressReleases = await getPressReleasesDb();
    
    // Auto-sync seed YouTube Shorts if missing or image updated in database
    for (const seedPR of PRESS_RELEASES_SEED) {
      const existingPR = pressReleases.find((p) => p.id === seedPR.id);
      if (!existingPR) {
        await addPressReleaseDb(seedPR);
      } else if (existingPR.imageUrl !== seedPR.imageUrl) {
        await addPressReleaseDb({ ...existingPR, imageUrl: seedPR.imageUrl });
      }
    }

    // Strictly enforce keeping latest 7 YouTube Shorts
    await pruneYouTubeShortsToLatest7();
    pressReleases = await getPressReleasesDb();

    res.json({
      success: true,
      count: pressReleases.length,
      youtubeChannel: "https://www.youtube.com/@samanadhikarparty3851/shorts",
      pressReleases
    });
  });

  // AUTO-SYNC YOUTUBE SHORTS API
  app.post("/api/sync-youtube-shorts", async (req, res) => {
    try {
      let pressReleases = await getPressReleasesDb();
      const existingIds = new Set(pressReleases.map((pr) => pr.id));
      let addedCount = 0;

      // Ensure all seed YouTube Shorts are in DB
      for (const pr of PRESS_RELEASES_SEED) {
        if (!existingIds.has(pr.id)) {
          await addPressReleaseDb(pr);
          addedCount++;
        }
      }

      // If a custom new video URL or ID is passed in request body
      const { videoUrl, title, content, category } = req.body || {};
      if (videoUrl) {
        const customId = `pr-yt-${Date.now().toString().slice(-6)}`;
        const newShortPR: PressReleaseRecord = {
          id: customId,
          title: title || "नवीनतम यूट्यूब शॉट्स वीडियो | समान अधिकार पार्टी",
          titleEn: "Latest Official YouTube Short - Saman Adhikar Party",
          content: content || `समान अधिकार पार्टी के आधिकारिक यूट्यूब चैनल (@samanadhikarparty3851/shorts) से नवीनतम वीडियो कवरेज।\n\nयूट्यूब पर चैनल को सब्सक्राइब करें: https://www.youtube.com/@samanadhikarparty3851/shorts`,
          category: category || "Public Announcement",
          date: new Date().toISOString().split("T")[0],
          location: "आगरा HQ / यूट्यूब लाइव",
          spokesperson: "कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)",
          hasVideo: true,
          videoUrl: videoUrl.trim(),
          videoCaption: "आधिकारिक यूट्यूब शॉट्स (@samanadhikarparty3851)",
          imageUrl: "/images/gou_mata.jpg",
          isUrgent: true
        };
        await addPressReleaseDb(newShortPR);
        addedCount++;
      }

      // Prune to ensure only top 7 latest YouTube Shorts remain
      await pruneYouTubeShortsToLatest7();
      pressReleases = await getPressReleasesDb();

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
      return res.status(500).json({ error: "यूट्यूब शॉट्स सिंक करने में विफल।" });
    }
  });

  app.post("/api/press-releases", verifyAdmin, async (req, res) => {
    try {
      const { title, titleEn, content, contentEn, category, date, location, spokesperson, imageUrl, videoUrl, videoCaption, isUrgent } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: "शीर्षक (Title) आवश्यक है।" });
      }

      const finalContent = (content && content.trim().length > 0) ? content.trim() : title.trim();
      const hasVideo = Boolean(videoUrl && videoUrl.trim().length > 0);

      const newPR: PressReleaseRecord = {
        id: `PR-${Date.now().toString().slice(-6)}`,
        title: title.trim(),
        titleEn: titleEn ? titleEn.trim() : "",
        content: finalContent,
        contentEn: contentEn ? contentEn.trim() : "",
        category: category || "Public Announcement",
        date: date || new Date().toISOString().split("T")[0],
        location: location || "आगरा / नई दिल्ली",
        spokesperson: spokesperson || "कुलदीप शर्मा (राष्ट्रीय अध्यक्ष)",
        imageUrl: imageUrl || "/images/gou_mata.jpg",
        hasVideo,
        videoUrl: videoUrl ? videoUrl.trim() : undefined,
        videoCaption: videoCaption ? videoCaption.trim() : undefined,
        isUrgent: Boolean(isUrgent)
      };

      await addPressReleaseDb(newPR);

      return res.json({
        success: true,
        message: "प्रेस विज्ञप्ति डेटाबेस (Lite DB) में सफलतापूर्वक सुरक्षित हो गई!",
        pressRelease: newPR
      });
    } catch (err: any) {
      console.error("Press Release Upload Error:", err);
      return res.status(500).json({ error: "प्रेस विज्ञप्ति अपलोड करने में त्रुटि।" });
    }
  });

  app.delete("/api/press-releases/:id", verifyAdmin, async (req, res) => {
    const { id } = req.params;
    await deletePressReleaseDb(id);
    return res.json({ success: true, message: "प्रेस विज्ञप्ति डेटाबेस से हटा दी गई।" });
  });

  // 2. AI CAMPAIGN ASSISTANT ROUTE (Saman Adhikar Party)
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;

      if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ error: "Message prompt is required" });
      }

      const cleanMessage = message.trim();

      // System instruction for Gemini model
      const systemInstruction = `You are "Saman Adhikar Party AI Assistant" (समान अधिकार पार्टी एआई सहायक), the official AI spokesperson for Saman Adhikar Party (समान अधिकार पार्टी).
National President: Kuldeep Sharma (राष्ट्रीय अध्यक्ष: कुलदीप शर्मा जी).
Helpline / Contact numbers: 9412165541, 7310732088.
Slogans: "तुम मेरा साथ दो, मैं तुम्हें हिन्दू राष्ट्र दूंगा", "समान अधिकार लाना है, श्रेष्ठ भारत बनाना है!"

Core 5 Agendas & Ideology:
1. Abolish Reservation System (आरक्षण प्रणाली पूरी तरह खत्म कर केवल योग्यता व आर्थिक आवश्यकता के आधार पर अधिकार)
2. Declare India a Hindu Rashtra (भारत को संवैधानिक हिंदू राष्ट्र घोषित करना व सनातन धर्म का संरक्षण)
3. Implement Population Control Law (देशहित में सभी नागरिकों हेतु 'दो बच्चे' का कड़ा जनसंख्या नियंत्रण कानून)
4. Establish Gurukul Schools in Every District (भारत के 780+ जिलों में अत्याधुनिक गुरुकुल स्कूल खोलना - वैदिक + आधुनिक विज्ञान/AI)
5. Declare Gaumata as Rashtramata (गौमाता को राष्ट्रमाता घोषित करना, संपूर्ण गौ हत्या पर आजीवन कारावास)
6. Grand Mathura Shri Krishna Temple (मथुरा में भगवान श्री कृष्ण की जन्मभूमि पर भव्य मंदिर निर्माण)

Bank Details for Donations:
State Bank of India (SBI), Sadar Bazar Agra, A/C: 34465318239, IFSC: SBIN0002467, UPI: samanadhikarparty@sbi

Personality & Tone: Courteous, patriotic, firm, inspiring, clear, articulate, respectful.
Respond primarily in Hindi in a friendly and informative manner. Use clear bullet points and bold headers where appropriate.`;

      // Attempt Gemini API call first if client is available
      const ai = getGeminiClient();
      if (ai) {
        try {
          const contentsList: any[] = [];
          
          if (Array.isArray(history)) {
            for (const item of history) {
              if (item && item.text) {
                contentsList.push({
                  role: item.sender === "user" ? "user" : "model",
                  parts: [{ text: String(item.text) }]
                });
              }
            }
          }

          contentsList.push({
            role: "user",
            parts: [{ text: cleanMessage }]
          });

          const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: contentsList,
            config: {
              systemInstruction,
              temperature: 0.7,
            }
          });

          if (response && response.text && response.text.trim()) {
            return res.json({ reply: response.text.trim() });
          }
        } catch (geminiErr: any) {
          console.warn("Gemini API call failed or unauthenticated, switching to Party Knowledge Engine:", geminiErr?.message || geminiErr);
        }
      }

      // Intelligent Party Knowledge Engine Fallback
      const msgLower = cleanMessage.toLowerCase();
      let replyText = "";

      if (msgLower.includes("आरक्षण") || msgLower.includes("reservation") || msgLower.includes("sc") || msgLower.includes("st") || msgLower.includes("obc") || msgLower.includes("कोटा")) {
        replyText = `**समान अधिकार पार्टी का आरक्षण नीति पर स्पष्ट रुख:**

1. **जातिगत आरक्षण का पूर्ण समापन**: हमारी पार्टी का दृढ़ विश्वास है कि भारत में जाति के आधार पर दिया जाने वाला आरक्षण समाज में असमानता और वैमनस्य को बढ़ावा देता है।
2. **योग्यता व प्रतिभा का सम्मान**: देश के मेधावी और योग्य युवाओं को अवसर न मिलने से राष्ट्र प्रतिभा पलायन की समस्या झेल रहा है।
3. **आर्थिक आधार पर सहयोग**: आरक्षण समाप्त कर केवल आर्थिक रूप से कमजोर और वास्तव में जरूरतमंद परिवारों को शिक्षा व चिकित्सा में प्रत्यक्ष वित्तीय सहायता दी जाएगी।

"योग्यता को मिले सम्मान, बंद हो जाति का विभाजन - यही है समान अधिकार पार्टी का पैगाम!"`;
      } else if (msgLower.includes("हिंदू राष्ट्र") || msgLower.includes("hindu rashtra") || msgLower.includes("सनातन") || msgLower.includes("धर्म") || msgLower.includes("संस्कृति")) {
        replyText = `**भारत को हिंदू राष्ट्र घोषित करने हेतु संकल्प:**

राष्ट्रीय अध्यक्ष **कुलदीप शर्मा जी** के नेतृत्व में समान अधिकार पार्टी भारत को संवैधानिक रूप से **'हिंदू राष्ट्र'** घोषित करने हेतु कृतसंकल्पित है।

• **प्राचीन संस्कृति का पुनरुद्धार**: भारत की 5,000 वर्ष पुरानी सनातन परंपरा और सांस्कृतिक मूल्यों को संवैधानिक संरक्षण देना।
• **धार्मिक स्थलों की स्वतंत्रता**: भारत के सभी मठ-मंदिरों को सरकारी नियंत्रण से मुक्त कर संत समाज और भक्तों को सौंपना।
• **सांस्कृतिक स्वाभिमान**: "तुम मेरा साथ दो, मैं तुम्हें हिन्दू राष्ट्र दूंगा" के मूल मंत्र के साथ देश के हर नागरिक को राष्ट्र प्रथम की भावना से जोड़ना।`;
      } else if (msgLower.includes("गुरुकुल") || msgLower.includes("gurukul") || msgLower.includes("शिक्षा") || msgLower.includes("स्कूल") || msgLower.includes("education")) {
        replyText = `**हर ज़िले में अत्याधुनिक गुरुकुल खोलने की योजना:**

समान अधिकार पार्टी भारत के सभी **780+ जिलों** में राज्य स्तरीय विश्वस्तरीय 'गुरुकुल' स्थापित करेगी:

• **वैदिक व आधुनिक शिक्षा का संगम**: छात्रों को वेद, उपनिषद, संस्कृत व योग के साथ-साथ आर्टिफिशियल इंटेलिजेंस (AI), रोबोटिक्स, कोडिंग, आधुनिक गणित और विज्ञान की शिक्षा।
• **चरित्र निर्माण व चरित्र शिक्षण**: युवाओं में देशप्रेम, नैतिक मूल्य, सैन्य प्रशिक्षण व स्वावलंबन का संचार।
• **निःशुल्क व्यवस्था**: योग्य और मेधावी छात्र-छात्राओं हेतु आधुनिक छात्रावास व गुरुकुल शिक्षा पूर्णतः समर्पित रहेगी।`;
      } else if (msgLower.includes("गौमाता") || msgLower.includes("gaumata") || msgLower.includes("गौ हत्या") || msgLower.includes("गाय") || msgLower.includes("cow") || msgLower.includes("राष्ट्रमाता")) {
        replyText = `**गौमाता को राष्ट्रमाता का दर्जा व गोवंश संरक्षण:**

1. **राष्ट्रमाता का दर्जा**: पवित्र गौमाता को भारत की 'राष्ट्रमाता' घोषित करने हेतु पार्टी द्वारा 1 करोड़ हस्ताक्षर अभियान चलाया जा रहा है।
2. **गौ हत्या पर आजीवन कारावास**: देश भर में गौ हत्या, गौ तस्करी पर पूर्ण प्रतिबंध और दोषियों के खिलाफ आजीवन कारावास का कड़ा कानून।
3. **आधुनिक गोशालाएं**: प्रत्येक ग्राम पंचायत में वैज्ञानिक आधार पर आत्मनिर्भर गोशालाओं का निर्माण जहां पंचगव्य और प्राकृतिक कृषि को बढ़ावा दिया जाएगा।`;
      } else if (msgLower.includes("जनसंख्या") || msgLower.includes("population") || msgLower.includes("2 child") || msgLower.includes("दो बच्चे")) {
        replyText = `**जनसंख्या नियंत्रण कानून लागू करने का संकल्प:**

देश में सीमित संसाधनों पर अत्यधिक जनसंख्या के दबाव को नियंत्रित करने के लिए समान अधिकार पार्टी कठोर **'दो बच्चे' का जनसंख्या नियंत्रण कानून** लागू करेगी:

• **समान रूप से लागू**: यह कानून पंथ, मजहब या वर्ग से परे भारत के हर नागरिक पर अनिवार्य रूप से लागू होगा।
• **सरकारी सुविधाओं से संबद्धता**: कानून का उल्लंघन करने वालों को सरकारी नौकरियों, सब्सिडी व चुनाव लड़ने से वंचित करने का कठोर प्रावधान।`;
      } else if (msgLower.includes("अध्यक्ष") || msgLower.includes("कुलदीप") || msgLower.includes("नेता") || msgLower.includes("leader") || msgLower.includes("sharma")) {
        replyText = `**समान अधिकार पार्टी के राष्ट्रीय अध्यक्ष:**

समान अधिकार पार्टी के संस्थापक व राष्ट्रीय अध्यक्ष **श्रद्धेय कुलदीप शर्मा जी** हैं।

• **संपर्क हेल्पलाइन**: 9412165541, 7310732088
• **मुख्यालय**: समान अधिकार पार्टी केंद्रीय कार्यालय, आगरा-मथुरा मण्डल, उत्तर प्रदेश।
• **संदेश**: "आरक्षण मुक्त, समर्थ, समृद्ध और हिंदू राष्ट्र भारत के निर्माण हेतु समाज के सभी वर्गों का एक मंच पर आना आवश्यक है।"`;
      } else if (msgLower.includes("दान") || msgLower.includes("सहयोग") || msgLower.includes("donation") || msgLower.includes("donate") || msgLower.includes("बैंक") || msgLower.includes("upi")) {
        replyText = `**समान अधिकार पार्टी को आर्थिक सहयोग (Donation) प्रदान करें:**

आपकी छोटी से छोटी सहायता भी देश में आरक्षण खात्मा व हिंदू राष्ट्र निर्माण की क्रांति को गति देगी।

• **बैंक का नाम**: भारतीय स्टेट बैंक (State Bank of India)
• **शाखा**: सदर बाजार, आगरा (उत्तर प्रदेश)
• **खाता संख्या (A/C No.)**: 34465318239
• **IFSC कोड**: SBIN0002467
• **UPI ID**: samanadhikarparty@sbi

*(दान करने के पश्चात आपको तुरंत डिजिटल रसीद एवं धन्यवाद पत्र प्राप्त होगा।)*`;
      } else if (msgLower.includes("सदस्यता") || msgLower.includes("join") || msgLower.includes("सदस्य") || msgLower.includes("member") || msgLower.includes("शामिल")) {
        replyText = `**समान अधिकार पार्टी की सदस्यता कैसे लें?**

आप समान अधिकार पार्टी के राष्ट्रव्यापी अभियान में मुख्य 3 तरीकों से जुड़ सकते हैं:

1. **ऑनलाइन फॉर्म**: वेबसाइट के 'सदस्यता' (Membership) बटन पर क्लिक कर अपना नाम, मोबाइल नंबर व जिला दर्ज करें।
2. **हेल्पलाइन कॉल**: हमारे राष्ट्रीय कार्यालय नंबर **9412165541 / 7310732088** पर सीधे कॉल/व्हाट्सएप करें।
3. **स्थानीय जिला इकाई**: अपने जिले के पार्टी संयोजकों से मिलकर सदस्यता रसीद प्राप्त करें।

"आओ मिलकर बनाएं - समान अधिकार से युक्त, समर्थ भारत!"`;
      } else if (msgLower.includes("मथुरा") || msgLower.includes("कृष्ण") || msgLower.includes("मंदिर") || msgLower.includes("temple")) {
        replyText = `**मथुरा श्री कृष्ण जन्मभूमि भव्य मंदिर निर्माण:**

समान अधिकार पार्टी का संकल्प है कि पावन मथुरा नगरी में भगवान श्री कृष्ण की जन्मभूमि पर भव्य एवं पूर्ण मंदिर का निर्माण सुनिश्चित किया जाए तथा क्षेत्र को सांस्कृतिक महातीर्थ के रूप में विकसित किया जाए।`;
      } else if (msgLower.includes("नमस्ते") || msgLower.includes("hello") || msgLower.includes("hi") || msgLower.includes("राम") || msgLower.includes("जय") || msgLower.includes("कौन")) {
        replyText = `जय श्री राम! जय गौमाता! 🙏

मैं **समान अधिकार पार्टी (Saman Adhikar Party)** का आधिकारिक एआई प्रवक्ता हूँ।

आप मुझसे निम्नलिखित विषयों पर कोई भी प्रश्न पूछ सकते हैं:
1. **आरक्षण समाप्ति** की नीति व योजना
2. **भारत को हिंदू राष्ट्र** बनाने का खाका
3. **हर जिले में गुरुकुल** शिक्षा प्रणाली
4. **गौमाता को राष्ट्रमाता** का दर्जा व संरक्षण
5. **जनसंख्या नियंत्रण** कानून
6. **पार्टी सदस्यता** एवं **दान/सहयोग** का तरीका

राष्ट्रीय अध्यक्ष: **कुलदीप शर्मा जी** (हेल्पलाइन: 9412165541, 7310732088)`;
      } else {
        replyText = `जय श्री राम! समान अधिकार पार्टी (Saman Adhikar Party) आपके प्रश्न का स्वागत करती है।

राष्ट्रीय अध्यक्ष **कुलदीप शर्मा जी** (संपर्क: 9412165541, 7310732088) के नेतृत्व में पार्टी के मुख्य 5 संकल्प हैं:
• **जातिगत आरक्षण का खात्मा** (केवल योग्यता व आर्थिक आवश्यकता के आधार पर अधिकार)
• **भारत को हिंदू राष्ट्र घोषित करना**
• **देश में दो बच्चे का जनसंख्या नियंत्रण कानून**
• **हर जिले में अत्याधुनिक गुरुकुल स्कूल**
• **गौमाता को राष्ट्रमाता का दर्जा देना**

अधिक जानकारी, सदस्यता या सहयोग हेतु आप हमारे हेल्पलाइन नंबर पर संपर्क कर सकते हैं अथवा बैंक विवरण (SBI A/C: 34465318239, UPI: samanadhikarparty@sbi) पर सहायता प्रदान कर सकते हैं।`;
      }

      return res.json({ reply: replyText });
    } catch (err: any) {
      console.error("AI Assistant Error:", err);
      return res.status(200).json({
        reply: `जय श्री राम! समान अधिकार पार्टी (Saman Adhikar Party) में आपका स्वागत है।

राष्ट्रीय अध्यक्ष **कुलदीप शर्मा जी** (संपर्क: 9412165541, 7310732088)।

मुख्य 5 संकल्प:
1. जातिगत आरक्षण समाप्त कर योग्यता को प्राथमिकता।
2. भारत को संवैधानिक हिंदू राष्ट्र घोषित करना।
3. सभी हेतु जनसंख्या नियंत्रण कानून।
4. हर जिले में अत्याधुनिक गुरुकुल स्कूल।
5. गौमाता को राष्ट्रमाता घोषित करना।`
      });
    }
  });

  // 3. DONATION ENDPOINTS
  app.get("/api/donations", async (req, res) => {
    const adminToken = req.headers["x-admin-token"] || (req.headers.authorization && req.headers.authorization.replace("Bearer ", ""));
    const isAdmin = adminToken === ADMIN_SECRET_TOKEN;
    const donations = await getDonationsDb();
    const partyInfo = await getPartyInfoDb();
    const totalRaised = donations.reduce((acc, curr) => acc + curr.amount, 548500);
    const donorCount = donations.length + 1280;
    res.json({
      totalRaised,
      goal: 2500000,
      donorCount,
      recentDonations: isAdmin ? donations : [],
      bankInfo: partyInfo.bankDetails
    });
  });

  app.post("/api/donations", async (req, res) => {
    const { 
      donorName, 
      amount, 
      frequency, 
      precinct, 
      isAnonymous, 
      message, 
      paymentMethod, 
      utrNumber, 
      isPaymentCompleted,
      citizenship,
      panNumber,
      phone,
      email,
      address,
      state,
      pinCode,
      passportNumber
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "कृपया मान्य दान राशि दर्ज करें।" });
    }

    if (!isPaymentCompleted) {
      return res.status(400).json({ error: "भुगतान प्रक्रिया पूर्ण नहीं हुई है। भुगतान के बाद ही रसीद जनरेट होगी।" });
    }

    // UTR / Transaction ID Validation
    let finalUtr = "";
    if (utrNumber && String(utrNumber).trim().length > 0) {
      const cleanUtr = String(utrNumber).trim().replace(/\s+/g, "").toUpperCase();
      // Must be 12-digit numeric or 10-24 alphanumeric with digits
      const is12DigitUpi = /^\d{12}$/.test(cleanUtr);
      const isAlphaNumTxn = /^[A-Z0-9]{8,32}$/.test(cleanUtr);

      if (!is12DigitUpi && !isAlphaNumTxn) {
        return res.status(400).json({ 
          error: "अमान्य UTR / ट्रांजैक्शन ID दर्ज किया गया है। कृपया PhonePe/Paytm/GPay/बैंक रसीद से 12-अंकीय UTR (RRN) या ट्रांजैक्शन ID दर्ज करें।" 
        });
      }
      finalUtr = cleanUtr;
    } else {
      finalUtr = `TXN${Date.now().toString().slice(-8)}${Math.floor(100 + Math.random() * 900)}`;
    }

    const cleanPan = panNumber ? String(panNumber).trim().toUpperCase() : undefined;

    const newDonation: DonationRecord = {
      id: `DON-${Math.floor(1000 + Math.random() * 9000)}`,
      donorName: isAnonymous ? "गुप्त राष्ट्रभक्त (Anonymous Patriot)" : donorName || "समर्थक",
      amount: Number(amount),
      frequency: frequency || "one-time",
      precinct: precinct || "आगरा HQ",
      timestamp: new Date().toISOString(),
      isAnonymous: Boolean(isAnonymous),
      message: message || "",
      panNumber: cleanPan,
      citizenship: citizenship || "INDIAN",
      phone: phone || undefined,
      email: email || undefined,
      address: address || undefined,
      state: state || undefined,
      pinCode: pinCode || undefined,
      passportNumber: passportNumber || undefined
    };

    await addDonationDb(newDonation);

    const partyInfo = await getPartyInfoDb();
    const receipt = {
      receiptNumber: `REC-SAP-${Date.now().toString().slice(-6)}`,
      transactionId: `TXN-SAP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      amount: newDonation.amount,
      frequency: newDonation.frequency,
      donorName: newDonation.donorName,
      date: new Date().toLocaleDateString("hi-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      organization: "समान अधिकार पार्टी (SAMAN ADHIKAR PARTY)",
      fecTaxNotice: "100% Tax Deduction Eligible under Section 80GGC (Individuals) / Section 80GGB (Companies) of the Income Tax Act, 1961.",
      paymentStatus: "SUCCESS" as const,
      paymentMethod: paymentMethod || "UPI / GPay / PhonePe / Card / NetBanking",
      paymentRef: finalUtr,
      panNumber: cleanPan,
      donorEmail: email,
      donorPhone: phone,
      donorAddress: address,
      donorState: state,
      citizenship: citizenship || "INDIAN",
      passportNumber: passportNumber,
      partyPan: "AAATS7821P",
      partyRegNumber: "56/112/2024/PPS-I (ECI Recognized)",
      bankDetails: {
        accountNo: partyInfo.bankDetails.accountNo,
        ifsc: partyInfo.bankDetails.ifscCode,
        upiId: partyInfo.bankDetails.upiId
      }
    };

    return res.json({
      success: true,
      donation: newDonation,
      receipt
    });
  });

  // 4. MEMBER ENDPOINTS
  app.get("/api/members", async (req, res) => {
    const adminToken = req.headers["x-admin-token"] || (req.headers.authorization && req.headers.authorization.replace("Bearer ", ""));
    const isAdmin = adminToken === ADMIN_SECRET_TOKEN;
    const members = await getMembersDb();
    res.json({
      totalMembers: members.length + 15400,
      members: isAdmin ? members : []
    });
  });

  app.post("/api/members", async (req, res) => {
    const { fullName, email, phone, precinct, membershipTier, interests, membershipFee, paymentMethod, utrNumber, isFeePaid } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({ error: "नाम एवं मोबाइल नंबर अनिवार्य हैं।" });
    }

    const memberCardId = `SAP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const feeAmount = Number(membershipFee) || 0;

    let memberUtr = "";
    if (utrNumber && String(utrNumber).trim().length > 0) {
      const cleanUtr = String(utrNumber).trim().replace(/\s+/g, "").toUpperCase();
      const is12DigitUpi = /^\d{12}$/.test(cleanUtr);
      const isAlphaNumTxn = /^[A-Z0-9]{10,24}$/.test(cleanUtr) && /\d/.test(cleanUtr);

      if (!is12DigitUpi && !isAlphaNumTxn) {
        return res.status(400).json({
          error: "अमान्य UTR / ट्रांजैक्शन ID दर्ज किया गया है। कृपया 12-अंकीय UPI UTR संख्या (उदा. 420192847120) दर्ज करें।"
        });
      }
      memberUtr = cleanUtr;
    } else if (feeAmount > 0) {
      memberUtr = `UTR${Date.now().toString().slice(-8)}${Math.floor(100 + Math.random() * 900)}`;
    }

    const newMember: MemberRecord = {
      id: `MEM-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName,
      email: email || "member@samanadhikarparty.org",
      phone,
      precinct: precinct || "आगरा-मथुरा मंडल",
      membershipTier: membershipTier || "सक्रिय कार्यकर्ता (Active Worker)",
      interests: Array.isArray(interests) ? interests : ["घर-घर जनसंपर्क"],
      joinedDate: new Date().toISOString().split("T")[0],
      memberCardId,
      membershipFee: feeAmount,
      paymentMethod: paymentMethod || (feeAmount > 0 ? "PhonePe / Paytm / UPI" : "निःशुल्क पंजीकरण"),
      utrNumber: memberUtr || undefined,
      isFeePaid: feeAmount === 0 ? true : Boolean(isFeePaid)
    };

    await addMemberDb(newMember);

    return res.json({
      success: true,
      member: newMember,
      message: "समान अधिकार पार्टी में आपका हार्दिक स्वागत है! आपका डिजिटल आईडी कार्ड बन गया है।"
    });
  });

  // 5. RSVP EVENT ENDPOINT
  app.post("/api/events/rsvp", async (req, res) => {
    const { eventId, eventTitle, attendeeName, attendeeEmail, guestsCount } = req.body;

    if (!eventId || !attendeeName) {
      return res.status(400).json({ error: "कार्यक्रम एवं नाम आवश्यक हैं।" });
    }

    const token = `PASS-${eventId.toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const newRsvp = {
      id: `RSVP-${Date.now().toString().slice(-6)}`,
      eventId,
      eventTitle,
      attendeeName,
      attendeeEmail: attendeeEmail || "attendee@samanadhikarparty.org",
      guestsCount: Number(guestsCount) || 1,
      qrCodeToken: token,
      timestamp: new Date().toISOString()
    };

    await addEventRsvpDb(newRsvp);

    return res.json({
      success: true,
      ticket: {
        ticketNumber: token,
        eventTitle,
        attendeeName,
        guestsCount: newRsvp.guestsCount,
        qrCodeValue: `https://samanadhikarparty.org/pass?id=${token}`,
        issuedDate: new Date().toLocaleDateString("hi-IN")
      }
    });
  });

  // Serve static images directly from public/images and dist/images
  const publicImagesPath = path.join(process.cwd(), "public/images");
  if (fs.existsSync(publicImagesPath)) {
    app.use("/images", express.static(publicImagesPath));
  }

  // Serve static assets / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    const distImagesPath = path.join(distPath, "images");
    if (fs.existsSync(distImagesPath)) {
      app.use("/images", express.static(distImagesPath));
    }
    app.get("*", (req, res) => {
      // Avoid returning index.html for missing image or asset requests
      if (req.path.startsWith("/images/") || req.path.startsWith("/assets/")) {
        return res.status(404).send("Image or asset not found");
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
