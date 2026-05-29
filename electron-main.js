const { app, BrowserWindow, Notification } = require("electron");
const { fork } = require("child_process");
const path = require("path");
const { autoUpdater } = require("electron-updater");

let mainWindow;
let backendProcess;

function startBackend() {
  // Path to the backend server file
  const backendPath = path.join(__dirname, "skill-dashboard", "backend", "src", "server.js");
  
  // Fork the backend process so it runs in a background Node process
  backendProcess = fork(backendPath, [], {
    env: { ...process.env, PORT: 3001 },
    stdio: "inherit" // Forward console logs to Electron terminal
  });

  backendProcess.on("exit", (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "ID Skills Dashboard",
    backgroundColor: "#05070b", // Match brandkit canvas background
  });

  // Check if we are in development mode
  const isDev = process.env.ELECTRON_DEV === "true";

  if (isDev) {
    // Load local Vite dev server
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    // Load built production assets
    mainWindow.loadFile(path.join(__dirname, "skill-dashboard", "frontend", "dist", "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Only spin up a new backend if it's packaged (in dev we run concurrently)
  if (app.isPackaged) {
    startBackend();
  }

  createWindow();

  // Initialize auto-updates in production
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
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
});

autoUpdater.on("update-downloaded", (info) => {
  new Notification({
    title: "Actualización lista",
    body: "La nueva versión se aplicará automáticamente al reiniciar."
  }).show();
  autoUpdater.quitAndInstall();
});
