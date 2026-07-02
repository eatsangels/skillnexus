import { Router } from "express";
import { spawn } from "child_process";
import { join, dirname } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, unlinkSync } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// backend/src/routes -> raíz del proyecto (4 niveles arriba).
const ROOT = join(__dirname, "..", "..", "..", "..");

// El modo local escribe y ejecuta código arbitrario; se puede deshabilitar por entorno.
const ALLOW_LOCAL_REMOTION = process.env.SKILLNEXUS_ALLOW_LOCAL_REMOTION !== "false";

const router = Router();

router.get("/status", (req, res) => {
  const binPath = join(ROOT, ".bin", "belt.exe");
  const cmd = existsSync(binPath) ? binPath : "belt";

  const child = spawn(cmd, ["me"], { shell: false });

  let output = "";
  let responded = false;
  child.stdout.on("data", (data) => (output += data.toString()));
  child.stderr.on("data", (data) => (output += data.toString()));

  // Si el binario `belt` no existe (p. ej. en CI), spawn emite 'error' y sin este
  // manejador la respuesta nunca se cerraría (petición colgada).
  child.on("error", () => {
    if (!responded) {
      responded = true;
      res.json({ loggedIn: false });
    }
  });

  child.on("close", (code) => {
    if (responded) return;
    responded = true;
    if (code === 0) {
      const emailMatch = output.match(/email\s+(.+)/);
      const nameMatch = output.match(/name\s+(.+)/);
      res.json({
        loggedIn: true,
        email: emailMatch ? emailMatch[1].trim() : "Unknown",
        name: nameMatch ? nameMatch[1].trim() : "User",
      });
    } else {
      res.json({ loggedIn: false });
    }
  });
});

router.post("/login", (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: "API key is required" });

  const binPath = join(ROOT, ".bin", "belt.exe");
  const cmd = existsSync(binPath) ? binPath : "belt";

  const child = spawn(cmd, ["login", "--key", key], { shell: false });

  let output = "";
  let responded = false;
  child.stdout.on("data", (data) => (output += data.toString()));
  child.stderr.on("data", (data) => (output += data.toString()));

  child.on("error", (err) => {
    if (!responded) {
      responded = true;
      res.status(500).json({ error: `No se pudo ejecutar belt: ${err.message}` });
    }
  });

  child.on("close", (code) => {
    if (responded) return;
    responded = true;
    if (code === 0) {
      res.json({ success: true, message: "Autenticado con éxito" });
    } else {
      res.status(500).json({ error: `Fallo al iniciar sesión: ${output}` });
    }
  });
});

router.post("/render", async (req, res) => {
  const { code, width = 1920, height = 1080, fps = 30, duration_seconds = 3, mode = "cloud" } = req.body;

  if (mode !== "cloud" && !ALLOW_LOCAL_REMOTION) {
    return res.status(403).json({ error: "El renderizado local está deshabilitado (SKILLNEXUS_ALLOW_LOCAL_REMOTION=false). Usa el modo nube." });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  if (mode === "cloud") {
    const binPath = join(ROOT, ".bin", "belt.exe");
    const cmd = existsSync(binPath) ? binPath : "belt";

    const inputData = {
      code,
      width: Number(width),
      height: Number(height),
      fps: Number(fps),
      duration_seconds: Number(duration_seconds),
    };

    res.write(`data: ${JSON.stringify({ chunk: `> belt app run infsh/remotion-render --input ...\n` })}\n\n`);

    let child;
    try {
      child = spawn(cmd, ["app", "run", "infsh/remotion-render", "--input", JSON.stringify(inputData)], {
        shell: false,
        env: { ...process.env, FORCE_COLOR: "1" },
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
    const tempDir = join(ROOT, ".temp_remotion");
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
          "@types/react-dom": "^18.0.0",
        },
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
            forceConsistentCasingInFileNames: true,
          },
          include: ["**/*.ts", "**/*.tsx"],
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
          shell: true,
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
        shell: true,
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

router.get("/video", (req, res) => {
  const videoPath = join(ROOT, ".temp_remotion", "output.mp4");
  if (existsSync(videoPath)) {
    res.sendFile(videoPath);
  } else {
    res.status(404).json({ error: "Video not found" });
  }
});

// Remotion Studio Local Assets Endpoints
router.get("/assets", (req, res) => {
  const publicDir = join(ROOT, ".temp_remotion", "public");
  if (!existsSync(publicDir)) {
    return res.json({ assets: [] });
  }
  try {
    const files = readdirSync(publicDir);
    const assets = files.map((file) => {
      const filePath = join(publicDir, file);
      const stat = statSync(filePath);
      return {
        name: file,
        size: stat.size,
        createdAt: stat.birthtime || stat.mtime,
      };
    });
    res.json({ assets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/assets/:filename", (req, res) => {
  const assetPath = join(ROOT, ".temp_remotion", "public", req.params.filename);
  if (existsSync(assetPath)) {
    res.sendFile(assetPath);
  } else {
    res.status(404).json({ error: "Asset not found" });
  }
});

router.post("/assets", (req, res) => {
  const { filename, base64Data } = req.body;
  if (!filename || !base64Data) {
    return res.status(400).json({ error: "Filename and base64Data are required" });
  }
  try {
    const publicDir = join(ROOT, ".temp_remotion", "public");
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

router.delete("/assets/:filename", (req, res) => {
  try {
    const assetPath = join(ROOT, ".temp_remotion", "public", req.params.filename);
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
