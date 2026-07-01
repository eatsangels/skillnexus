import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn } from "child_process";
import { setTimeout as sleep } from "timers/promises";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, "..", "src", "server.js");
const PORT = 3099;
const BASE = `http://localhost:${PORT}/api`;

let child;

async function waitForHealth(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) return true;
    } catch {
      // aún no listo
    }
    await sleep(300);
  }
  return false;
}

describe("smoke del servidor HTTP", () => {
  beforeAll(async () => {
    child = spawn(process.execPath, [serverPath], {
      env: { ...process.env, PORT: String(PORT) },
      stdio: "ignore",
    });
    const up = await waitForHealth();
    if (!up) throw new Error("El servidor no respondió a /health a tiempo");
  }, 20000);

  afterAll(() => {
    if (child) child.kill();
  });

  it("/health responde ok con puerto y versión", async () => {
    const res = await fetch(`${BASE}/health`);
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(j.port).toBe(PORT);
    expect(typeof j.version).toBe("string");
  });

  it("/dashboard, /agents, /skills y /remotion/status responden 200", async () => {
    for (const path of ["dashboard", "agents", "skills", "remotion/status"]) {
      const res = await fetch(`${BASE}/${path}`);
      expect(res.status).toBe(200);
    }
  });

  it("instalar con source inválido devuelve 400/500 (validación anti inyección)", async () => {
    const res = await fetch(`${BASE}/skills-sh/install`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "foo/bar; rm -rf ~", slug: "x" }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
