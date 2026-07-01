import { Router } from "express";
import { spawn } from "child_process";
import { scanSkills } from "./skill-scanner.js";
import { scanAgents } from "./agent-scanner.js";
import { getCatalog, refreshCatalog, searchSkills, fetchSkillDetail, installSkill, onCatalogRefreshed } from "./skills-sh-scanner.js";
import { getAgentsCatalog, refreshAgentsCatalog, searchAgents, fetchAgentDetail, installAgent, onAgentsCatalogRefreshed } from "./agents-sh-scanner.js";
import { homedir } from "os";
import { join, dirname } from "path";
import { CONFIG } from "./config.js";
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


// Remotion Studio API Endpoints
router.get("/remotion/status", (req, res) => {
  const binPath = join(__dirname, "..", "..", "..", ".bin", "belt.exe");
  const cmd = existsSync(binPath) ? binPath : "belt";

  const child = spawn(cmd, ["me"], {
    shell: false
  });

  let output = "";
  child.stdout.on("data", (data) => output += data.toString());
  child.stderr.on("data", (data) => output += data.toString());

  child.on("close", (code) => {
    if (code === 0) {
      const emailMatch = output.match(/email\s+(.+)/);
      const nameMatch = output.match(/name\s+(.+)/);
      res.json({
        loggedIn: true,
        email: emailMatch ? emailMatch[1].trim() : "Unknown",
        name: nameMatch ? nameMatch[1].trim() : "User"
      });
    } else {
      res.json({ loggedIn: false });
    }
  });
});

router.post("/remotion/login", (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: "API key is required" });

  const binPath = join(__dirname, "..", "..", "..", ".bin", "belt.exe");
  const cmd = existsSync(binPath) ? binPath : "belt";

  const child = spawn(cmd, ["login", "--key", key], {
    shell: false
  });

  let output = "";
  child.stdout.on("data", (data) => output += data.toString());
  child.stderr.on("data", (data) => output += data.toString());

  child.on("close", (code) => {
    if (code === 0) {
      res.json({ success: true, message: "Autenticado con éxito" });
    } else {
      res.status(500).json({ error: `Fallo al iniciar sesión: ${output}` });
    }
  });
});

