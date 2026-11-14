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

  // Lightweight body parser limits + capture rawBody for Cashfree webhook signature verification
  app.use(express.json({
    limit: "500kb",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString("utf8");
    }
  }));
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

  // CORS middleware for production domains (samanadhikar.in) & previews
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });

  // General rate limiter on /api
  app.use("/api", publicLimiter);

  // Mount API Routers matching both /api/* and direct /* (for serverless hosting environments)
  const mount = (routePath: string, router: express.Router) => {
    app.use(routePath, router);
    if (routePath.startsWith("/api/")) {
      app.use(routePath.replace(/^\/api/, ""), router);
    }
  };

  mount("/api/admin", adminRouter);
  mount("/api/events", eventsRouter);
  mount("/api/members", membersRouter);
  mount("/api/donations", donationsRouter);
  mount("/api/press", pressRouter);
  mount("/api/press-releases", pressRouter); // Full compatibility alias
  mount("/api/party", partyRouter);
  mount("/api/party-info", partyRouter);     // Full compatibility alias
  mount("/api/cashfree", cashfreeRouter);
  mount("/api/chat", chatRouter);
  mount("/api/upload", uploadRouter);

  // Global alias for sync-youtube-shorts
  app.post("/api/sync-youtube-shorts", (req, res, next) => {
    req.url = "/sync-youtube-shorts";
    pressRouter(req, res, next);
  });
  app.post("/sync-youtube-shorts", (req, res, next) => {
    req.url = "/sync-youtube-shorts";
    pressRouter(req, res, next);
  });

  return app;
}
