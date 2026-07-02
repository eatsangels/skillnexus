import { homedir, userInfo } from "os";
import { join } from "path";
import { loadSettings } from "./settings.js";

const settings = loadSettings();

export const CONFIG = {
  // Puerto preferido. Si está ocupado, el servidor probará los siguientes hasta portMax.
  // Se puede forzar con la variable de entorno PORT.
  port: Number(process.env.PORT) || 3001,
  portMax: (Number(process.env.PORT) || 3001) + 20,
  scanPaths: {
    globalConfig: join(homedir(), ".config", "opencode", "opencode.jsonc"),
    projectConfigs: [
      join(homedir(), "Documents", "curso-opencode", "opencode.json"),
    ],
    skillDirectories: [
      // Carpeta canónica compartida por TODAS las IAs (Claude, Codex, OpenCode, Trae, Windsurf,
      // Gemini/Antigravity, Copilot, Crush, Goose, etc.). `npx skills add --global` instala aquí
      // una sola copia y la enlaza a cada IA, así que refleja lo instalado en todo el sistema.
      join(homedir(), ".agents", "skills"),
      // Carpeta de skills del proyecto OpenCode (compatibilidad con instalaciones previas).
      // Se escanea solo si existe, así que es inofensiva en máquinas sin ella.
      join(homedir(), "Documents", "curso-opencode", ".opencode", "skills"),
      // Directorios extra configurables por el usuario (ajustes).
      ...(settings.extraSkillDirs || []),
    ],
    // Carpeta destino para la copia local al instalar (configurable; por defecto la canónica).
    skillInstallDir: settings.skillInstallDir || join(homedir(), ".agents", "skills"),
    skillFiles: [
      join(homedir(), "Documents", "curso-opencode"),
      join(homedir(), "Documents", "mu02", "mu02"),
    ],
    claudeAgentsDir: join(homedir(), ".claude", "agents"),
  },
  builtInAgents: [
    {
      name: "build",
      mode: "primary",
      description: "Agente de codificación principal para implementar características y corregir errores",
      native: true,
      color: "primary",
    },
    {
      name: "plan",
      mode: "primary",
      description: "Experto en arquitectura y planificación para diseñar soluciones",
      native: true,
      color: "secondary",
    },
    {
      name: "general",
      mode: "all",
      description: "Agente de propósito general para tareas abiertas",
      native: true,
      color: "accent",
    },
    {
      name: "explore",
      mode: "subagent",
      description: "Especialista en exploración y análisis de código",
      native: true,
      color: "info",
    },
    {
      name: "scout",
      mode: "primary",
      description: "Agente de reconocimiento para auditoría de código",
      native: true,
      color: "warning",
    },
    {
      name: "title",
      mode: "primary",
      description: "Genera títulos de conversación según el contexto",
      native: true,
      color: "success",
      model: { modelID: "gpt-5-nano" },
    },
    {
      name: "summary",
      mode: "primary",
      description: "Genera resúmenes de conversaciones",
      native: true,
      color: "success",
    },
    {
      name: "compaction",
      mode: "primary",
      description: "Maneja la compactación de sesiones y gestión de contexto",
      native: true,
      color: "error",
    },
  ],
};
