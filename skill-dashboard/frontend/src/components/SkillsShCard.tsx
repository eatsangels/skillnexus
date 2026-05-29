import type { SkillsShSkill } from "../api";

interface Props {
  skill: SkillsShSkill;
  onClick: () => void;
}

function formatInstalls(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function SkillsShCard({ skill, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left group relative bg-surface-900/40 backdrop-blur-sm border border-surface-800/50 rounded-2xl p-5 transition-all duration-300 hover:bg-surface-900/80 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 cursor-pointer"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/0 via-transparent to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative">
        <div className="flex items-start justify-between mb-3 gap-3">
          <h3 className="text-base font-semibold text-surface-100 group-hover:text-emerald-200 transition-colors leading-snug">{skill.name}</h3>
          <span className="shrink-0 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full whitespace-nowrap">
            {formatInstalls(skill.installs)}
          </span>
        </div>
        <p className="text-sm text-surface-400 leading-relaxed line-clamp-3 mb-4 group-hover:text-surface-300 transition-colors">
          {skill.description || "No description available"}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {skill.category && skill.category !== "Other" && (
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{skill.category}</span>
          )}
          <span className="text-xs text-surface-500 bg-surface-800/60 px-2 py-0.5 rounded-md font-mono">{skill.source}</span>
        </div>
      </div>
    </button>
  );
}
