import type { SkillSummary } from "../api";

interface Props {
  skill: SkillSummary;
  onClick: () => void;
}

export default function SkillCard({ skill, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left group relative bg-surface-900/40 backdrop-blur-sm border border-surface-800/50 rounded-2xl p-5 transition-all duration-300 hover:bg-surface-900/80 hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5 cursor-pointer"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-500/0 via-transparent to-brand-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-base font-semibold text-surface-100 group-hover:text-brand-200 transition-colors leading-snug">{skill.name}</h3>
          <span className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider transition-all ${
            skill.format === "directory"
              ? "bg-blue-500/15 text-blue-400 group-hover:bg-blue-500/20"
              : "bg-amber-500/15 text-amber-400 group-hover:bg-amber-500/20"
          }`}>
            {skill.format}
          </span>
        </div>
        <p className="text-sm text-surface-400 leading-relaxed line-clamp-3 mb-4 group-hover:text-surface-300 transition-colors">
          {skill.description || "No description available"}
        </p>
        {skill.frameworks.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skill.frameworks.map((fw) => (
              <span key={fw} className="text-[11px] bg-surface-800/80 text-surface-400 px-2.5 py-1 rounded-full font-medium">
                {fw}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
