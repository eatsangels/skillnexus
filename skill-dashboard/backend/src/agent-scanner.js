import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import matter from "gray-matter";
import { CONFIG } from "./config.js";

// Elimina comentarios de JSONC respetando el contenido de las cadenas.
// El regex ingenuo cortaba URLs (https://...) dentro de strings, rompiendo el parseo.
// Exportado para pruebas unitarias.
export function stripJsonComments(text) {
  let result = "";
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
        result += ch;
      }
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      result += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      result += ch;
      continue;
    }
    if (ch === "/" && next === "/") {
      inLineComment = true;
      i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i++;
      continue;
    }
    result += ch;
  }
  return result;
}

// Exportado para pruebas unitarias.
export function parseJsonc(text) {
  const noComments = stripJsonComments(text);
  // Elimina comas colgantes (,} o ,]) que JSON.parse no acepta pero JSONC sí.
  const noTrailingCommas = noComments.replace(/,(\s*[}\]])/g, "$1");
  return JSON.parse(noTrailingCommas);
}

function readConfigFile(filePath) {
  try {
    if (!existsSync(filePath)) return null;
    const content = readFileSync(filePath, "utf-8");
    return parseJsonc(content);
  } catch {
    return null;
  }
}

function extractAgentsFromConfig(config) {
  if (!config) return [];
  const agents = [];
  const agentConfig = config.agent || config.mode || {};
  for (const [name, cfg] of Object.entries(agentConfig)) {
    if (cfg && cfg.disable === true) continue;
    const agent = {
      name,
      description: cfg.description || "",
      mode: cfg.mode || "primary",
      hidden: cfg.hidden || false,
      color: cfg.color || null,
      temperature: cfg.temperature ?? null,
      topP: cfg.top_p ?? cfg.topP ?? null,
      steps: cfg.steps ?? cfg.maxSteps ?? null,
      model: cfg.model || null,
      variant: cfg.variant || null,
      tools: cfg.tools || null,
      prompt: cfg.prompt || null,
      permission: cfg.permission || null,
      options: cfg.options || null,
      native: false,
      source: "config",
      category: classifyAgent(name),
      invocation: `@${name}`,
    };
    agents.push(agent);
  }
  return agents;
}

