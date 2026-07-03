# Changelog

Todos los cambios notables de SkillNexus se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.0.0/)
y el proyecto usa [Versionado Semántico](https://semver.org/lang/es/).

## [1.0.32] - 2026-07-02

### Añadido (Video Studio)
- **Generación de código con IA usando Ollama local**: detecta los modelos cargados en
  Ollama (`localhost:11434`) y genera componentes Remotion a partir de un prompt en lenguaje
  natural — gratis, local, sin claves. Endpoints `/ollama/models` y `/ollama/generate`.
- **Librería de plantillas ampliada**: 10 plantillas nuevas (countdown, lower third,
  typewriter, gradiente animado, logo reveal, barra de progreso, tipografía cinética,
  formas rebotando, slide-in, etc.), buscables desde la Biblioteca de Plantillas.
- **Sandbox ampliado**: el preview y el render local ahora permiten `@remotion/shapes` y
  `@remotion/transitions` además del core de `remotion`.

## [1.0.31] - 2026-07-02

### Corregido (Video Studio)
- **El editor seguía viéndose negro** en la app empaquetada (el resaltado con
  react-simple-code-editor + Prism no mostraba el texto en el bundle de producción).
  Se reemplaza por un editor de texto simple con letra clara sobre fondo oscuro, que
  garantiza que el código sea siempre visible y editable. Verificado en build de producción.

## [1.0.30] - 2026-07-02

### Corregido (Video Studio)
- **El render local fallaba con `ENOTDIR`** en la app empaquetada: intentaba crear
  `.temp_remotion` dentro de `app.asar` (archivo de solo lectura). Ahora el trabajo de
  renderizado y los recursos van a una carpeta escribible (`~/.skillnexus/remotion`).
  Verificado de punta a punta: 60/60 frames → output.mp4 generado.
- **El editor de código se veía negro/vacío**: la interop del import `prismjs/components/prism-core`
  dejaba las gramáticas desincronizadas en el bundle. Se usa el import principal de `prismjs`,
  restaurando el resaltado de sintaxis.

## [1.0.29] - 2026-07-02

### Corregido
- Auto-updater: el banner de "actualización descargada / instalar" no aparecía porque,
  al reutilizar un backend existente (P0), `backendProcess` quedaba en null y los eventos
  del updater no llegaban por IPC. Ahora el backend SIEMPRE se forkea (el conflicto de
  puerto lo resuelve el fallback de EADDRINUSE), restaurando el flujo de updates por IPC.

## [1.0.28] - 2026-07-02

### Corregido
- Video Studio: React error #130 ("Element type is invalid ... got: object") al abrir
  la pestaña. Causado por la interop del import CJS de `react-simple-code-editor`; se
  desenvuelve el `default` de forma robusta. Verificado con Playwright.

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
