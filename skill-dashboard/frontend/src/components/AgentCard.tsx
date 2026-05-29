import type { AgentSummary } from "../api";

interface Props {
  agent: AgentSummary;
  onClick: () => void;
}

const modeStyles: Record<string, string> = {
  primary: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  subagent: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  all: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

const sourceDots: Record<string, string> = {
  "built-in": "bg-zinc-500",
  claude: "bg-emerald-500",
  config: "bg-violet-500",
  project: "bg-amber-500",
};

const sourceLabels: Record<string, string> = {
  "built-in": "OpenCode",
  claude: "Claude",
  config: "Custom",
  project: "Project",
};

export default function AgentCard({ agent, onClick }: Props) {
  const modeClass = modeStyles[agent.mode] || "bg-zinc-500/15 text-zinc-400 border-zinc-500/20";
  const dotColor = sourceDots[agent.source] || "bg-zinc-500";
  const sourceLabel = sourceLabels[agent.source] || agent.source;

  return (
    <button
      onClick={onClick}
      className="w-full text-left group relative bg-surface-900/40 backdrop-blur-sm border border-surface-800/50 rounded-2xl p-5 transition-all duration-300 hover:bg-surface-900/80 hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5 cursor-pointer"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-500/0 via-transparent to-brand-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor} shadow-lg`} />
            <h3 className="text-base font-semibold text-surface-100 group-hover:text-brand-200 transition-colors truncate">
              {agent.emoji ? `${agent.emoji} ` : ""}{agent.displayName || agent.name}
            </h3>
          </div>
          <span className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border ${modeClass}`}>
            {agent.mode}
          </span>
        </div>
        <p className="text-sm text-surface-400 leading-relaxed line-clamp-3 mb-4 group-hover:text-surface-300 transition-colors">
          {agent.description || "No description"}
        </p>
        {agent.model && (
          <div className="mb-3">
            <span className="text-[10px] bg-surface-800/50 text-surface-400 px-2 py-0.5 rounded-full font-mono">
              {typeof agent.model === "string" ? agent.model : `${agent.model.providerID}/${agent.model.modelID}`}
            </span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <code className="text-[11px] bg-surface-950/80 text-brand-400 px-2.5 py-1 rounded-lg font-mono border border-surface-700/30 group-hover:border-brand-500/20 transition-colors">
            {agent.invocation}
          </code>
          <span className="text-[11px] text-surface-500 bg-surface-800/50 px-2.5 py-1 rounded-full">{agent.category}</span>
          <span className="text-[11px] text-surface-500 bg-surface-800/50 px-2.5 py-1 rounded-full">{sourceLabel}</span>
        </div>
        {agent.useCases && (
          <div className="mt-3 pt-3 border-t border-surface-800/30">
            <div className="flex flex-wrap gap-1">
              {agent.useCases.use.slice(0, 3).map((u) => (
                <span key={u} className="text-[10px] bg-emerald-500/8 text-emerald-400/70 px-2 py-0.5 rounded">✓ {u}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
