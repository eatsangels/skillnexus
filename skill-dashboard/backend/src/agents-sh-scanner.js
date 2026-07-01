import { validateInstallInput } from "./validate.js";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { classifyAgent } from "./agent-scanner.js";
import { CONFIG } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CACHE_DIR = join(homedir(), ".config", "opencode");
try {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (mkdirErr) {
  console.error("[Agents-sh] Failed to create cache directory:", mkdirErr);
}
const CACHE_FILE_PATH = join(CACHE_DIR, "agents-catalog-cache.json");

const KNOWN_AGENT_SOURCES = [
  "VoltAgent/awesome-claude-code-subagents",
  "rshah515/claude-code-subagents",
  "lst97/claude-code-sub-agents",
];

let catalogCache = [];
let catalogTime = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 mins
let onCatalogRefreshedCallback = null;

export function onAgentsCatalogRefreshed(cb) {
  onCatalogRefreshedCallback = cb;
}

try {
  if (existsSync(CACHE_FILE_PATH)) {
    const data = readFileSync(CACHE_FILE_PATH, "utf-8").replace(/^\uFEFF/, "");
    catalogCache = JSON.parse(data);
    catalogTime = Date.now();
    console.log(`[Agents-sh] Loaded ${catalogCache.length} agents from persistent cache.`);
  }
} catch (err) {
  console.error("[Agents-sh] Error loading cache file:", err);
}

// Generate a nice description in Spanish
export function generateSpanishAgentDescription(slug, source, category) {
  const readable = slug.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const src = source.split("/").pop().replace(/[-_]/g, " ");

  const phrases = {
    Backend: `Agente especializado en Backend (${src}). Diseñado para lógica de servidor, APIs y bases de datos.`,
    Frontend: `Agente experto en Frontend (${src}). Especializado en interfaces web, React, estilos y diseño de componentes.`,
    Design: `Agente de diseño y UI/UX (${src}). Ideal para sistemas visuales, tipografías y coherencia estética.`,
    Marketing: `Agente de marketing y contenido (${src}). Diseñado para estrategias digitales, optimización SEO y redacción de textos.`,
    Sales: `Agente de ventas y CRM (${src}). Optimizado para la gestión de relaciones con clientes y propuestas comerciales.`,
    Gaming: `Agente para desarrollo de videojuegos (${src}). Diseñado para mecánicas de juego, motores interactivos y animación.`,
    "AI/ML": `Agente de Inteligencia Artificial y ML (${src}). Especializado en integración de modelos LLM e ingeniería de prompts.`,
    DevOps: `Agente de DevOps e Infraestructura (${src}). Automatiza flujos de integración, Docker y despliegues.`,
    Security: `Agente de seguridad informática (${src}). Diseñado para auditorías de código, análisis de riesgos y cumplimiento.`,
    Data: `Agente analista de datos (${src}). Excelente para procesamiento de datos, SQL y visualización de reportes.`,
    "Legal/HR": `Agente de Legal y Recursos Humanos (${src}). Automatiza revisión de políticas, contratos y selección.`,
    Support: `Agente de soporte y atención (${src}). Responde tickets, FAQ y optimiza la relación con el usuario.`,
    "Mobile/XR": `Agente de desarrollo móvil y XR (${src}). Ideal para aplicaciones nativas y experiencias inmersivas.`,
    OpenCode: `Agente nativo de OpenCode para automatización avanzada y orquestación de tareas en la terminal.`,
    Engineering: `Agente de ingeniería de software (${src}). Orientado a mejores prácticas y resolución de problemas.`,
    Content: `Agente creador de contenidos (${src}). Ayuda en la redacción, traducción y documentación técnica.`,
  };

  return phrases[category] || `Agente especializado para tareas de ${category || "desarrollo"} (${readable}) del repositorio ${src}.`;
}

async function fetchRepoAgents(source) {
  const [owner, repo] = source.split("/");
  const branches = ["main", "master"];
  let treeData = null;
  let activeBranch = "main";

  for (const branch of branches) {
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (res.ok) {
        treeData = await res.json();
        activeBranch = branch;
        break;
      }
    } catch (e) {
      console.error(`[Agents-sh] Error fetching branch ${branch} for ${source}:`, e);
    }
  }

  if (!treeData || !treeData.tree) {
    console.warn(`[Agents-sh] Could not fetch tree for ${source}`);
    return [];
  }

  const ignoreFiles = [
    "readme.md", "claude.md", "contributing.md", "workflows.md",
    "workflow_config.md", "license.md", "security.md", "changelog.md"
  ];

  const agentsList = [];
  for (const file of treeData.tree) {
    if (file.type !== "blob" || !file.path.endsWith(".md")) continue;
    
    const parts = file.path.split("/");
    const filename = parts[parts.length - 1];
    if (ignoreFiles.includes(filename.toLowerCase())) continue;

    const slug = filename.replace(/\.md$/, "");
    const category = classifyAgent(slug);
    const displayName = slug.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const id = `${source}/${slug}`;

    agentsList.push({
      id,
      name: displayName,
      slug,
      source,
      category,
      path: file.path,
      branch: activeBranch,
      descriptionEn: `Specialized agent: ${displayName} from ${repo}.`,
      descriptionEs: generateSpanishAgentDescription(slug, source, category),
      description: generateSpanishAgentDescription(slug, source, category),
      url: `https://github.com/${source}/blob/${activeBranch}/${file.path}`,
      installUrl: `https://github.com/${source}`,
      topic: null,
    });
  }

  return agentsList;
}

