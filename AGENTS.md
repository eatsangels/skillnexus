# Agent Workspace Context: id_skills 🤖

This document provides context, architecture details, and operational rules for AI agents and LLMs working in the `id_skills` codebase.

---

## 🏗️ Repository Architecture

The project is a **dual-mode application**: a local web dashboard AND an installable Electron desktop app, sharing the same React frontend and Express backend.

```
id_skills/
├── .github/
│   └── workflows/
│       └── publish.yml           # CI/CD: Auto-builds & publishes .exe to GitHub Releases on tag push
├── skill-dashboard/              # Core Dashboard Workspace
│   ├── frontend/                 # Vite + React Frontend
│   │   ├── src/
│   │   │   ├── App.tsx           # Main workspace dashboard layout (tab orchestrator)
│   │   │   ├── api.ts            # Client API definitions (auto-detects electron vs web)
│   │   │   ├── style.css         # Tailwind CSS v4 variables and custom styles
│   │   │   └── components/
│   │   │       ├── TabNav.tsx              # Top navigation bar with tab switching
│   │   │       ├── VideoStudio.tsx         # 🆕 Remotion Video Studio (code editor + renderer)
│   │   │       ├── TemplateLibraryModal.tsx # 🆕 Searchable template gallery modal
│   │   │       ├── templates.ts            # 🆕 Decoupled template registry (categorized)
│   │   │       └── [other modals/cards]    # AgentModal, SkillModal, HelpModal, etc.
│   │   ├── vite.config.ts        # base: "./" required for Electron file:// loading
│   │   └── package.json
│   ├── backend/                  # Node.js Express Backend
│   │   ├── src/
│   │   │   ├── api.js            # REST endpoints, agent execution, Remotion render pipeline
│   │   │   ├── server.js         # Server bootstrap and SSE connection hub
│   │   │   ├── config.js         # Path configuration for skills and agents
│   │   │   ├── agent-scanner.js          # Local agent detector
│   │   │   └── skills-sh-scanner.js      # Offline/online skill installer & resolver
│   │   └── package.json
│   ├── .agents/                  # Locally loaded agents list
│   └── start.ps1                 # 🔄 PowerShell: auto-installs deps + starts dev servers
├── .temp_remotion/               # 🆕 Auto-generated Remotion workspace (gitignored)
│   ├── Main.tsx                  # Active video composition (editable from VideoStudio)
│   ├── index.tsx                 # Root registerRoot() + Composition config
│   └── package.json              # Remotion deps (auto-installed on first render)
├── electron-main.js              # Electron main process: window, backend fork, auto-updater
├── package.json                  # ROOT: Electron, electron-builder, CI scripts (v1.0.11+)
├── package-lock.json
├── .gitignore                    # Excludes: node_modules, dist, .temp_remotion, .bin, *.mp4
├── README.md                     # Project guide (Spanish, primary)
└── README.en.md                  # Project guide (English)
```

---

## 🖥️ Desktop Application (Electron)

### Scripts (run from repo root `c:\ID_Skills`)

| Command | Description |
|---|---|
| `npm run dev:web` | Start web dashboard via PowerShell (unchanged) |
| `npm run dev:electron` | Start desktop app in development mode |
| `npm run build:frontend` | Build React frontend for production |
| `npm run package:dist` | Build full Windows installer `.exe` |

### electron-main.js Key Behaviors
*   **Production**: Forks the Express backend as a child process on app start, loads the built `frontend/dist/index.html` via `file://`.
*   **Development**: Skips backend fork (started by `concurrently`), loads `http://localhost:5173`.
*   **Auto-updater**: `electron-updater` checks GitHub Releases on startup. Shows native OS notifications when an update is available and when it is downloaded. Installs automatically on next app restart.

### Release Process (CI/CD)
*   The file `.github/workflows/publish.yml` runs on `git tag v*` pushes.
*   It installs all dependencies, builds the frontend, and runs `electron-builder --win --publish always`.
*   The workflow requires `permissions: contents: write` and uses `GH_TOKEN` (not `GITHUB_TOKEN`) for electron-builder.
*   Artifacts (`.exe`, `.blockmap`, `latest.yml`) are uploaded to GitHub Releases automatically.
*   **Latest release**: `v1.0.11` — includes Remotion Video Studio + Template Library.