const USE_CASES = {
  OpenCode: {
    use: ["Automatizar tareas", "Generar código", "Gestionar proyectos", "Delegar agentes", "Orquestar flujos de trabajo"],
    avoid: ["Diseño visual", "Creación de contenido", "Análisis de datos"],
    formats: ["opencode.jsonc", "AGENTS.md", "SKILL.md"],
  },
  Backend: {
    use: ["Diseñar APIs REST", "Arquitectura de bases de datos", "Lógica del servidor", "Autenticación", "Microservicios"],
    avoid: ["Diseño UI/UX", "Componentes frontend", "Estilos CSS"],
    formats: ["Especificaciones API", "Esquemas DB", "Config de servidor"],
  },
  Frontend: {
    use: ["Componentes UI", "Arquitectura CSS", "Manejo de estado", "Diseño responsive", "Optimización de rendimiento"],
    avoid: ["Infraestructura de servidor", "Diseño de BD", "DevOps"],
    formats: ["Librerías de componentes", "Design tokens", "Guías de estilo"],
  },
  Design: {
    use: ["Sistemas de diseño", "Bibliotecas de componentes", "Paletas de color", "Tipografía", "Auditorías de accesibilidad"],
    avoid: ["Lógica backend", "Desarrollo de APIs", "Consultas a BD"],
    formats: ["Design tokens", "Especificaciones Figma", "Frameworks CSS"],
  },
  Marketing: {
    use: ["Contenido redes sociales", "Estrategia SEO", "Planificación campañas", "Mensajes de marca", "Analítica"],
    avoid: ["Revisión de código", "Arquitectura de sistemas", "Auditorías de seguridad"],
    formats: ["Copias de marketing", "Briefs campaña", "Calendarios contenido"],
  },
  Sales: {
    use: ["Prospección ventas", "Gestión pipeline", "Generación propuestas", "Optimización CRM"],
    avoid: ["Arquitectura técnica", "Implementación código", "Diseño UI"],
    formats: ["Guiones ventas", "Propuestas", "Plantillas CRM"],
  },
  Gaming: {
    use: ["Mecánicas de juego", "Diseño niveles", "Desarrollo shaders", "Sistemas multijugador", "Optimización rendimiento"],
    avoid: ["Lógica de negocio", "Diseño BD", "Apps empresariales"],
    formats: ["Scripts juego", "Código shader", "Datos niveles"],
  },
  "AI/ML": {
    use: ["Entrenar modelos", "Ingeniería prompts", "Pipelines datos", "Integración LLM", "ML Ops"],
    avoid: ["Diseño UI", "Desarrollo juegos", "Documentos legales"],
    formats: ["Config modelos", "Scripts entrenamiento", "Pipelines inferencia"],
  },
  DevOps: {
    use: ["Pipelines CI/CD", "Infraestructura como código", "Orquestación contenedores", "Monitoreo", "Despliegues"],
    avoid: ["Diseño UI/UX", "Redacción contenido", "Diseño juegos"],
    formats: ["Dockerfile", "Manifiestos K8s", "Configs Terraform"],
  },
  Security: {
    use: ["Evaluar vulnerabilidades", "Auditorías seguridad", "Modelado amenazas", "Verificaciones cumplimiento"],
    avoid: ["Desarrollo frontend", "Creación contenido", "Marketing"],
    formats: ["Reportes seguridad", "Docs cumplimiento", "Trazas auditoría"],
  },
  Data: {
    use: ["Análisis datos", "Pipelines ETL", "Creación dashboards", "Reportes", "Modelos financieros"],
    avoid: ["Diseño UI", "Desarrollo juegos", "Arquitectura sistemas"],
    formats: ["Consultas SQL", "Modelos datos", "Reportes análisis"],
  },
  "Legal/HR": {
    use: ["Revisión documentos", "Cumplimiento legal", "Reclutamiento", "Onboarding", "Redacción políticas"],
    avoid: ["Generación código", "Diseño sistemas", "Desarrollo UI"],
    formats: ["Docs legales", "Políticas RH", "Contratos"],
  },
  Support: {
    use: ["Atención cliente", "Gestión tickets", "Generación FAQ", "Creación SOP"],
    avoid: ["Arquitectura sistemas", "Diseño UI/UX", "Desarrollo juegos"],
    formats: ["Guiones soporte", "Docs SOP", "Páginas FAQ"],
  },
  "Mobile/XR": {
    use: ["UI móvil", "Experiencias XR", "Diseño espacial", "Controles gestuales", "Multiplataforma"],
    avoid: ["Infraestructura backend", "Diseño BD", "Sistemas empresariales"],
    formats: ["Layouts móvil", "Escenas XR", "Mapas gestuales"],
  },
};

const CATEGORIES = [
  { name: "Backend", keywords: ["backend", "api", "database", "server", "cms", "solidity", "smart contract", "sre", "site reliability"] },
  { name: "Frontend", keywords: ["frontend", "ui-designer", "ux-architect", "visual-storyteller", "whimsy", "web"] },
  { name: "Design", keywords: ["ux-researcher", "ui-designer", "designer", "narrative-designer", "level-designer", "visual", "brand"] },
  { name: "Marketing", keywords: ["marketing", "seo", "social-media", "content-creator", "growth", "instagram", "tiktok", "linkedin", "twitter", "reddit", "youtube", "video", "podcast", "seo", "ad-", "paid-", "ppc", "search-query", "tracking"] },
  { name: "Sales", keywords: ["sales", "account-strategist", "deal-", "outbound", "outreach", "pipeline", "proposal"] },
  { name: "Gaming", keywords: ["game-", "unity", "unreal", "roblox", "godot", "level-designer", "multiplayer"] },
  { name: "AI/ML", keywords: ["ai-", "machine-learning", "llm", "model-qa", "prompt"] },
  { name: "DevOps", keywords: ["devops", "infrastructure", "deploy", "ci/cd", "git-workflow", "terminal"] },
  { name: "Security", keywords: ["security", "blockchain", "threat", "compliance", "auditor"] },
  { name: "Data", keywords: ["data-", "analytics", "analyst", "financial", "fp&a", "investment", "bookkeeper", "tax-"] },
  { name: "Legal/HR", keywords: ["legal", "compliance", "hr-", "recruitment", "onboarding"] },
  { name: "Support", keywords: ["support-", "customer-service", "hospitality", "healthcare"] },
  { name: "Mobile/XR", keywords: ["mobile", "visionos", "xr-", "spatial", "wechat", "mini-program"] },
  { name: "OpenCode", keywords: ["opencode"] },
];

