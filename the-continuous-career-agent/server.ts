/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import apiRouter from "./server/routes/api.js";
import { antigravityOrchestratorMiddleware } from "./config/antigravity.config.js";

// Load local development variables if available (use absolute path so it works regardless of cwd)
dotenv.config({ path: path.join(process.cwd(), ".env.local") });
// Also load default .env if present
dotenv.config();


async function startServer() {
  // Startup sanity check for required env vars
  if (!process.env.SESSION_SECRET) {
    console.warn("[WARN] SESSION_SECRET is not set. Session token encryption/decryption will fail.");
  }

  const app = express();
  const PORT = 3000;

  // 1. Basic security and parsing middleware
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true, limit: "5mb" }));

  // Apply decentralized pipeline state-synchronizer orchestrator log and header tracing
  app.use(antigravityOrchestratorMiddleware);

  // 2. Mount business agent pipeline endpoints first
  app.use("/api", apiRouter);

  // 3. Mount framework assets serving
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite integration...");
    
    // Create Vite server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    // Use Vite's connect instance as middleware
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static files compiled inside 'dist/' folder
    app.use(express.static(distPath));
    
    // Support React Router client-side fallbacks
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind server precisely to port 3000 and 0.0.0.0 host
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`The Continuous Career Agent Backend running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Critical: Failed to launch server:", error);
  process.exit(1);
});
