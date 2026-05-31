import { exec } from "child_process";
import { generateSpanishDescription } from "./translator.js";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { homedir } from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CACHE_DIR = join(homedir(), ".config", "opencode");
try {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (mkdirErr) {
  console.error("[Skills-sh] Failed to create cache directory:", mkdirErr);
}
const CACHE_FILE_PATH = join(CACHE_DIR, "skills-catalog-cache.json");

const KNOWN_SOURCES = [
  "vercel-labs/agent-skills",
  "vercel-labs/skills",
  "anthropics/skills",
  "microsoft/azure-skills",
  "mattpocock/skills",
  "supabase/agent-skills",
  "firebase/agent-skills",
  "obra/superpowers",
  "skills-shell/skills",
  "agentspace-so/agent-skills",
  "agentspace-so/runcomfy-agent-skills",
  "larksuite/cli",
  "open.feishu.cn",
  "xixu-me/skills",
  "juliusbrussee/caveman",
  "pbakaus/impeccable",
  "coreyhaines31/marketingskills",
  "leonxlnx/taste-skill",
  "nextlevelbuilder/ui-ux-pro-max-skill",
  "heygen-com/hyperframes",
  "browser-use/browser-use",
  "sleekdotdesign/agent-skills",
  "sentry/dev",
  "doany-ai/skills",
  "runcomfy-com/skills",
  "scrapegraphai/just-scrape",
  "firecrawl/cli",
  "soultrace-ai/soultrace-skill",
  "emilkowalski/skill",
  "roin-orca/skills",
  "remotion-dev/skills",
  "equinor/fusion-skills",
  "bhancockio/skills",
  "clayscii/skills",
  "altitudehq/skills",
  "n8n-io/n8n-skills",
];

const CATEGORY_KEYWORDS = [
  { name: "Backend", keywords: ["api", "server", "database", "backend", "rest", "graphql", "microservice", "auth", "authentication", "lambda", "function", "endpoint", "middleware", "sql", "nosql", "postgres", "mongodb", "redis", "queue", "webhook"] },
  { name: "Frontend", keywords: ["react", "vue", "angular", "svelte", "frontend", "ui", "component", "css", "html", "tailwind", "javascript", "typescript", "nextjs", "nuxt", "jsx", "state", "redux", "router", "spa", "responsive", "web"] },
  { name: "Design", keywords: ["design", "ui/ux", "ux", "figma", "sketch", "color", "typography", "layout", "visual", "aesthetic", "brand", "style", "theme", "css design", "art", "creative", "animation"] },
  { name: "Marketing", keywords: ["marketing", "seo", "content", "social", "campaign", "analytics", "email", "newsletter", "landing page", "copywriting", "brand", "growth"] },
  { name: "Sales", keywords: ["sales", "crm", "pipeline", "proposal", "outreach", "lead", "customer", "quote"] },
  { name: "Gaming", keywords: ["game", "gaming", "unity", "unreal", "shader", "3d", "webgl", "canvas", "sprite", "physics", "multiplayer"] },
  { name: "AI/ML", keywords: ["ai", "ml", "machine learning", "deep learning", "llm", "gpt", "claude", "openai", "model", "train", "inference", "prompt", "embedding", "rag", "tensorflow", "pytorch", "neural", "nlp", "vision"] },
  { name: "DevOps", keywords: ["devops", "ci/cd", "docker", "kubernetes", "k8s", "deploy", "infrastructure", "terraform", "ansible", "jenkins", "github action", "pipeline", "monitoring", "observability"] },
  { name: "Security", keywords: ["security", "audit", "vulnerability", "compliance", "encrypt", "auth", "oauth", "jwt", "threat", "risk", "pentest"] },
  { name: "Data", keywords: ["data", "analytics", "etl", "pipeline", "dashboard", "report", "sql", "query", "warehouse", "lake", "spark", "hadoop", "bi", "visualization"] },
  { name: "Legal/HR", keywords: ["legal", "hr", "contract", "compliance", "policy", "recruit", "onboarding", "document", "review"] },
  { name: "Support", keywords: ["support", "ticket", "faq", "customer", "help", "sla", "service desk"] },
  { name: "Mobile/XR", keywords: ["mobile", "ios", "android", "react native", "flutter", "swift", "kotlin", "xr", "ar", "vr", "reality", "spatial", "gesture"] },
];

function classifySkill(name, source, desc) {
  const text = `${name} ${source} ${desc || ""}`.toLowerCase();
  const scores = CATEGORY_KEYWORDS.map((c) => ({
    name: c.name,
    score: c.keywords.filter((kw) => text.includes(kw)).length,
  }));
  scores.sort((a, b) => b.score - a.score);
  return scores[0]?.score > 0 ? scores[0].name : "Other";
}

let catalogCache = [];
let catalogTime = null;
const CACHE_TTL = 10 * 60 * 1000;
let onCatalogRefreshedCallback = null;

export function onCatalogRefreshed(cb) {
  onCatalogRefreshedCallback = cb;
}

try {
  if (existsSync(CACHE_FILE_PATH)) {
    const data = readFileSync(CACHE_FILE_PATH, "utf-8").replace(/^\uFEFF/, "");
    catalogCache = JSON.parse(data);
    catalogTime = Date.now();
    console.log(`[Skills-sh] Loaded ${catalogCache.length} skills from persistent cache.`);
  }
} catch (err) {
  console.error("[Skills-sh] Error loading cache file:", err);
}

function stripAnsi(str) {
  return str.replace(/\u001b\[.*?m/g, "").trim();
}

// Promisified execution helper
function executeCommand(command, timeout = 60000) {
  return new Promise((resolve) => {
    exec(command, { timeout, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        resolve(stdout || stderr || "");
      } else {
        resolve(stdout);
      }
    });
  });
}

// Concurrency helper
async function runWithConcurrency(tasks, limit) {
  const results = [];
  const executing = [];
  for (const task of tasks) {
    const p = Promise.resolve().then(() => task());
    results.push(p);
    if (limit <= tasks.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(results);
}

async function fetchSourceSkills(source) {
  try {
    const out = await executeCommand(`npx skills add ${source} --list --yes 2>&1`, 90000);
    const clean = stripAnsi(out);
    const lines = clean.split("\n");
    let inSkills = false;
    let currentSkill = null;
    let currentDesc = "";
    const sourceSkills = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Detectar inicio de la sección de skills
      if (trimmed.includes("Available Skills")) {
        inSkills = true;
        continue;
      }
      if (!inSkills) continue;
      if (trimmed.startsWith("Use --skill") || trimmed.startsWith("Install a skill")) break;
      if (!trimmed || trimmed === "|") continue;

      // Detectar nombre del skill: líneas tipo "| skill-name" o "|    skill-name"
      // El CLI puede variar el número de espacios entre | y el nombre
      const skillMatch = trimmed.match(/^\|\s+([\w][\w-]*)$/);
      if (skillMatch) {
        if (currentSkill) {
          sourceSkills.push({
            id: `${source}/${currentSkill}`,
            name: currentSkill,
            slug: currentSkill,
            source,
            installs: 0,
            description: currentDesc || null,
            category: classifySkill(currentSkill, source, currentDesc || ""),
            url: `https://skills.sh/${source}/${currentSkill}`,
            installUrl: `https://github.com/${source}`,
            topic: null,
          });
        }
        currentSkill = skillMatch[1];
        currentDesc = "";
      } else if (currentSkill && trimmed.startsWith("|") && !trimmed.match(/^\|\s{4}[\w-]+$/)) {
        const text = trimmed.replace(/^\|\s*/, "").trim();
        if (text) currentDesc += (currentDesc ? " " : "") + text;
      }
    }
    if (currentSkill) {
      sourceSkills.push({
        id: `${source}/${currentSkill}`,
        name: currentSkill,
        slug: currentSkill,
        source,
        installs: 0,
        description: currentDesc || null,
        category: classifySkill(currentSkill, source, currentDesc || ""),
        url: `https://skills.sh/${source}/${currentSkill}`,
        installUrl: `https://github.com/${source}`,
        topic: null,
      });
    }
    return sourceSkills;
  } catch {
    return [];
  }
}

export function getCatalog(force = false) {
  if (!force && catalogCache.length > 0 && catalogTime && Date.now() - catalogTime < CACHE_TTL) {
    return catalogCache;
  }

  // Trigger background refresh if cache is empty or expired, but do not block
  if (catalogCache.length === 0 || !catalogTime || Date.now() - catalogTime >= CACHE_TTL) {
    console.log("[Skills-sh] Cache expired or empty. Triggering background refresh...");
    if (!global.isRefreshingCatalog) {
      global.isRefreshingCatalog = true;
      refreshCatalog()
        .then(() => {
          console.log("[Skills-sh] Background refresh completed successfully.");
        })
        .catch((err) => {
          console.error("[Skills-sh] Background refresh failed:", err);
        })
        .finally(() => {
          global.isRefreshingCatalog = false;
        });
    }
  }

  return catalogCache;
}

export async function refreshCatalog() {
  const tasks = KNOWN_SOURCES.map((source) => () => fetchSourceSkills(source));
  const results = await runWithConcurrency(tasks, 6);
  const all = results.flat();

  catalogCache = all.filter((s, i, a) => a.findIndex((x) => x.id === s.id) === i);
  catalogTime = Date.now();
  for (const skill of catalogCache) {
    const originalDesc = skill.description || "";
    const spanishDesc = generateSpanishDescription(skill.name, skill.source, skill.category);
    skill.descriptionEn = originalDesc;
    skill.descriptionEs = spanishDesc;
    skill.description = spanishDesc;
  }

  // Save to persistent cache file
  try {
    writeFileSync(CACHE_FILE_PATH, JSON.stringify(catalogCache, null, 2), "utf-8");
    console.log(`[Skills-sh] Saved ${catalogCache.length} skills to persistent cache file.`);
  } catch (err) {
    console.error("[Skills-sh] Failed to save persistent cache file:", err);
  }

  if (onCatalogRefreshedCallback) {
    try {
      console.log("[Skills-sh] Triggering onCatalogRefreshed callback...");
      onCatalogRefreshedCallback();
    } catch (cbErr) {
      console.error("[Skills-sh] Error in onCatalogRefreshed callback:", cbErr);
    }
  }

  return catalogCache;
}

export async function searchSkills(query) {
  try {
    const out = await executeCommand(`npx skills find "${query}" 2>&1`, 15000);
    const clean = stripAnsi(out);
    const results = [];
    const lines = clean.split("\n");
    for (const line of lines) {
      const m = line.match(/^([\w.-]+\/[\w.-]+)@(\S+)\s+([\d,]+)\s+installs/);
      if (m) {
        const source = m[1];
        const slug = m[2];
        results.push({
          id: `${source}/${slug}`,
          name: slug,
          slug,
          source,
          installs: parseInt(m[3].replace(/,/g, "")),
          url: `https://skills.sh/${source}/${slug}`,
          installUrl: `https://github.com/${source}`,
          topic: null,
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

async function findAndFetchSkillMd(owner, repo, slug) {
  const branches = ["main", "master"];
  for (const branch of branches) {
    try {
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (treeRes.ok) {
        const data = await treeRes.json();
        if (data && data.tree) {
          const skillMdPaths = data.tree
            .filter(item => item.path.endsWith("SKILL.md"))
            .map(item => item.path);
          
          let bestPath = null;
          for (const path of skillMdPaths) {
            const parts = path.split("/");
            const folderName = parts[parts.length - 2];
            if (slug === folderName || slug.endsWith(folderName) || folderName.endsWith(slug) || slug.includes(folderName) || folderName.includes(slug)) {
              bestPath = path;
              break;
            }
          }
          if (!bestPath && skillMdPaths.length > 0) {
            bestPath = skillMdPaths[0];
          }
          if (bestPath) {
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${bestPath}`;
            const fileRes = await fetch(rawUrl);
            if (fileRes.ok) {
              return {
                content: await fileRes.text(),
                path: `${owner}/${repo}/${branch}/${bestPath}`
              };
            }
          }
        }
      }
    } catch (e) {
      console.error(`Error finding skill tree on branch ${branch}:`, e);
    }
  }
  return null;
}

export async function fetchSkillDetail(source, slug) {
  const [owner, repo] = source.split("/");
  const detail = { source, slug, skMd: null, skPath: null, description: null, topic: null };
  const urls = [
    `https://raw.githubusercontent.com/${owner}/${repo}/main/${slug}/SKILL.md`,
    `https://raw.githubusercontent.com/${owner}/${repo}/main/skills/${slug}/SKILL.md`,
    `https://raw.githubusercontent.com/${owner}/${repo}/main/skills/.curated/${slug}/SKILL.md`,
    `https://raw.githubusercontent.com/${owner}/${repo}/main/skills/.experimental/${slug}/SKILL.md`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        detail.skMd = await res.text();
        const parts = url.split("/");
        detail.skPath = parts.slice(-3).join("/");
        break;
      }
    } catch {}
  }

  if (!detail.skMd) {
    try {
      const smartResult = await findAndFetchSkillMd(owner, repo, slug);
      if (smartResult) {
        detail.skMd = smartResult.content;
        detail.skPath = smartResult.path;
      }
    } catch {}
  }

  if (!detail.skMd) {
    const cached = catalogCache.find((s) => s.source === source && s.slug === slug);
    if (cached) {
      detail.description = cached.description;
      detail.descriptionEn = cached.descriptionEn;
      detail.descriptionEs = cached.descriptionEs;
    }
    return detail;
  }
  const fmMatch = detail.skMd.match(/^---\n([\s\S]*?)\n---\n/);
  if (fmMatch) {
    const fm = fmMatch[1];
    const descLine = fm.split("\n").find((l) => l.startsWith("description:"));
    if (descLine) detail.description = descLine.replace(/^description:\s*"?([^"]*)"?/, "$1").trim();
  }
  if (!detail.description) {
    const body = detail.skMd.replace(/^---[\s\S]*?---\n/, "").trim();
    const firstLine = body.split("\n")[0]?.replace(/^#+\s*/, "").trim();
    if (firstLine) detail.description = firstLine;
  }
  if (!detail.description) {
    const cached = catalogCache.find((s) => s.source === source && s.slug === slug);
    if (cached) {
      detail.description = cached.description;
      detail.descriptionEn = cached.descriptionEn;
      detail.descriptionEs = cached.descriptionEs;
    }
  }

  if (detail.description && !detail.descriptionEn) {
    const category = classifySkill(slug, source, detail.description);
    detail.descriptionEn = detail.description;
    detail.descriptionEs = generateSpanishDescription(slug, source, category);
    detail.description = detail.descriptionEs || detail.descriptionEn;
  }

  return detail;
}

export async function installSkill(source, slug, targetDir) {
  const { mkdir, cp, rm, writeFile } = await import("fs/promises");
  const { existsSync } = await import("fs");
  const { join } = await import("path");
  const skillDir = join(targetDir, slug);

  // 1. Try installing using `npx skills add`
  const tempInstallDir = join(targetDir, `_temp_${slug}_${Date.now()}`);
  try {
    await mkdir(tempInstallDir, { recursive: true });
    const cmd = `npx -y skills add ${source} --skill ${slug} --yes`;
    await new Promise((resolve, reject) => {
      exec(cmd, { cwd: tempInstallDir, timeout: 60000 }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stdout || stderr || error.message));
        } else {
          resolve(stdout);
        }
      });
    });

    const downloadedSkillDir = join(tempInstallDir, ".agents", "skills", slug);
    if (existsSync(downloadedSkillDir)) {
      await mkdir(skillDir, { recursive: true });
      await cp(downloadedSkillDir, skillDir, { recursive: true });
      await rm(tempInstallDir, { recursive: true, force: true });
      return { path: skillDir, name: slug, method: "cli" };
    }
  } catch (err) {
    console.error("CLI installation failed, falling back to manual fetch:", err);
    try {
      await rm(tempInstallDir, { recursive: true, force: true });
    } catch {}
  }

  // 2. Fallback to manual fetch
  const [owner, repo] = source.split("/");
  const urls = [
    `https://raw.githubusercontent.com/${owner}/${repo}/main/${slug}/SKILL.md`,
    `https://raw.githubusercontent.com/${owner}/${repo}/main/skills/${slug}/SKILL.md`,
    `https://raw.githubusercontent.com/${owner}/${repo}/main/skills/.curated/${slug}/SKILL.md`,
    `https://raw.githubusercontent.com/${owner}/${repo}/main/skills/.experimental/${slug}/SKILL.md`,
  ];
  let content = null;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        content = await res.text();
        break;
      }
    } catch {}
  }

  // 3. Fallback to smart GitHub tree lookup
  if (!content) {
    const smartFetch = await findAndFetchSkillMd(owner, repo, slug);
    if (smartFetch) {
      content = smartFetch.content;
    }
  }

  if (!content) {
    throw new Error(`Could not fetch SKILL.md for ${source}/${slug}`);
  }

  await mkdir(skillDir, { recursive: true });
  await writeFile(join(skillDir, "SKILL.md"), content, "utf-8");
  return { path: skillDir, name: slug, files: ["SKILL.md"], method: "fallback" };
}
