# Changelog

Todos los cambios notables de SkillNexus se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.0.0/)
y el proyecto usa [Versionado Semántico](https://semver.org/lang/es/).

## [1.0.27] - 2026-07-02

### Añadido (Video Studio)
- **Previsualización en vivo** con `@remotion/player`: compila el TSX en el navegador
  y lo reproduce en tiempo real sin necesidad de renderizar. Toggle "En vivo / Renderizado".
- **Editor con resaltado de sintaxis** (react-simple-code-editor + Prism, 100% offline).
- **Presets de formato/plataforma** (horizontal, vertical, cuadrado, story, 720p, 4K) y
  más FPS (24/25/30/50/60).
- **Formatos de salida** configurables: MP4, WebM y GIF.
- **Persistencia del proyecto** (código + ajustes) en localStorage.

## [1.0.26] - 2026-07-02

### Añadido
- **Estabilidad (P0):** el backend maneja `EADDRINUSE` y prueba puertos 3001–3021;
  health-check `/api/health`; Electron reutiliza un backend existente antes de forkear
  y descubre el puerto real; banner de "sin conexión" con reconexión automática.
- **Seguridad (P1):** validación con allowlist de `source`/`slug` (anti inyección de
  comandos), `execFile` en vez de `exec` interpolado, CORS restringido a orígenes locales,
  gates por entorno para ejecución de agentes y render local (`SKILLNEXUS_ALLOW_RUN`,
  `SKILLNEXUS_ALLOW_LOCAL_REMOTION`).
- **Calidad (P2):** suite de tests con Vitest (18 tests) y CI en GitHub Actions.
- **UX (P3):** desinstalar skills/agentes desde la UI, error boundary, persistencia de
  filtros en la URL, carga diferida de Video Studio.
- **Catálogo (P4):** soporte de `GITHUB_TOKEN` (60→5000 req/hora) y manejo de rate-limit.
- **Ajustes (P6):** panel de ajustes persistentes (`~/.config/skillnexus/settings.json`);
  rutas de instalación configurables; se elimina la dependencia hardcodeada de `curso-opencode`.

### Cambiado
- `api.js` dividido: el módulo de Remotion se movió a `routes/remotion.js` (de 774 a ~460 líneas).
- El destino de instalación local por defecto es ahora la carpeta canónica `~/.agents/skills`.
- CI: los tests corren como gate antes de publicar y se podan devDependencies del paquete.

## [1.0.25] - 2026-07-01

### Añadido
- Instalación de skills en TODAS las IAs instaladas vía `npx skills add --global`.
- El dashboard escanea la carpeta canónica global `~/.agents/skills`.
- La UI muestra en qué IAs quedó instalada cada skill.

### Corregido
- El contador de skills/agentes ya no revierte al reiniciar (dedup por archivo en vez
  de por `name` del frontmatter; YAML inválido ya no descarta el archivo).
- Parser de `opencode.jsonc` que cortaba URLs dentro de cadenas.
