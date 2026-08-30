import path from "path";
import fs from "fs";
import express from "express";
import { createServer as createViteServer } from "vite";
import { createExpressApp } from "./app";
import { initDatabase } from "./database/connection";
import { CONFIG } from "./config";

export async function startServer() {
  // Initialize persistent production database
  initDatabase();

  const app = createExpressApp();
  const PORT = CONFIG.PORT;

  // Serve static assets / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

    const distImagesPath = path.join(distPath, "images");
    if (fs.existsSync(distImagesPath)) {
      app.use("/images", express.static(distImagesPath));
    }

    const distUploadsPath = path.join(process.cwd(), "uploads");
    if (fs.existsSync(distUploadsPath)) {
      app.use("/uploads", express.static(distUploadsPath));
    }

    app.get("*", (req, res) => {
      if (req.path.startsWith("/images/") || req.path.startsWith("/uploads/") || req.path.startsWith("/assets/")) {
        return res.status(404).send("File or asset not found");
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, CONFIG.HOST, () => {
    console.log(`[Production Server] Saman Adhikar Party running on http://${CONFIG.HOST}:${PORT}`);
  });

  return app;
}

// Auto-run if executed directly
if (process.env.NODE_ENV !== "test") {
  startServer();
}
