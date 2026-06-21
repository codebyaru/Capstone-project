/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from "express";
import profileRouter from "./profile.js";
import marketRouter from "./market.js";
import workspaceRouter from "./workspace.js";

const apiRouter = Router();

// Aggregate modular business agents' routes
apiRouter.use("/profile", profileRouter);
apiRouter.use("/market", marketRouter);
apiRouter.use("/outreach", workspaceRouter);

// Service healthcheck
apiRouter.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Continuous Career Agent Pipeline Backend Node Server"
  });
});

export default apiRouter;