function getUseCases(category) {
  return USE_CASES[category] || {
    use: ["Automatizar tareas", "Generar código", "Analizar"],
    avoid: ["Tareas no relacionadas"],
    formats: ["Varios"],
  };
}

const SPANISH_CATEGORY_DESC = {
  Backend: "Experto en desarrollo backend. ",
  Frontend: "Especialista en desarrollo frontend. ",
  Design: "Diseñador de interfaces y sistemas visuales. ",
  Marketing: "Estratega de marketing y contenido digital. ",
  Sales: "Especialista en ventas y CRM. ",
  Gaming: "Desarrollador de videojuegos. ",
  "AI/ML": "Experto en inteligencia artificial y machine learning. ",
  DevOps: "Ingeniero de infraestructura y despliegue. ",
  Security: "Analista de seguridad informática. ",
  Data: "Científico y analista de datos. ",
  "Legal/HR": "Especialista en legal y recursos humanos. ",
  Support: "Agente de soporte y atención al cliente. ",
  "Mobile/XR": "Desarrollador móvil y realidad extendida. ",
  Engineering: "Ingeniero de software. ",
  Content: "Creador de contenido. ",
  Education: "Educador y formador. ",
  Research: "Investigador. ",
  Other: "Agente especializado. ",
};

function getSpanishDescription(agent) {
  const prefix = SPANISH_CATEGORY_DESC[agent.category] || "";
  if (agent.source === "claude") {
    const name = agent.displayName || agent.name;
    return `${prefix}Enfocado en ${name}.`;
  }
  return agent.description;
}

export function classifyAgent(name) {
  const n = name.toLowerCase();
  for (const cat of CATEGORIES) {
    for (const kw of cat.keywords) {
      if (n.includes(kw)) return cat.name;
    }
  }
  if (n.includes("engineer") || n.includes("developer") || n.includes("architect")) return "Engineering";
  if (n.includes("writer") || n.includes("translator")) return "Content";
  if (n.includes("coach") || n.includes("trainer") || n.includes("educator")) return "Education";
  if (n.includes("researcher") || n.includes("scientist")) return "Research";
  return "Other";
}