---

## 🔌 API Endpoints Reference

### 1. Agent Execution Stream
*   **Path**: `POST /api/agents/:name/run`
*   **Body**: `{ prompt: string }`
*   **Output**: Server-Sent Events (SSE) stream (`text/event-stream`).
*   **Implementation Note**: Streams chunks formatted as `data: {"chunk": "..."}` or `data: {"done": true}`. The backend uses the native `opencode` CLI or standard execution binaries.

### 2. Skill Installer
*   **Path**: `POST /api/skills-sh/install`
*   **Body**: `{ source: string, slug: string }`
*   **Flow**:
    1. Prefer CLI-based installation: Runs `npx -y skills add <source> --skill <slug> --yes`.
    2. Fallback to GitHub Tree Resolution: Queries the GitHub Git Trees API to find the exact relative path of the `SKILL.md` file if folder names do not match the skill slug, downloading it directly to the local skills directory.

### 3. 🆕 Remotion Video Render
*   **Path**: `POST /api/remotion/render`
*   **Body**: `{ code: string, compositionId?: string, durationInFrames?: number, fps?: number, width?: number, height?: number }`
*   **Output**: Server-Sent Events (SSE) stream (`text/event-stream`).
*   **Flow**:
    1. Creates/updates `.temp_remotion/` workspace at repo root with `Main.tsx` and `index.tsx`.
    2. Auto-installs `remotion` via `npm install` if `node_modules` is missing.
    3. Runs `npx remotion render index.tsx main output.mp4 --overwrite` via `spawn`.
    4. Streams stdout/stderr as `data: {"chunk": "..."}` events.
    5. On completion sends `data: {"done": true, "outputPath": "..."}`.
*   **Output file**: `C:\ID_Skills\.temp_remotion\output.mp4` (gitignored, not committed).

### 4. Remotion Auth Status
*   **Path**: `GET /api/remotion/auth-status`
*   **Output**: `{ loggedIn: boolean, email?: string, name?: string }`
*   **Note**: Checks `belt whoami` for cloud rendering auth. Local rendering does not require login.

---

## 🎬 Video Studio Module

### Overview
`VideoStudio.tsx` is a full-featured in-app video production environment. It allows writing Remotion React compositions and rendering them to MP4 without leaving the dashboard.

### Key Features
*   **Split-pane UI**: Monaco-style code editor (textarea) on the left, live console output on the right.
*   **Template Library**: Opens `TemplateLibraryModal.tsx` to browse and inject categorized code templates.
*   **SSE Render Streaming**: Connects to `/api/remotion/render` as an `EventSource` stream — render progress is shown in real time in the compact console panel.
*   **Download**: After render completes, a download link is generated for the output `.mp4`.
*   **Auth Status**: Displays cloud login state (belt CLI) in the header; local renders work without authentication.

### Template System (`templates.ts`)
Templates are defined as a typed `Template[]` array and categorized:

| Category | Examples |
|---|---|
| `spring` | Spring animations, scale-in effects |
| `interpolate` | Color transitions, opacity fades |
| `sequence` | Multi-scene compositions |
| `text` | Animated titles, typewriter, gradient text |
| `shapes` | Circles, bars, progress rings |
| `maps` | MapLibre GL integration |
| `data` | Chart animations |

When adding a new template, export it from `templates.ts` and it will appear automatically in the modal search.

---

## 🎨 Visual Design Tokens (brandkit Guide)

The workspace frontend uses **Tailwind CSS v4** with a custom obsidian dark theme. When modifying elements, strictly use the following variables:

### 1. Colors
*   `--color-surface-975` (`#05070b`): Canvas background.
*   `--color-surface-950` (`#080c14`): Main container background.
*   `--color-surface-900` (`#0d1321`): Cards and dropdown panels.
*   `--color-surface-800` (`#1e293b`): Element borders (use low opacity: e.g., `border-surface-800/60`).
*   `--color-brand-600` (`#7c3aed`): Violet brand accent color.
*   `--color-brand-500` (`#8b5cf6`): Focus glow/active indicator.

### 2. Micro-interactions
*   Transitions: Use `transition-all duration-200` on hovers.
*   Borders: Avoid thick borders. Prefer `border border-surface-700/50` or `border border-white/5`.

