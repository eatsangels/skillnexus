const { app, BrowserWindow, Notification, dialog } = require("electron");
const { fork } = require("child_process");
const path = require("path");
const http = require("http");
const { autoUpdater } = require("electron-updater");

let mainWindow;
let backendProcess;
let backendPort = 3001;
const PORT_MIN = 3001;
const PORT_MAX = 3021;

// Comprueba si ya hay un backend de SkillNexus vivo en un puerto (evita forkear uno que choque).
function probeHealth(port) {
  return new Promise((resolve) => {
    const req = http.get({ host: "127.0.0.1", port, path: "/api/health", timeout: 500 }, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try {
          const j = JSON.parse(body);
          resolve(j && j.ok ? port : null);
        } catch {
          resolve(null);
        }
      });
    });
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
  });
}

async function findExistingBackend() {
  for (let p = PORT_MIN; p <= PORT_MAX; p++) {
    // eslint-disable-next-line no-await-in-loop
    const found = await probeHealth(p);
    if (found) return found;
  }
  return null;
}

// Arranca el backend (o reutiliza uno existente) y resuelve con el puerto activo.
function startBackend() {
  return new Promise(async (resolve) => {
    // 1. Reutilizar un backend ya en marcha si existe (p. ej. otra ventana o el modo dev).
    const existing = await findExistingBackend();
    if (existing) {
      console.log(`[Electron] Reusando backend existente en puerto ${existing}`);
      backendPort = existing;
      return resolve(existing);
    }

    // 2. Forkear uno nuevo.
    const backendPath = app.isPackaged
      ? path.join(process.resourcesPath, "app.asar", "skill-dashboard", "backend", "src", "server.js")
      : path.join(__dirname, "skill-dashboard", "backend", "src", "server.js");
    const nodeModulesPath = app.isPackaged
      ? path.join(process.resourcesPath, "app.asar", "node_modules")
      : path.join(__dirname, "node_modules");

    backendProcess = fork(backendPath, [], {
      env: { ...process.env, PORT: String(PORT_MIN), NODE_PATH: nodeModulesPath },
      stdio: "inherit",
    });

    let resolved = false;
    const settle = (port) => {
      if (!resolved) {
        resolved = true;
        backendPort = port;
        resolve(port);
      }
    };

    backendProcess.on("exit", (code) => {
      console.log(`Backend process exited with code ${code}`);
      backendProcess = null;
    });

    backendProcess.on("message", (msg) => {
      if (!msg || !msg.type) return;
      if (msg.type === "backend-port") {
        console.log(`[Electron] Backend escuchando en puerto ${msg.port}`);
        settle(msg.port);
      } else if (msg.type === "apply-update") {
        console.log("[Electron] Applying update requested by backend process...");
        autoUpdater.quitAndInstall();
      } else if (msg.type === "backend-error") {
        console.error("[Electron] Backend no pudo iniciar:", msg.error);
      }
    });

    // Salvaguarda: si en 8s no llegó el puerto por IPC, asumir el puerto por defecto.
    setTimeout(() => settle(PORT_MIN), 8000);
  });
}

function createWindow() {
  const iconPath = app.isPackaged
    ? path.join(__dirname, "skill-dashboard", "frontend", "dist", "logo.png")
    : path.join(__dirname, "skill-dashboard", "frontend", "public", "logo.png");

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "SkillNexus",
    icon: iconPath,
    backgroundColor: "#05070b", // Match brandkit canvas background
  });

  // Open external links in the user's default system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      require("electron").shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  // Check if we are in development mode
  const isDev = process.env.ELECTRON_DEV === "true";

  if (isDev) {
    // Load local Vite dev server
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    // Load built production assets, pasando el puerto del backend como query param
    // para que el frontend (file://) sepa a qué puerto conectarse tras el fallback.
    mainWindow.loadFile(path.join(__dirname, "skill-dashboard", "frontend", "dist", "index.html"), {
      query: { port: String(backendPort) },
    });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // En producción, forkeamos (o reutilizamos) el backend y esperamos su puerto antes de abrir la ventana.
  // En dev, el backend se levanta aparte (concurrently) en 3001 y el frontend usa el proxy de Vite.
  if (app.isPackaged) {
    try {
      await startBackend();
    } catch (err) {
      console.error("[Electron] Error arrancando backend:", err);
    }
  }

  createWindow();

  // Initialize auto-updates in production
  if (app.isPackaged) {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error("Auto updater error:", err);
    });
  }
});

// Clean up background backend process when app is quitting
app.on("will-quit", () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Auto-updater event handling
autoUpdater.on("update-available", (info) => {
  new Notification({
    title: "Actualización disponible",
    body: `La versión ${info.version} se está descargando en segundo plano.`
  }).show();

  if (backendProcess && backendProcess.connected) {
    backendProcess.send({ type: "update-available", version: info.version });
  }
});

autoUpdater.on("update-downloaded", (info) => {
  new Notification({
    title: "Actualización lista",
    body: `La versión ${info.version} ya se ha descargado y está lista para instalar.`
  }).show();

  if (backendProcess && backendProcess.connected) {
    backendProcess.send({ type: "update-downloaded", version: info.version });
  }
});

autoUpdater.on("error", (err) => {
  console.error("Auto updater error:", err);
  if (backendProcess && backendProcess.connected) {
    backendProcess.send({
      type: "update-error",
      error: err ? (err.message || String(err)) : "Error desconocido"
    });
  }
});