export function scanAgents() {
  const agents = CONFIG.builtInAgents.map((a) => ({
    ...a,
    source: "built-in",
    category: "OpenCode",
    invocation: `@${a.name}`,
    prompt: null,
    temperature: null,
    topP: null,
    steps: null,
    tools: null,
    permission: null,
    options: {},
    model: a.model || null,
    variant: null,
    hidden: false,
  }));
  const globalConfig = readConfigFile(CONFIG.scanPaths.globalConfig);
  const globalAgents = extractAgentsFromConfig(globalConfig);
  const seenCustom = new Set();
  for (const agent of globalAgents) {
    seenCustom.add(agent.name);
    const existing = agents.findIndex((a) => a.name === agent.name);
    if (existing >= 0) {
      agents[existing] = { ...agents[existing], ...agent, native: false, source: "config" };
    } else {
      agents.push(agent);
    }
  }
  for (const projectPath of CONFIG.scanPaths.projectConfigs) {
    const projectConfig = readConfigFile(projectPath);
    const projectAgents = extractAgentsFromConfig(projectConfig);
    for (const agent of projectAgents) {
      if (seenCustom.has(agent.name)) {
        const existing = agents.findIndex((a) => a.name === agent.name);
        if (existing >= 0) {
          agents[existing] = { ...agents[existing], ...agent, native: false, source: "project" };
        }
      } else {
        seenCustom.add(agent.name);
        agents.push({ ...agent, source: "project" });
      }
    }
  }
  const claudeAgents = scanClaudeAgents();
  for (const agent of claudeAgents) {
    // Cada archivo en disco es único; no lo descartamos por colisión de `name`.
    // Si el nombre ya existe, lo desambiguamos con el slug del archivo o un sufijo numérico.
    let uniqueName = agent.name;
    if (seenCustom.has(uniqueName)) {
      const base = (agent.fileSlug || agent.name).toLowerCase().replace(/\s+/g, "-");
      uniqueName = base;
      let counter = 2;
      while (seenCustom.has(uniqueName)) {
        uniqueName = `${base}-${counter++}`;
      }
      agent.name = uniqueName;
      agent.invocation = `@${uniqueName}`;
    }
    seenCustom.add(uniqueName);
    agents.push(agent);
  }
  const BUILTIN_EN_DESCRIPTIONS = {
    build: "Principal coding agent to implement features and fix bugs",
    plan: "Architecture and planning expert to design solutions",
    general: "General-purpose agent for open-ended tasks",
    explore: "Specialist in code exploration and analysis",
    scout: "Reconnaissance agent for auditing code",
    title: "Generates conversation titles based on context",
    summary: "Generates conversation summaries",
    compaction: "Manages session compaction and context management",
  };

  return agents.map((a) => {
    let descriptionEn = a.description || "";
    let descriptionEs = a.description || "";
    if (a.source === "built-in") {
      descriptionEs = a.description || "";
      descriptionEn = BUILTIN_EN_DESCRIPTIONS[a.name] || descriptionEs;
    } else {
      descriptionEn = a.description || "";
      descriptionEs = getSpanishDescription(a);
    }

    return {
      ...a,
      useCases: a.useCases || getUseCases(a.category || "Other"),
      description: descriptionEs,
      descriptionEn,
      descriptionEs,
    };
  });
}

function scanClaudeAgents() {
  const dir = CONFIG.scanPaths.claudeAgentsDir;
  if (!existsSync(dir)) return [];
  const results = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const filePath = join(dir, entry.name);
      const fileSlug = entry.name.replace(/\.md$/, "");
      try {
        const content = readFileSync(filePath, "utf-8");
        const parsed = matter(content);
        const name = parsed.data.name || fileSlug;
        const description = parsed.data.description || "";
        const color = parsed.data.color || null;
        const emoji = parsed.data.emoji || null;
        const vibe = parsed.data.vibe || null;
        const agentName = name.toLowerCase().replace(/\s+/g, "-");
        results.push({
          name: agentName,
          displayName: name,
          description,
          mode: "primary",
          native: false,
          source: "claude",
          hidden: false,
          color,
          model: null,
          variant: null,
          temperature: null,
          topP: null,
          steps: null,
          tools: null,
          prompt: parsed.content,
          permission: null,
          options: { emoji, vibe, filePath },
          category: classifyAgent(agentName + " " + (description || "")),
          invocation: `@${agentName}`,
          fileSlug,
        });
      } catch (err) {
        // No descartar silenciosamente un archivo con frontmatter inválido:
        // lo registramos y creamos una entrada mínima basada en el nombre del archivo
        // para que siga contando y sea visible (con el error para diagnóstico).
        console.error(`[Agent-scanner] Failed to parse ${entry.name}:`, err.message);
        const agentName = fileSlug.toLowerCase().replace(/\s+/g, "-");
        results.push({
          name: agentName,
          displayName: fileSlug,
          description: "",
          mode: "primary",
          native: false,
          source: "claude",
          hidden: false,
          color: null,
          model: null,
          variant: null,
          temperature: null,
          topP: null,
          steps: null,
          tools: null,
          prompt: null,
          permission: null,
          options: { filePath, parseError: err.message },
          category: classifyAgent(agentName),
          invocation: `@${agentName}`,
          fileSlug,
        });
      }
    }
  } catch {}
  return results;
}