export function getAgentsCatalog(force = false) {
  if (!force && catalogCache.length > 0 && catalogTime && Date.now() - catalogTime < CACHE_TTL) {
    return catalogCache;
  }

  if (catalogCache.length === 0 || !catalogTime || Date.now() - catalogTime >= CACHE_TTL) {
    console.log("[Agents-sh] Cache expired or empty. Triggering background refresh...");
    if (!global.isRefreshingAgentsCatalog) {
      global.isRefreshingAgentsCatalog = true;
      refreshAgentsCatalog()
        .then(() => {
          console.log("[Agents-sh] Background refresh completed successfully.");
        })
        .catch((err) => {
          console.error("[Agents-sh] Background refresh failed:", err);
        })
        .finally(() => {
          global.isRefreshingAgentsCatalog = false;
        });
    }
  }

  return catalogCache;
}

export async function refreshAgentsCatalog() {
  const allResults = [];
  for (const source of KNOWN_AGENT_SOURCES) {
    try {
      const sourceAgents = await fetchRepoAgents(source);
      allResults.push(...sourceAgents);
    } catch (e) {
      console.error(`[Agents-sh] Failed to refresh agents for ${source}:`, e);
    }
  }

  if (allResults.length > 0) {
    // Deduplicate by ID
    catalogCache = allResults.filter((s, i, a) => a.findIndex((x) => x.id === s.id) === i);
    catalogTime = Date.now();

    try {
      writeFileSync(CACHE_FILE_PATH, JSON.stringify(catalogCache, null, 2), "utf-8");
      console.log(`[Agents-sh] Saved ${catalogCache.length} agents to persistent cache file.`);
    } catch (err) {
      console.error("[Agents-sh] Failed to save agents persistent cache file:", err);
    }
  }

  if (onCatalogRefreshedCallback) {
    try {
      onCatalogRefreshedCallback();
    } catch (cbErr) {
      console.error("[Agents-sh] Error in callback:", cbErr);
    }
  }

  return catalogCache;
}

export async function searchAgents(query) {
  const catalog = getAgentsCatalog();
  const q = query.toLowerCase();
  return catalog.filter(a => 
    a.name.toLowerCase().includes(q) || 
    a.slug.toLowerCase().includes(q) || 
    a.description.toLowerCase().includes(q) || 
    a.category.toLowerCase().includes(q) || 
    a.source.toLowerCase().includes(q)
  );
}

// Fetch the system prompt and details of a single agent
export async function fetchAgentDetail(source, slug) {
  const catalog = getAgentsCatalog();
  const cached = catalog.find((a) => a.source === source && a.slug === slug);
  if (!cached) {
    throw new Error(`Agent not found in catalog: ${source}/${slug}`);
  }

  const url = `https://raw.githubusercontent.com/${source}/${cached.branch}/${cached.path}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const mdContent = await res.text();

    // Parse frontmatter
    let description = cached.description;
    let descriptionEn = cached.descriptionEn;
    let descriptionEs = cached.descriptionEs;
    let name = cached.name;
    let prompt = mdContent;

    const fmMatch = mdContent.match(/^---\n([\s\S]*?)\n---\n/);
    if (fmMatch) {
      const fmText = fmMatch[1];
      prompt = mdContent.replace(/^---[\s\S]*?---\n/, "").trim();
      
      const descLine = fmText.split("\n").find(l => l.trim().startsWith("description:"));
      if (descLine) {
        const rawDesc = descLine.replace(/^description:\s*"?([^"]*)"?/, "$1").trim();
        descriptionEn = rawDesc;
        descriptionEs = generateSpanishAgentDescription(slug, source, cached.category);
        description = descriptionEs;
      }

      const nameLine = fmText.split("\n").find(l => l.trim().startsWith("name:"));
      if (nameLine) {
        name = nameLine.replace(/^name:\s*"?([^"]*)"?/, "$1").trim();
      }
    }

    return {
      source,
      slug,
      name,
      description,
      descriptionEn,
      descriptionEs,
      category: cached.category,
      prompt,
      url: cached.url,
      path: cached.path,
    };
  } catch (err) {
    console.error(`[Agents-sh] Failed to fetch raw agent content:`, err);
    return {
      source,
      slug,
      name: cached.name,
      description: cached.description,
      descriptionEn: cached.descriptionEn,
      descriptionEs: cached.descriptionEs,
      category: cached.category,
      prompt: null,
      url: cached.url,
      path: cached.path,
      error: `Could not fetch prompt: ${err.message}`
    };
  }
}

// Download/Install the agent into the local ~/.claude/agents directory
export async function installAgent(source, slug) {
  const check = validateInstallInput(source, slug);
  if (!check.ok) {
    throw new Error(check.error);
  }
  const { writeFile, mkdir } = await import("fs/promises");
  const detail = await fetchAgentDetail(source, slug);

  if (!detail.prompt) {
    throw new Error("Cannot install agent without prompt content");
  }

  // Re-build markdown content with frontmatter.
  // Usamos JSON.stringify para producir cadenas YAML válidas: escapa comillas,
  // barras invertidas y saltos de línea. Sin esto, descripciones con `"` o `:`
  // generaban YAML inválido y el agente instalado nunca volvía a contarse.
  const yamlName = JSON.stringify(detail.name || slug);
  const yamlDesc = JSON.stringify(detail.descriptionEn || detail.description || "");
  const frontmatter = [
    "---",
    `name: ${yamlName}`,
    `description: ${yamlDesc}`,
    "---",
    "",
    detail.prompt
  ].join("\n");

  const targetDir = CONFIG.scanPaths.claudeAgentsDir;
  if (!existsSync(targetDir)) {
    await mkdir(targetDir, { recursive: true });
  }

  const targetFile = join(targetDir, `${slug}.md`);
  await writeFile(targetFile, frontmatter, "utf-8");

  return { success: true, path: targetFile, slug };
}
