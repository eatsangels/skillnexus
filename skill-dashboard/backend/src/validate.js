// Validación de entrada para evitar inyección de comandos y datos malformados.
// Los `source`/`slug` se usan al invocar procesos externos (npx skills), así que
// deben cumplir un formato estricto ANTES de pasarse a execFile/spawn.

// owner/repo de GitHub: letras, números, punto, guion y guion bajo.
const REPO_RE = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;
// slug de skill/agente: sin separadores de ruta ni caracteres de shell.
const SLUG_RE = /^[A-Za-z0-9._-]+$/;

export function isValidRepo(source) {
  return typeof source === "string" && source.length <= 200 && REPO_RE.test(source);
}

export function isValidSlug(slug) {
  return typeof slug === "string" && slug.length <= 120 && SLUG_RE.test(slug);
}

// Valida el par source/slug y devuelve { ok, error }.
export function validateInstallInput(source, slug) {
  if (!isValidRepo(source)) {
    return { ok: false, error: "Parámetro 'source' inválido (formato esperado: owner/repo)" };
  }
  if (!isValidSlug(slug)) {
    return { ok: false, error: "Parámetro 'slug' inválido (solo letras, números, . _ -)" };
  }
  return { ok: true };
}
