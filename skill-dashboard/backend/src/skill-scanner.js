import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import { join, extname, basename, dirname } from "path";
import matter from "gray-matter";
import AdmZip from "adm-zip";
import { CONFIG } from "./config.js";
import { generateSpanishDescription } from "./translator.js";

function findSkillDirectories(basePath) {
  if (!existsSync(basePath)) return [];
  const results = [];
  try {
    const entries = readdirSync(basePath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillDir = join(basePath, entry.name);
        const skillMd = join(skillDir, "SKILL.md");
        if (existsSync(skillMd)) {
          results.push(skillDir);
        }
      }
    }
  } catch {}
  return results;
}

function findSkillFiles(paths) {
  const results = [];
  for (const basePath of paths) {
    if (!existsSync(basePath)) continue;
    try {
      const entries = readdirSync(basePath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(".skill")) {
          results.push(join(basePath, entry.name));
        }
      }
    } catch {}
  }
  return results;
}

function parseSkillMd(filePath) {
  try {
    const content = readFileSync(filePath, "utf-8");
    const parsed = matter(content);
    return {
      name: parsed.data.name || basename(dirname(filePath)),
      description: parsed.data.description || "",
      body: parsed.content.trim(),
      data: parsed.data,
    };
  } catch (err) {
    // No descartar silenciosamente una skill con frontmatter inválido:
    // registramos el error y devolvemos una entrada mínima basada en el
    // nombre del directorio para que siga contando y sea visible.
    console.error(`[Skill-scanner] Failed to parse ${filePath}:`, err.message);
    return {
      name: basename(dirname(filePath)),
      description: "",
      body: "",
      data: {},
      parseError: err.message,
    };
  }
}

function parseSkillFromZip(zipPath) {
  try {
    const zip = new AdmZip(zipPath);
    const entry = zip.getEntry("SKILL.md");
    if (!entry) return null;
    const content = entry.getData().toString("utf-8");
    const parsed = matter(content);
    const entries = zip.getEntries().map((e) => e.entryName);
    const frameworks = entries
      .filter((e) => e.startsWith("references/frameworks/") && e.endsWith(".md"))
      .map((e) => basename(e, ".md"));
    return {
      name: parsed.data.name || basename(zipPath, ".skill"),
      description: parsed.data.description || "",
      body: parsed.content.trim(),
      data: parsed.data,
      frameworks,
      assets: entries.filter((e) => e.startsWith("assets/") && !e.endsWith("/")),
      references: entries.filter((e) => e.startsWith("references/") && !e.endsWith("/")),
    };
  } catch {
    return null;
  }
}

function extractSkillFromDirectory(skillDir) {
  const skillMd = join(skillDir, "SKILL.md");
  if (!existsSync(skillMd)) return null;
  const parsed = parseSkillMd(skillMd);
  if (!parsed) return null;
  const assetsDir = join(skillDir, "assets");
  const refsDir = join(skillDir, "references");
  const frameworksDir = join(refsDir, "frameworks");
  const frameworks = [];
  if (existsSync(frameworksDir)) {
    try {
      const entries = readdirSync(frameworksDir);
      for (const entry of entries) {
        if (entry.endsWith(".md")) frameworks.push(basename(entry, ".md"));
      }
    } catch {}
  }
  const assets = [];
  if (existsSync(assetsDir)) {
    try {
      for (const entry of readdirSync(assetsDir)) {
        if (!statSync(join(assetsDir, entry)).isDirectory()) {
          assets.push(join("assets", entry));
        }
      }
    } catch {}
  }
  const references = [];
  if (existsSync(refsDir)) {
    try {
      for (const entry of readdirSync(refsDir, { recursive: true })) {
        if (extname(entry) === ".md" && !entry.startsWith("frameworks")) {
          references.push(join("references", entry.toString()));
        }
      }
    } catch {}
  }
  return {
    name: parsed.name,
    description: parsed.description,
    body: parsed.body,
    data: parsed.data,
    format: "directory",
    location: skillDir,
    frameworks,
    assets,
    references,
    lastModified: statSync(skillMd).mtime.toISOString(),
  };
}

function extractSkillFromZipFile(zipPath) {
  const result = parseSkillFromZip(zipPath);
  if (!result) return null;
  return {
    ...result,
    format: "zip",
    location: zipPath,
    lastModified: statSync(zipPath).mtime.toISOString(),
  };
}

// Garantiza un nombre único para la skill sin descartarla por colisión.
// Cada skill vive en una ubicación única del sistema de archivos, así que
// usamos el nombre de su carpeta/archivo como base para desambiguar.
function ensureUniqueSkillName(skill, seen) {
  if (!seen.has(skill.name)) {
    seen.add(skill.name);
    return;
  }
  const base = basename(skill.location).replace(/\.skill$/, "") || skill.name;
  let unique = base;
  let counter = 2;
  while (seen.has(unique)) {
    unique = `${base}-${counter++}`;
  }
  seen.add(unique);
  skill.name = unique;
}

export function scanSkills() {
  const skills = [];
  const seen = new Set();
  for (const dir of CONFIG.scanPaths.skillDirectories) {
    const skillDirs = findSkillDirectories(dir);
    for (const skillDir of skillDirs) {
      const skill = extractSkillFromDirectory(skillDir);
      if (skill) {
        ensureUniqueSkillName(skill, seen);
        skills.push(skill);
      }
    }
  }
  const skillFiles = findSkillFiles(CONFIG.scanPaths.skillFiles);
  for (const zipPath of skillFiles) {
    const skill = extractSkillFromZipFile(zipPath);
    if (skill) {
      ensureUniqueSkillName(skill, seen);
      skills.push(skill);
    }
  }
  for (const s of skills) {
    const originalDesc = s.description || "";
    const spanishDesc = generateSpanishDescription(s.name, "local", "Frontend");
    s.descriptionEn = originalDesc;
    s.descriptionEs = spanishDesc;
  }
  return skills;
}
