# id_skills: Local panel to install, test, and manage agent skills

<!-- README-I18N:START -->

[Español](./README.md) | **English**

<!-- README-I18N:END -->

Manage your OpenCode and Claude Code skills from a fast and optimized web interface, or using the **native Windows desktop application** (with one-click execution and automatic updates).

> [!TIP]
> **Prefer the convenience of an installable app?**
> Go to the **[GitHub Releases page](https://github.com/eatsangels/id_skills/releases)**, download the executable installer (`.exe`) for the latest version, and install it. It will run autonomously with its own backend in the background and notify you of any new updates.

---

## 💻 Desktop Application (Electron)

The project features a dual-mode setup: a traditional web dashboard and a native desktop application that automatically starts all backend services in the background.

### Download and Installation (Recommended)
1. Go to **[GitHub Releases](https://github.com/eatsangels/id_skills/releases)**.
2. Download the latest installer version: `ID.Skills.Dashboard.Setup.X.X.X.exe`.
3. Run the installer. A shortcut will be created on your desktop.
4. When you open the program, the backend services will spin up automatically. No terminal or startup scripts are needed.

### Development Commands (Desktop)
If you want to work on developing the desktop app or package it yourself:
* **Run in development mode (with hot-reload for both frontend and backend):**
  ```bash
  npm run dev:electron
  ```
* **Compile and build the production installer (.exe):**
  ```bash
  npm run package:dist
  ```

---

## Key Benefits

*   **Instant and error-free installation**: Add new skills in seconds using `npx skills add` or the built-in search tool that automatically resolves the correct GitHub paths.
*   **Interactive Playground**: Test commands directly in the web terminal and watch the agent's response and execution in real time.
*   **Developer-focused design**: High-contrast dark interface based on the *brandkit* guidelines that reduces eye strain and highlights crucial information.
*   **Persistent language choice**: The panel remembers your language preference (Spanish or English) so you don't have to toggle it every time you open an agent or skill.
*   **Clear metrics at a glance**: View the exact number of active agents, skills, frameworks, and execution modes right from the header.

---

## Project Structure

```bash
id_skills/
├── skill-dashboard/     # Dashboard source code
│   ├── frontend/        # React + Vite (Tailwind CSS v4)
│   └── backend/         # Node.js + Express (scanning services and interactive terminal)
├── electron-main.js     # Electron main process (Window management and auto-updater)
├── package.json         # Project setup, dependencies, and build scripts
└── README.md            # Project guide
```

---

## Quick Start Guide (Web Mode)

### Prerequisites

Make sure you have installed on your system:
*   [Node.js](https://nodejs.org/) (version 18 or higher)
*   [Git](https://git-scm.com/)

### Running the Web Dashboard
If you prefer running the web version instead of installing the desktop application:

1. Open PowerShell in the `skill-dashboard` folder.
2. Run the script:
   ```powershell
   ./start.ps1
   ```
3. Open `http://localhost:5173` in your browser to use the dashboard. The backend will run in the background on `http://localhost:3001`.

---

## License

This project is licensed under the MIT License.
