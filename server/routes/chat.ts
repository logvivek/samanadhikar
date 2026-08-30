import { Router } from "express";
import { generateChatReply } from "../services/aiService";

export const chatRouter = Router();

// POST /api/chat
chatRouter.post("/", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, error: "Message prompt is required" });
    }

    const reply = await generateChatReply(message, history);
    return res.json({ success: true, reply });
  } catch (err: any) {
    console.error("Chat API error:", err);
    return res.json({
      success: true,
      reply: `जय श्री राम! समान अधिकार पार्टी (Saman Adhikar Party) में आपका स्वागत है।
राष्ट्रीय अध्यक्ष **कुलदीप शर्मा जी** (संपर्क: 9412165541, 7310732088)।
मुख्य संकल्प: जातिगत आरक्षण समाप्ति, भारत हिंदू राष्ट्र, दो बच्चे का जनसंख्या नियंत्रण कानून, हर जिले में गुरुकुल एवं गौमाता को राष्ट्रमाता का दर्जा।`
    });
  }
});
