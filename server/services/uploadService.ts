import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { UPLOADS_DIR } from "../config";

// Ensure uploads folder exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `upload-${uniqueSuffix}${ext}`);
  }
});

// File filter for images only
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("केवल JPEG, PNG, WEBP अथवा GIF फ़ाइलें अपलोड की जा सकती हैं।"));
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter
});

/**
 * Detects if a string is a Base64 Data URL, writes it to disk in /uploads,
 * and returns the relative clean URL (/uploads/filename.jpg)
 */
export function extractAndSaveBase64Image(imageUrlOrBase64?: string): string | undefined {
  if (!imageUrlOrBase64 || typeof imageUrlOrBase64 !== "string") {
    return imageUrlOrBase64;
  }

  const trimmed = imageUrlOrBase64.trim();
  const base64Match = trimmed.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);

  if (!base64Match) {
    return imageUrlOrBase64; // Already a URL or relative path
  }

  try {
    let extension = base64Match[1].toLowerCase();
    if (extension === "jpeg") extension = "jpg";
    if (extension === "svg+xml") extension = "svg";
    
    const base64Data = base64Match[2];
    const buffer = Buffer.from(base64Data, "base64");
    const filename = `img-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${extension}`;
    const fullPath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(fullPath, buffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error("Failed to extract Base64 image to disk:", err);
    return imageUrlOrBase64;
  }
}
