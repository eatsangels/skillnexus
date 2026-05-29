import type { DashboardStats } from "../api";

interface Props {
  stats: DashboardStats | null;
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

export default function StatsHeader({ stats }: Props) {
  if (!stats) return null;

  const topCategories = stats.agentsByCategory
    ? Object.entries(stats.agentsByCategory)
        .filter(([, count]) => count > 0)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
    : [];

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-100 tracking-tight">
            Skill & Agent Dashboard
          </h1>
          <p className="text-surface-500 text-sm mt-1">
            Overview of all available skills and agents
          </p>
        </div>
      </div>

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
    </div>
  );
}
