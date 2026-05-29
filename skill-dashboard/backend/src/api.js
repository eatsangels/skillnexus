import { Router } from "express";
import { spawn } from "child_process";
import { scanSkills } from "./skill-scanner.js";
import { scanAgents } from "./agent-scanner.js";
import { getCatalog, refreshCatalog, searchSkills, fetchSkillDetail, installSkill } from "./skills-sh-scanner.js";
import { homedir } from "os";
import { join } from "path";
import { CONFIG } from "./config.js";
import { watch, existsSync } from "fs";


const router = Router();

let skillsCache = null;
let agentsCache = null;
let lastScan = null;

function scan() {
  skillsCache = scanSkills();
  agentsCache = scanAgents();
  lastScan = new Date().toISOString();
}

scan();

router.get("/skills", (_req, res) => {
  const summary = skillsCache.map((s) => ({
    name: s.name,
    description: s.description?.substring(0, 200) || "",
    descriptionEn: s.descriptionEn,
    descriptionEs: s.descriptionEs,
    format: s.format,
    location: s.location,
    frameworks: s.frameworks || [],
    lastModified: s.lastModified,
  }));
  res.json({ skills: summary, total: summary.length, lastScan });
});

router.get("/skills/:name", (req, res) => {
  const skill = skillsCache.find((s) => s.name === req.params.name);
  if (!skill) return res.status(404).json({ error: "Skill not found" });
  res.json({ skill });
});

router.get("/agents", (_req, res) => {
  const summary = agentsCache.map((a) => ({
    name: a.name,
    displayName: a.displayName || a.name,
    description: a.description,
    descriptionEn: a.descriptionEn,
    descriptionEs: a.descriptionEs,
    mode: a.mode,
    native: a.native,
    source: a.source,
    color: a.color,
    model: a.model,
    hidden: a.hidden,
    emoji: a.options?.emoji || null,
    category: a.category || "Other",
    invocation: a.invocation || `@${a.name}`,
    useCases: a.useCases,
  }));
  res.json({ agents: summary, total: summary.length, lastScan });
});

router.get("/agents/:name", (req, res) => {
  const agent = agentsCache.find((a) => a.name === req.params.name);
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  res.json({ agent });
});

router.post("/agents/:name/run", (req, res) => {
  const { name } = req.params;
  const { prompt } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const agent = agentsCache.find((a) => a.name === name);
  if (!agent) {
    res.write(`data: ${JSON.stringify({ error: "Agent not found" })}\n\n`);
    res.end();
    return;
  }

  res.write(`data: ${JSON.stringify({ chunk: `> opencode run --agent ${name} "${prompt}"\n\n` })}\n\n`);

  const winPath = process.platform === "win32"
    ? join(process.env.APPDATA || "", "npm", "node_modules", "opencode-ai", "bin", "opencode.exe")
    : null;
  const useDirectExe = winPath && existsSync(winPath);
  const cmd = useDirectExe ? winPath : "opencode";
  const options = useDirectExe ? { shell: false } : { shell: true };

  console.log(`Spawning command: ${cmd} with options: ${JSON.stringify(options)}`);
  let child;
  try {
    child = spawn(cmd, ["run", "--agent", name, prompt, "--dangerously-skip-permissions"], {
      ...options,
      env: { ...process.env, FORCE_COLOR: "1" }
    });
    child.stdin.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ chunk: `Failed to spawn: ${err.message}\n` })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true, code: 1 })}\n\n`);
    res.end();
    return;
  }

  child.stdout.on("data", (data) => {
    res.write(`data: ${JSON.stringify({ chunk: data.toString() })}\n\n`);
  });

  child.stderr.on("data", (data) => {
    res.write(`data: ${JSON.stringify({ chunk: data.toString(), type: "stderr" })}\n\n`);
  });

  child.on("close", (code) => {
    res.write(`data: ${JSON.stringify({ done: true, code })}\n\n`);
    res.end();
  });

  child.on("error", (err) => {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  });

  res.on("close", () => {
    console.log("Client connection closed, killing child process...");
    if (child) child.kill();
  });
});

router.get("/dashboard", (_req, res) => {
  const skills = skillsCache;
  const agents = agentsCache;
  const allFrameworks = [...new Set(skills.flatMap((s) => s.frameworks || []))];
  const byMode = {};
  const byCategory = {};
  for (const a of agents) {
    byMode[a.mode] = (byMode[a.mode] || 0) + 1;
    const cat = a.category || "Other";
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }
  res.json({
    stats: {
      totalSkills: skills.length,
      totalAgents: agents.length,
      frameworks: allFrameworks,
      nativeAgents: agents.filter((a) => a.native).length,
      customAgents: agents.filter((a) => !a.native).length,
      agentsByMode: byMode,
      agentsByCategory: byCategory,
      skillFormats: {
        directory: skills.filter((s) => s.format === "directory").length,
        zip: skills.filter((s) => s.format === "zip").length,
      },
    },
    lastScan,
  });
});

router.get("/skills-sh", async (_req, res) => {
  try {
    let skills = getCatalog();
    if (skills.length === 0) {
      skills = await refreshCatalog();
    }
    res.json({ skills, total: skills.length });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

router.get("/skills-sh/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || q.length < 2) return res.json({ skills: [], count: 0 });
    const results = await searchSkills(q);
    res.json({ skills: results, count: results.length });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

router.get("/skills-sh/:source/:slug", async (req, res) => {
  try {
    const detail = await fetchSkillDetail(req.params.source, req.params.slug);
    res.json({ skill: detail });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

router.post("/skills-sh/install", async (req, res) => {
  try {
    const { source, slug } = req.body;
    if (!source || !slug) return res.status(400).json({ error: "source and slug required" });
    const targetDir = join(homedir(), "Documents", "curso-opencode", ".opencode", "skills");
    const result = await installSkill(source, slug, targetDir);
    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

let clients = [];

router.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.write("data: " + JSON.stringify({ connected: true }) + "\n\n");

  clients.push(res);

  req.on("close", () => {
    clients = clients.filter((c) => c !== res);
  });
});

function broadcast(event, data) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try {
      client.write(message);
    } catch {
      // client connection closed or error
    }
  }
}

function setupWatchers() {
  const dirsToWatch = [
    ...(CONFIG.scanPaths.skillDirectories || []),
    CONFIG.scanPaths.claudeAgentsDir
  ].filter(Boolean);

  let debounceTimeout = null;
  const triggerScan = () => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      console.log("[Watcher] Change detected, scanning...");
      scan();
      broadcast("update", { lastScan });
    }, 500);
  };

  for (const dir of dirsToWatch) {
    if (existsSync(dir)) {
      try {
        watch(dir, { recursive: true }, (eventType, filename) => {
          console.log(`[Watcher] Event ${eventType} on ${filename} inside ${dir}`);
          triggerScan();
        });
        console.log(`[Watcher] Watching ${dir}`);
      } catch (err) {
        console.error(`[Watcher] Failed to watch ${dir}:`, err);
      }
    } else {
      console.log(`[Watcher] Directory ${dir} does not exist, skipping watcher`);
    }
  }
}

// Start watching on API router initialization
setupWatchers();

router.get("/refresh", (_req, res) => {
  scan();
  broadcast("update", { lastScan });
  res.json({ message: "Cache refreshed", lastScan });
});

export default router;

