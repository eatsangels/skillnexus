// Helper centralizado para llamadas a la API de GitHub.
// - Usa GITHUB_TOKEN si está disponible (sube el límite de 60 a 5000 req/hora).
// - Detecta y avisa cuando se agota el rate-limit en vez de fallar en silencio.

let rateLimited = false;
let rateLimitResetAt = 0;

export function getRateLimitState() {
  return { rateLimited, rateLimitResetAt };
}

// Devuelve las cabeceras estándar (con Authorization si hay token).
export function githubHeaders(extra = {}) {
  const headers = {
    "User-Agent": "SkillNexus",
    Accept: "application/vnd.github+json",
    ...extra,
  };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

// fetch envolvente para la API de GitHub que respeta y reporta el rate-limit.
export async function githubFetch(url, options = {}) {
  // Si estamos limitados y aún no llega el reset, evitamos gastar más llamadas.
  if (rateLimited && Date.now() < rateLimitResetAt) {
    const err = new Error("GitHub rate-limit alcanzado. Configura GITHUB_TOKEN para subir el límite.");
    err.code = "RATE_LIMITED";
    throw err;
  }

  const res = await fetch(url, { ...options, headers: githubHeaders(options.headers) });

  const remaining = Number(res.headers.get("x-ratelimit-remaining"));
  const reset = Number(res.headers.get("x-ratelimit-reset"));
  if (!Number.isNaN(remaining) && remaining <= 0) {
    rateLimited = true;
    rateLimitResetAt = (!Number.isNaN(reset) ? reset * 1000 : Date.now() + 60_000);
    console.warn(`[GitHub] Rate-limit agotado. Se reanuda ~${new Date(rateLimitResetAt).toLocaleTimeString()}. Configura GITHUB_TOKEN.`);
  } else if (remaining > 0) {
    rateLimited = false;
  }

  if (res.status === 403 && remaining === 0) {
    const err = new Error("GitHub rate-limit (403). Configura GITHUB_TOKEN.");
    err.code = "RATE_LIMITED";
    throw err;
  }

  return res;
}
