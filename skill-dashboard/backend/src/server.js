import express from "express";
import cors from "cors";
import apiRouter, { setActivePort } from "./api.js";
import { CONFIG } from "./config.js";

const app = express();

// CORS restringido a orígenes locales (dev en localhost y la app empaquetada en file://).
app.use(cors({
  origin(origin, cb) {
    // Sin Origin (curl, same-origin, file://) o localhost en cualquier puerto.
    if (!origin || origin === "null" || /^https?:\/\/localhost(:\d+)?$/i.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/i.test(origin)) {
      return cb(null, true);
    }
    return cb(null, false);
  },
}));
app.use(express.json({ limit: "50mb" }));
app.use("/api", apiRouter);

app.get("/", (_req, res) => {
  res.json({
    name: "Skill & Agent Dashboard API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      skills: "/api/skills",
      skillDetail: "/api/skills/:name",
      agents: "/api/agents",
      agentDetail: "/api/agents/:name",
      dashboard: "/api/dashboard",
      refresh: "/api/refresh",
    },
  });
});

// Manejadores globales: un error en un scan o una promesa rechazada NO debe tumbar el backend.
process.on("uncaughtException", (err) => {
  console.error("[Server] uncaughtException (continuando):", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[Server] unhandledRejection (continuando):", reason);
});

// Intenta escuchar en `port`; si está ocupado (EADDRINUSE), prueba el siguiente hasta maxPort.
function listenWithFallback(port, maxPort) {
  const server = app.listen(port, () => {
    setActivePort(port);
    console.log(`API running at http://localhost:${port}`);
    console.log(`Endpoints:`);
    console.log(`  health    -> http://localhost:${port}/api/health`);
    console.log(`  skills    -> http://localhost:${port}/api/skills`);
    console.log(`  agents    -> http://localhost:${port}/api/agents`);
    console.log(`  dashboard -> http://localhost:${port}/api/dashboard`);
    // Informar el puerto elegido al proceso padre (Electron) por IPC, si aplica.
    if (process.send) {
      try {
        process.send({ type: "backend-port", port });
      } catch (e) {
        console.error("[Server] No se pudo notificar el puerto al padre:", e);
      }
    }
  });

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE" && port < maxPort) {
      console.warn(`[Server] Puerto ${port} ocupado, probando ${port + 1}...`);
      listenWithFallback(port + 1, maxPort);
    } else {
      console.error(`[Server] No se pudo iniciar en ningún puerto (${CONFIG.port}-${maxPort}):`, err);
      if (process.send) {
        try { process.send({ type: "backend-error", error: err.message }); } catch {}
      }
    }
  });
}

listenWithFallback(CONFIG.port, CONFIG.portMax);
