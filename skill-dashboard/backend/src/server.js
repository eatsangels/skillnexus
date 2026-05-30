import express from "express";
import cors from "cors";
import apiRouter from "./api.js";
import { CONFIG } from "./config.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/api", apiRouter);

app.get("/", (_req, res) => {
  res.json({
    name: "Skill & Agent Dashboard API",
    version: "1.0.0",
    endpoints: {
      skills: "/api/skills",
      skillDetail: "/api/skills/:name",
      agents: "/api/agents",
      agentDetail: "/api/agents/:name",
      dashboard: "/api/dashboard",
      refresh: "/api/refresh",
    },
  });
});

app.listen(CONFIG.port, () => {
  console.log(`API running at http://localhost:${CONFIG.port}`);
  console.log(`Endpoints:`);
  console.log(`  skills    -> http://localhost:${CONFIG.port}/api/skills`);
  console.log(`  agents    -> http://localhost:${CONFIG.port}/api/agents`);
  console.log(`  dashboard -> http://localhost:${CONFIG.port}/api/dashboard`);
});
