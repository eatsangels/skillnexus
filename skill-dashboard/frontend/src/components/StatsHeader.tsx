import type { DashboardStats } from "../api";

interface Props {
  stats: DashboardStats | null;
  version: string;
  onHelpClick: () => void;
  onSettingsClick?: () => void;
  updateState?: { status: string; version?: string | null; error?: string | null } | null;
  applyingUpdate?: boolean;
  onApplyUpdate?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  OpenCode: "from-violet-500 to-violet-700",
  Backend: "from-blue-500 to-blue-700",
  Frontend: "from-sky-500 to-sky-700",
  Design: "from-pink-500 to-pink-700",
  Marketing: "from-orange-500 to-orange-700",
  Sales: "from-amber-500 to-amber-700",
  Gaming: "from-purple-500 to-purple-700",
  "AI/ML": "from-cyan-500 to-cyan-700",
  DevOps: "from-rose-500 to-rose-700",
  Security: "from-red-500 to-red-700",
  Data: "from-teal-500 to-teal-700",
  "Legal/HR": "from-indigo-500 to-indigo-700",
  Support: "from-lime-500 to-lime-700",
  "Mobile/XR": "from-fuchsia-500 to-fuchsia-700",
};

export default function StatsHeader({
  stats,
  version,
  onHelpClick,
  onSettingsClick,
  updateState,
  applyingUpdate,
  onApplyUpdate,
}: Props) {
  const topCategories = stats?.agentsByCategory
    ? Object.entries(stats.agentsByCategory)
        .filter(([, count]) => count > 0)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
    : [];

  return (
    <div className="mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-surface-800/40 pb-5">
        <div className="flex items-center gap-3">
          <img
            src="logo.png"
            alt="SkillNexus Logo"
            className="w-12 h-12 object-contain rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] border border-brand-500/20"
          />
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-extrabold text-surface-100 tracking-tight">
                SkillNexus
              </h1>
              <span className="text-[10px] bg-brand-500/10 text-brand-400 border border-brand-500/20 font-bold px-2.5 py-0.5 rounded-full shrink-0">
                v{version}
              </span>

              {/* Botón de actualización destacado en el Header */}
              {updateState && updateState.status === "downloaded" && (
                <button
                  onClick={onApplyUpdate}
                  disabled={applyingUpdate}
                  className="animate-pulse bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 text-white text-[10px] font-extrabold px-3 py-1 rounded-full border border-violet-400/20 shadow-lg shadow-violet-600/30 flex items-center gap-1.5 cursor-pointer transition-all duration-200 hover:scale-105"
                >
                  {applyingUpdate ? (
                    <>
                      <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Instalando...
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Actualizar a v{updateState.version}
                    </>
                  )}
                </button>
              )}

              {updateState && updateState.status === "available" && (
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                  </span>
                  Descargando v{updateState.version}...
                </span>
              )}
            </div>
            <p className="text-surface-500 text-xs mt-0.5">
              Entorno inteligente de gestión para agentes y habilidades
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onHelpClick}
            className="text-xs font-semibold text-surface-300 hover:text-surface-100 transition-all duration-200 inline-flex items-center gap-1.5 bg-surface-900 border border-surface-800 hover:border-surface-700 px-3.5 py-1.5 rounded-xl cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Ayuda
          </button>

          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              title="Ajustes"
              className="text-xs font-semibold text-surface-300 hover:text-surface-100 transition-all duration-200 inline-flex items-center gap-1.5 bg-surface-900 border border-surface-800 hover:border-surface-700 px-3.5 py-1.5 rounded-xl cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Ajustes
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-surface-500 font-medium">Realizado por</span>
            <a
              href="https://etrinidad.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-brand-400 hover:text-brand-300 transition-all duration-200 hover:underline inline-flex items-center gap-1 bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 rounded-lg"
            >
              Edward Trinidad
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-gradient-to-br from-violet-600/10 to-violet-900/5 border border-violet-500/15 rounded-2xl p-4">
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-2xl font-bold text-violet-300">{stats.totalSkills}</span>
                <span className="text-xs font-medium text-surface-500 uppercase tracking-wider">Skills</span>
              </div>
              {stats.totalSkills > 0 && (
                <div className="flex gap-2 text-[11px] text-surface-500">
                  <span className="bg-surface-900/50 px-2 py-0.5 rounded-full">{stats.skillFormats.directory} dir</span>
                  <span className="bg-surface-900/50 px-2 py-0.5 rounded-full">{stats.skillFormats.zip} zip</span>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-emerald-600/10 to-emerald-900/5 border border-emerald-500/15 rounded-2xl p-4">
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-2xl font-bold text-emerald-300">{stats.totalAgents}</span>
                <span className="text-xs font-medium text-surface-500 uppercase tracking-wider">Agents</span>
              </div>
              {stats.totalAgents > 0 && (
                <div className="flex gap-2 text-[11px] text-surface-500">
                  <span className="bg-surface-900/50 px-2 py-0.5 rounded-full">{stats.nativeAgents} built-in</span>
                  <span className="bg-surface-900/50 px-2 py-0.5 rounded-full">{stats.customAgents} custom</span>
                </div>
              )}
            </div>

            {stats.frameworks.length > 0 && (
              <div className="bg-gradient-to-br from-amber-600/10 to-amber-900/5 border border-amber-500/15 rounded-2xl p-4">
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-2xl font-bold text-amber-300">{stats.frameworks.length}</span>
                  <span className="text-xs font-medium text-surface-500 uppercase tracking-wider">Frameworks</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {stats.frameworks.slice(0, 4).map((f) => (
                    <span key={f} className="text-[10px] bg-surface-900/50 text-surface-400 px-1.5 py-0.5 rounded-full">{f}</span>
                  ))}
                </div>
              </div>
            )}

            {Object.entries(stats.agentsByMode || {}).map(([mode, count]) => (
              <div key={mode} className="bg-gradient-to-br from-blue-600/10 to-blue-900/5 border border-blue-500/15 rounded-2xl p-4">
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-2xl font-bold text-blue-300">{count}</span>
                  <span className="text-xs font-medium text-surface-500 uppercase tracking-wider capitalize">{mode}</span>
                </div>
              </div>
            ))}
          </div>

          {topCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {topCategories.map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-2 bg-surface-900/50 border border-surface-800/50 rounded-xl px-3.5 py-2">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${CATEGORY_COLORS[cat] || "from-surface-500 to-surface-600"}`} />
                  <span className="text-xs font-medium text-surface-300">{cat}</span>
                  <span className="text-xs text-surface-500">{count}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
