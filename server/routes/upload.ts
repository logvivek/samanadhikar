import { Router } from "express";
import { uploadMiddleware } from "../services/uploadService";
import { verifyAdmin } from "../middleware/auth";
import { uploadLimiter } from "../middleware/rateLimiter";

export const uploadRouter = Router();

// POST /api/upload
uploadRouter.post("/", verifyAdmin, uploadLimiter, (req, res) => {
  uploadMiddleware.single("file")(req, res, (err: any) => {
    if (err) {
      const isSizeError = err.code === "LIMIT_FILE_SIZE";
      return res.status(400).json({
        success: false,
        error: isSizeError
          ? "फ़ाइल का आकार 5MB से अधिक नहीं होना चाहिए।"
          : (err.message || "फ़ाइल अपलोड करने में त्रुटि।")
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "कोई फ़ाइल अपलोड नहीं की गई। कृपया मान्य फोटो चुनें।"
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    return res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      message: "फ़ाइल स्टोरेज में सफलतापूर्वक अपलोड हो गई!"
    });
  });
});