---

## ⚙️ Development Guidelines

### Local Path Setup
*   Skills download directory: `C:\Users\EaTsAngels\Documents\curso-opencode\.opencode\skills`
*   Workspace root: `C:\ID_Skills`
*   Remotion render workspace: `C:\ID_Skills\.temp_remotion\` (auto-created, gitignored)
*   Rendered video output: `C:\ID_Skills\.temp_remotion\output.mp4`

### API Base URL (Critical for Electron)
`api.ts` exports `BASE` which auto-detects the runtime environment:
```typescript
export const BASE = typeof window !== "undefined" && window.location.protocol === "file:"
  ? "http://localhost:3001/api"  // Electron: loaded from file://, call backend directly
  : "/api";                       // Web: Vite dev proxy handles /api -> localhost:3001
```
**Always import `BASE` from `../api` for any `fetch()` or `EventSource` calls. Never hardcode `/api`.**

### Language Preference Sync
Modals share a global reading language selection via `localStorage` key `"agent-modal-lang"`. When adding modal components, always synchronize state with this key:
```typescript
const [lang, setLang] = useState<"en" | "es">(() => {
  const saved = localStorage.getItem("agent-modal-lang");
  return (saved === "en" || saved === "es") ? saved : "es";
});
```

### start.ps1 — First-Run Behavior (🔄 Updated v1.0.12)
The `skill-dashboard/start.ps1` script now handles first-time setup automatically:
1. Validates Node.js is installed (exits with error if missing).
2. Checks for `node_modules` in `backend/` — runs `npm install` if absent.
3. Checks for `node_modules` in `frontend/` — runs `npm install` if absent.
4. Starts backend (`node server.js`) and frontend (`npx vite`) as background jobs.
5. Opens `http://localhost:5173` in the default browser automatically.
6. Waits for keypress to gracefully stop both services.

**New users only need to run `.\start.ps1` — no manual `npm install` required.**

### .gitignore Rules
The following are intentionally excluded from version control:
```
node_modules/       # All dependency folders
dist/ / dist-desktop/  # Build output
.temp_remotion/     # Auto-generated Remotion workspace
.bin/               # Local binary cache
*.mp4               # Rendered video files
*.log / logs/       # Log files
playground_cwd/     # Temporary agent execution dirs
```

---

## ⚠️ Common Gotchas for Agents

1.  **Windows Process Spawning**:
    *   On Windows, commands spawned via Node.js `child_process.spawn` must be handled carefully. Always resolve the exact path of the executables (e.g. `opencode.exe` or `powershell.exe`) and configure the `shell` option appropriately.

2.  **SSE Connections**:
    *   Do not close the SSE response stream on `req.on('close')` immediately if the child process is still booting. Use `res.on('close')` to clean up active children to prevent premature process termination.

3.  **Vite `base` config**:
    *   `vite.config.ts` must have `base: "./"`. Without it, the compiled `index.html` uses absolute paths (`/assets/...`) that fail when loaded via `file://` in Electron.

4.  **electron-builder WinCodeSign on Windows without admin**:
    *   The `winCodeSign` tool fails to extract macOS symlinks on Windows without Developer Mode or admin privileges. Pre-extract its `.7z` cache using `7za.exe x ... -x!darwin -x!linux` to bypass the error locally.

5.  **GitHub Actions permissions for Releases**:
    *   The publish workflow MUST have `permissions: contents: write`. Without it, electron-builder cannot create the GitHub Release. Use `GH_TOKEN` (not `GITHUB_TOKEN`) as the environment variable name.

6.  **🆕 Remotion render workspace**:
    *   `.temp_remotion/` is created at runtime by the backend. It is gitignored. Do NOT commit its contents.
    *   If `node_modules` is missing inside `.temp_remotion/`, the backend auto-runs `npm install` before the first render. This can take ~30s on first use.
    *   The `index.tsx` must always call `registerRoot()` and export a `<Composition>` with matching `id` to the render command argument.

7.  **🆕 First-time web setup (new users)**:
    *   The `start.ps1` script handles `npm install` automatically. If a user reports the dashboard not loading, check that `node_modules` was installed in both `backend/` and `frontend/`. Running `.\start.ps1` again will fix it.
