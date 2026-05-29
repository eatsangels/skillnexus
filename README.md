# id_skills: Local panel to install, test, and manage agent skills

<!-- README-I18N:START -->

**English** | [Español](./README.es.md)

<!-- README-I18N:END -->

Manage your OpenCode and Claude Code skills from a fast and optimized web interface.

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
└── README.md            # Project guide
```

---

## Quick Start Guide

### Prerequisites

Make sure you have installed on your system:
*   [Node.js](https://nodejs.org/) (version 18 or higher)
*   [Git](https://git-scm.com/)

### Running the Dashboard

The project includes a PowerShell script to start the backend and frontend at the same time:

1. Open PowerShell in the `skill-dashboard` folder.
2. Run the script:
   ```powershell
   ./start.ps1
   ```
3. Open `http://localhost:5173` in your browser to use the dashboard. The backend will run in the background on `http://localhost:3001`.

---

## License

This project is licensed under the MIT License.
