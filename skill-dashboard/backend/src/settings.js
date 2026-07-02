// Ajustes persistentes del usuario (~/.config/skillnexus/settings.json).
// Permiten que la app funcione en cualquier PC sin editar código: rutas de escaneo,
// carpeta de instalación local y token de GitHub configurables desde la UI.
import { homedir } from "os";
import { join } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

const SETTINGS_DIR = join(homedir(), ".config", "skillnexus");
const SETTINGS_FILE = join(SETTINGS_DIR, "settings.json");

// Valores por defecto genéricos (no dependen de rutas específicas de una máquina).
export function defaultSettings() {
  return {
    // Carpeta canónica compartida por todas las IAs; siempre tiene sentido.
    skillInstallDir: join(homedir(), ".agents", "skills"),
    // Directorios adicionales que se escanean para skills locales (además de la canónica).
    extraSkillDirs: [],
    // Token de GitHub opcional para subir el límite de la API.
    githubToken: "",
  };
}

let cached = null;

export function loadSettings() {
  if (cached) return cached;
  let loaded = {};
  try {
    if (existsSync(SETTINGS_FILE)) {
      loaded = JSON.parse(readFileSync(SETTINGS_FILE, "utf-8").replace(/^﻿/, ""));
    }
  } catch (err) {
    console.error("[Settings] No se pudo leer settings.json, usando valores por defecto:", err);
  }
  cached = { ...defaultSettings(), ...loaded };
  // Propagar el token al entorno para que github.js lo use.
  if (cached.githubToken) {
    process.env.GITHUB_TOKEN = cached.githubToken;
  }
  return cached;
}

export function saveSettings(patch) {
  const current = loadSettings();
  const next = { ...current, ...patch };
  try {
    if (!existsSync(SETTINGS_DIR)) mkdirSync(SETTINGS_DIR, { recursive: true });
    writeFileSync(SETTINGS_FILE, JSON.stringify(next, null, 2), "utf-8");
  } catch (err) {
    console.error("[Settings] No se pudo guardar settings.json:", err);
    throw err;
  }
  cached = next;
  if (next.githubToken) process.env.GITHUB_TOKEN = next.githubToken;
  return next;
}

export const SETTINGS_PATH = SETTINGS_FILE;