router.post("/remotion/render", async (req, res) => {
  const { code, width = 1920, height = 1080, fps = 30, duration_seconds = 3, mode = "cloud" } = req.body;

  // El modo local escribe y ejecuta código arbitrario (Main.tsx) en la máquina.
  // Se puede deshabilitar por entorno; el modo nube (por defecto) no se ve afectado.
  if (mode !== "cloud" && !ALLOW_LOCAL_REMOTION) {
    return res.status(403).json({ error: "El renderizado local está deshabilitado (SKILLNEXUS_ALLOW_LOCAL_REMOTION=false). Usa el modo nube." });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  if (mode === "cloud") {
    const binPath = join(__dirname, "..", "..", "..", ".bin", "belt.exe");
    const cmd = existsSync(binPath) ? binPath : "belt";

    const inputData = {
      code,
      width: Number(width),
      height: Number(height),
      fps: Number(fps),
      duration_seconds: Number(duration_seconds)
    };

    res.write(`data: ${JSON.stringify({ chunk: `> belt app run infsh/remotion-render --input ...\n` })}\n\n`);

    let child;
    try {
      child = spawn(cmd, ["app", "run", "infsh/remotion-render", "--input", JSON.stringify(inputData)], {
        shell: false,
        env: { ...process.env, FORCE_COLOR: "1" }
      });
    } catch (err) {
      res.write(`data: ${JSON.stringify({ chunk: `Error al iniciar: ${err.message}\n` })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true, code: 1 })}\n\n`);
      res.end();
      return;
    }

    let stdoutBuffer = "";
    child.stdout.on("data", (data) => {
      const str = data.toString();
      stdoutBuffer += str;
      res.write(`data: ${JSON.stringify({ chunk: str })}\n\n`);
    });

    child.stderr.on("data", (data) => {
      res.write(`data: ${JSON.stringify({ chunk: data.toString(), type: "stderr" })}\n\n`);
    });

    child.on("close", (code) => {
      let videoUrl = null;
      const urls = stdoutBuffer.match(/https?:\/\/[^\s"'`<>]+/g);
      if (urls && urls.length > 0) {
        videoUrl = urls[urls.length - 1];
      }
      res.write(`data: ${JSON.stringify({ done: true, code, videoUrl })}\n\n`);
      res.end();
    });

    res.on("close", () => {
      if (child) child.kill();
    });
  } else {
    const tempDir = join(__dirname, "..", "..", "..", ".temp_remotion");
    res.write(`data: ${JSON.stringify({ chunk: `> Iniciando renderizado local en: ${tempDir}\n` })}\n\n`);

    try {
      if (!existsSync(tempDir)) {
        mkdirSync(tempDir, { recursive: true });
      }

      const pkgPath = join(tempDir, "package.json");
      const tsconfigPath = join(tempDir, "tsconfig.json");
      let needsInstall = !existsSync(join(tempDir, "node_modules"));
      
      const pkgContent = {
        name: "temp-remotion-render",
        version: "1.0.0",
        private: true,
        dependencies: {
          "remotion": "^4.0.0",
          "@remotion/cli": "^4.0.0",
          "react": "^18.0.0",
          "react-dom": "^18.0.0",
          "maplibre-gl": "^4.0.0",
          "@turf/turf": "^7.0.0",
          "@types/react": "^18.0.0",
          "@types/react-dom": "^18.0.0"
        }
      };

      if (!existsSync(tsconfigPath)) {
        const tsconfigContent = {
          compilerOptions: {
            target: "es2020",
            module: "esnext",
            moduleResolution: "node",
            jsx: "react-jsx",
            strict: false,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true
          },
          include: ["**/*.ts", "**/*.tsx"]
        };
        writeFileSync(tsconfigPath, JSON.stringify(tsconfigContent, null, 2));
      }

      if (existsSync(pkgPath)) {
        try {
          const currentPkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
          if (
            !currentPkg.dependencies ||
            !currentPkg.dependencies["maplibre-gl"] ||
            !currentPkg.dependencies["@types/react"]
          ) {
            needsInstall = true;
          }
        } catch (e) {
          needsInstall = true;
        }
      } else {
        needsInstall = true;
      }

      if (needsInstall) {
        res.write(`data: ${JSON.stringify({ chunk: `Instalando o actualizando dependencias de Remotion localmente (puede demorar un poco)...\n` })}\n\n`);
        writeFileSync(pkgPath, JSON.stringify(pkgContent, null, 2));

        res.write(`data: ${JSON.stringify({ chunk: `> npm install --no-audit --no-fund\n` })}\n\n`);
        const installChild = spawn("npm", ["install", "--no-audit", "--no-fund"], {
          cwd: tempDir,
          shell: true
        });

        await new Promise((resolve, reject) => {
          installChild.stdout.on("data", (data) => {
            res.write(`data: ${JSON.stringify({ chunk: data.toString() })}\n\n`);
          });
          installChild.stderr.on("data", (data) => {
            res.write(`data: ${JSON.stringify({ chunk: data.toString(), type: "stderr" })}\n\n`);
          });
          installChild.on("close", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`npm install failed with exit code ${code}`));
          });
        });
        res.write(`data: ${JSON.stringify({ chunk: `✓ Dependencias instaladas con éxito.\n` })}\n\n`);
      }

      writeFileSync(join(tempDir, "Main.tsx"), code);

      const durationInFrames = Math.floor(Number(duration_seconds) * Number(fps));
      const entryContent = `import { registerRoot, Composition } from 'remotion';
import Main from './Main';

const Root = () => {
  return (
    <Composition
      id="main"
      component={Main}
      durationInFrames={${durationInFrames}}
      fps={${fps}}
      width={${width}}
      height={${height}}
    />
  );
};

registerRoot(Root);
`;
      writeFileSync(join(tempDir, "index.tsx"), entryContent);

      res.write(`data: ${JSON.stringify({ chunk: `> npx remotion render index.tsx main output.mp4 --overwrite\n` })}\n\n`);
      const renderChild = spawn("npx", ["remotion", "render", "index.tsx", "main", "output.mp4", "--overwrite"], {
        cwd: tempDir,
        shell: true
      });

      renderChild.stdout.on("data", (data) => {
        res.write(`data: ${JSON.stringify({ chunk: data.toString() })}\n\n`);
      });

      renderChild.stderr.on("data", (data) => {
        res.write(`data: ${JSON.stringify({ chunk: data.toString(), type: "stderr" })}\n\n`);
      });

      renderChild.on("close", (code) => {
        res.write(`data: ${JSON.stringify({ done: true, code, localVideo: true })}\n\n`);
        res.end();
      });

      res.on("close", () => {
        if (renderChild) renderChild.kill();
      });

    } catch (err) {
      res.write(`data: ${JSON.stringify({ chunk: `Error durante renderizado local: ${err.message}\n` })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true, code: 1 })}\n\n`);
      res.end();
    }
  }
});

router.get("/remotion/video", (req, res) => {
  const videoPath = join(__dirname, "..", "..", "..", ".temp_remotion", "output.mp4");
  if (existsSync(videoPath)) {
    res.sendFile(videoPath);
  } else {
    res.status(404).json({ error: "Video not found" });
  }
});

// Remotion Studio Local Assets Endpoints
router.get("/remotion/assets", (req, res) => {
  const tempDir = join(__dirname, "..", "..", "..", ".temp_remotion");
  const publicDir = join(tempDir, "public");
  if (!existsSync(publicDir)) {
    return res.json({ assets: [] });
  }
  try {
    const files = readdirSync(publicDir);
    const assets = files.map(file => {
      const filePath = join(publicDir, file);
      const stat = statSync(filePath);
      return {
        name: file,
        size: stat.size,
        createdAt: stat.birthtime || stat.mtime
      };
    });
    res.json({ assets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/remotion/assets/:filename", (req, res) => {
  const assetPath = join(__dirname, "..", "..", "..", ".temp_remotion", "public", req.params.filename);
  if (existsSync(assetPath)) {
    res.sendFile(assetPath);
  } else {
    res.status(404).json({ error: "Asset not found" });
  }
});

router.post("/remotion/assets", (req, res) => {
  const { filename, base64Data } = req.body;
  if (!filename || !base64Data) {
    return res.status(400).json({ error: "Filename and base64Data are required" });
  }
  try {
    const tempDir = join(__dirname, "..", "..", "..", ".temp_remotion");
    const publicDir = join(tempDir, "public");
    if (!existsSync(publicDir)) {
      mkdirSync(publicDir, { recursive: true });
    }
    const buffer = Buffer.from(base64Data, "base64");
    const dest = join(publicDir, filename);
    writeFileSync(dest, buffer);
    res.json({ success: true, filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/remotion/assets/:filename", (req, res) => {
  try {
    const assetPath = join(__dirname, "..", "..", "..", ".temp_remotion", "public", req.params.filename);
    if (existsSync(assetPath)) {
      unlinkSync(assetPath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Asset not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

