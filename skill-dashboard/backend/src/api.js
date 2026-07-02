import { Router } from "express";
import { spawn } from "child_process";
import { scanSkills } from "./skill-scanner.js";
import { scanAgents } from "./agent-scanner.js";
import { getCatalog, refreshCatalog, searchSkills, fetchSkillDetail, installSkill, uninstallSkill, onCatalogRefreshed } from "./skills-sh-scanner.js";
import { getAgentsCatalog, refreshAgentsCatalog, searchAgents, fetchAgentDetail, installAgent, uninstallAgent, onAgentsCatalogRefreshed } from "./agents-sh-scanner.js";
import { homedir } from "os";
import { join, dirname } from "path";
import { CONFIG } from "./config.js";
import remotionRouter from "./routes/remotion.js";
import { watch, existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, unlinkSync } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read app version from package.json dynamically
let appVersion = "1.0.17"; // fallback — update this with each release
try {
  // Posibles ubicaciones: dev (3 niveles arriba) o producción (app.asar)
  const candidates = [
    join(__dirname, "..", "..", "..", "package.json"),
    join(__dirname, "..", "..", "..", "..", "package.json"),
    join(__dirname, "..", "..", "..", "..", "app.asar", "package.json"),
  ];
  for (const pkgPath of candidates) {
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (pkg.version) {
        appVersion = pkg.version;
        break;
      }
    }
  }
} catch (e) {
  console.error("Failed to read version from package.json:", e);
}

// Track update status
let updateStatus = {
  status: "idle", // 'idle' | 'checking' | 'available' | 'downloaded' | 'error'
  version: null,
  error: null
};

const router = Router();

let skillsCache = null;
let agentsCache = null;
let lastScan = null;

// Puerto real donde quedó escuchando el backend (lo fija server.js tras el fallback de EADDRINUSE).
let activePort = CONFIG.port;
export function setActivePort(p) {
  activePort = p;
}

// Gates de features que ejecutan código/comandos. Habilitados por defecto (compatibilidad),
// pero se pueden desactivar por entorno para despliegues más restrictivos.
const ALLOW_AGENT_RUN = process.env.SKILLNEXUS_ALLOW_RUN !== "false";
const ALLOW_LOCAL_REMOTION = process.env.SKILLNEXUS_ALLOW_LOCAL_REMOTION !== "false";

// Endpoint ligero de salud para descubrimiento de puerto y reconexión del frontend/Electron.
router.get("/health", (_req, res) => {
  res.json({ ok: true, version: appVersion, port: activePort, lastScan });
});

if (process.on) {
  process.on("message", (msg) => {
    if (msg && msg.type) {
      if (msg.type === "update-available") {
        updateStatus = { status: "available", version: msg.version, error: null };
        broadcast("app-update", updateStatus);
      } else if (msg.type === "update-downloaded") {
        updateStatus = { status: "downloaded", version: msg.version, error: null };
        broadcast("app-update", updateStatus);
      } else if (msg.type === "update-error") {
        updateStatus = { status: "error", error: msg.error, version: null };
        broadcast("app-update", updateStatus);
      }
    }
  });
}

function scan() {
  skillsCache = scanSkills();
  agentsCache = scanAgents();
  lastScan = new Date().toISOString();
}

scan();

onCatalogRefreshed(() => {
  console.log("[API] Catalog refreshed, broadcasting update to all clients...");
  broadcast("update", { lastScan });
});

onAgentsCatalogRefreshed(() => {
  console.log("[API] Agents catalog refreshed, broadcasting update to all clients...");
  broadcast("update", { lastScan });
});

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
  let { prompt } = req.body;

  // Este endpoint ejecuta OpenCode con permisos elevados; se puede deshabilitar por entorno.
  if (!ALLOW_AGENT_RUN) {
    return res.status(403).json({ error: "La ejecución de agentes está deshabilitada (SKILLNEXUS_ALLOW_RUN=false)." });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const agent = agentsCache.find((a) => a.name === name);
  if (!agent) {
    res.write(`data: ${JSON.stringify({ error: "Agent not found" })}\n\n`);
    res.end();
    return;
  }

  // Limitar el tamaño del prompt para evitar abusos.
  prompt = typeof prompt === "string" ? prompt.slice(0, 8000) : "";

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
    version: appVersion,
    update: updateStatus,
    lastScan,
    systemPaths: {
      skillsDir: CONFIG.scanPaths.skillDirectories[0] || "",
      projectRoot: join(__dirname, "..", "..", ".."),
      backendDir: join(__dirname, "..")
    }
  });
});

router.post("/updates/apply", (_req, res) => {
  if (process.send) {
    console.log("[Backend] Sending apply-update request to parent Electron process...");
    process.send({ type: "apply-update" });
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "No running under an Electron process fork." });
  }
});

router.get("/skills-sh", async (_req, res) => {
  try {
    const skills = getCatalog();
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

    // Actualizar el cache local del backend e informar al frontend mediante SSE de inmediato
    scan();
    broadcast("update", { lastScan });

    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Desinstala una skill de todas las IAs.
router.delete("/skills-sh/:slug", async (req, res) => {
  try {
    const targetDir = join(homedir(), "Documents", "curso-opencode", ".opencode", "skills");
    const result = await uninstallSkill(req.params.slug, targetDir);
    scan();
    broadcast("update", { lastScan });
    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/agents-sh", async (_req, res) => {
  try {
    const agents = getAgentsCatalog();
    res.json({ agents, total: agents.length });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

router.get("/agents-sh/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || q.length < 2) return res.json({ agents: [], count: 0 });
    const results = await searchAgents(q);
    res.json({ agents: results, count: results.length });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

router.get("/agents-sh/:owner/:repo/:slug", async (req, res) => {
  try {
    const { owner, repo, slug } = req.params;
    const source = `${owner}/${repo}`;
    const detail = await fetchAgentDetail(source, slug);
    res.json({ agent: detail });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

router.post("/agents-sh/install", async (req, res) => {
  try {
    const { source, slug } = req.body;
    if (!source || !slug) return res.status(400).json({ error: "source and slug required" });
    const result = await installAgent(source, slug);

    // Actualizar el cache local del backend e informar al frontend mediante SSE de inmediato
    scan();
    broadcast("update", { lastScan });

    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Desinstala un agente instalado (~/.claude/agents/<name>.md).
router.delete("/agents/:name", async (req, res) => {
  try {
    const result = await uninstallAgent(req.params.name);
    scan();
    broadcast("update", { lastScan });
    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/refresh", (req, res) => {
  scan();
  broadcast("update", { lastScan });
  res.json({ success: true, lastScan });
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
    // Asegurar que el directorio de destino exista antes de inicializar el watcher
    if (!existsSync(dir)) {
      try {
        mkdirSync(dir, { recursive: true });
        console.log(`[Watcher] Pre-created watched directory: ${dir}`);
      } catch (err) {
        console.warn(`[Watcher] Could not pre-create directory ${dir}:`, err);
      }
    }

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


// Remotion Studio: montado como sub-router (ver routes/remotion.js)
router.use("/remotion", remotionRouter);

export default router;

