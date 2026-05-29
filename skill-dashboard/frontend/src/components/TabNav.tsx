interface Props {
  tab: "skills" | "agents" | "skills-sh";
  onTabChange: (tab: "skills" | "agents" | "skills-sh") => void;
}

const tabs = [
  { id: "skills" as const, label: "Skills", icon: "S" },
  { id: "agents" as const, label: "Agents", icon: "A" },
  { id: "skills-sh" as const, label: "Skills.sh", icon: "~" },
];

export default function TabNav({ tab, onTabChange }: Props) {
  return (
    <div className="flex gap-1 bg-surface-900/80 border border-surface-700/30 rounded-xl p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onTabChange(t.id)}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
            tab === t.id
              ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20"
              : "text-surface-400 hover:text-surface-200 hover:bg-surface-800/50"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
