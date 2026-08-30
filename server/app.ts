import express from "express";
import path from "path";
import fs from "fs";
import { UPLOADS_DIR } from "./config";
import { publicLimiter } from "./middleware/rateLimiter";
import { adminRouter } from "./routes/admin";
import { pressRouter } from "./routes/press";
import { eventsRouter } from "./routes/events";
import { donationsRouter } from "./routes/donations";
import { membersRouter } from "./routes/members";
import { partyRouter } from "./routes/party";
import { cashfreeRouter } from "./routes/cashfree";
import { chatRouter } from "./routes/chat";
import { uploadRouter } from "./routes/upload";

export function createExpressApp(): express.Express {
  const app = express();

  // Trust proxy for container & reverse proxy environments (e.g. Cloud Run, Nginx)
  app.set("trust proxy", 1);

  // Lightweight body parser limits: Prevents large Base64 payloads from hogging memory.
  // Large files must be uploaded via streaming multipart form-data to /api/upload instead.
  app.use(express.json({ limit: "500kb" }));
  app.use(express.urlencoded({ extended: true, limit: "500kb" }));

  // Static uploads directory serving
  if (fs.existsSync(UPLOADS_DIR)) {
    app.use("/uploads", express.static(UPLOADS_DIR));
  }

  // Static public images serving
  const publicImagesPath = path.join(process.cwd(), "public/images");
  if (fs.existsSync(publicImagesPath)) {
    app.use("/images", express.static(publicImagesPath));
  }

  // General rate limiter on /api
  app.use("/api", publicLimiter);

  // Mount API Routers matching the modular architecture
  app.use("/api/admin", adminRouter);
  app.use("/api/events", eventsRouter);
  app.use("/api/members", membersRouter);
  app.use("/api/donations", donationsRouter);
  app.use("/api/press", pressRouter);
  app.use("/api/press-releases", pressRouter); // Full compatibility alias
  app.use("/api/party", partyRouter);
  app.use("/api/party-info", partyRouter);     // Full compatibility alias
  app.use("/api/cashfree", cashfreeRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/upload", uploadRouter);

  // Global alias for sync-youtube-shorts
  app.post("/api/sync-youtube-shorts", (req, res, next) => {
    req.url = "/sync-youtube-shorts";
    pressRouter(req, res, next);
  });

  return app;
}
