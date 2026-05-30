import { useEffect, useState } from "react";
import type { SkillSummary, AgentSummary, DashboardStats, SkillsShSkill } from "./api";
import { fetchSkills, fetchAgents, fetchDashboard, fetchSkillsSh, BASE } from "./api";
import StatsHeader from "./components/StatsHeader.tsx";
import TabNav from "./components/TabNav.tsx";
import SkillCard from "./components/SkillCard.tsx";
import AgentCard from "./components/AgentCard.tsx";
import SkillModal from "./components/SkillModal.tsx";
import AgentModal from "./components/AgentModal.tsx";
import SkillsShCard from "./components/SkillsShCard.tsx";
import SkillsShModal from "./components/SkillsShModal.tsx";

type Tab = "skills" | "agents" | "skills-sh";
type ViewMode = "all" | "grouped";

const CATEGORY_ORDER = [
  "OpenCode", "Backend", "Frontend", "Design", "Marketing", "Sales",
  "Gaming", "AI/ML", "DevOps", "Security", "Data", "Legal/HR",
  "Support", "Mobile/XR", "Engineering", "Content", "Education",
  "Research", "Other",
];

const CATEGORY_COLORS: Record<string, string> = {
  OpenCode: "from-violet-600/20 to-violet-900/10 border-violet-500/20",
  Backend: "from-blue-600/20 to-blue-900/10 border-blue-500/20",
  Frontend: "from-sky-600/20 to-sky-900/10 border-sky-500/20",
  Design: "from-pink-600/20 to-pink-900/10 border-pink-500/20",
  Marketing: "from-orange-600/20 to-orange-900/10 border-orange-500/20",
  Sales: "from-amber-600/20 to-amber-900/10 border-amber-500/20",
  Gaming: "from-purple-600/20 to-purple-900/10 border-purple-500/20",
  "AI/ML": "from-cyan-600/20 to-cyan-900/10 border-cyan-500/20",
  DevOps: "from-rose-600/20 to-rose-900/10 border-rose-500/20",
  Security: "from-red-600/20 to-red-900/10 border-red-500/20",
  Data: "from-teal-600/20 to-teal-900/10 border-teal-500/20",
  "Legal/HR": "from-indigo-600/20 to-indigo-900/10 border-indigo-500/20",
  Support: "from-lime-600/20 to-lime-900/10 border-lime-500/20",
  "Mobile/XR": "from-fuchsia-600/20 to-fuchsia-900/10 border-fuchsia-500/20",
};

export default function App() {
  const [tab, setTab] = useState<Tab>("agents");
  const [view, setView] = useState<ViewMode>("all");
  const [skillsShView, setSkillsShView] = useState<ViewMode>("all");
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [skillsSh, setSkillsSh] = useState<SkillsShSkill[]>([]);
  const [search, setSearch] = useState("");
  const [frameworkFilter, setFrameworkFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [skillsShCategoryFilter, setSkillsShCategoryFilter] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedSkillsSh, setSelectedSkillsSh] = useState<SkillsShSkill | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncToast, setSyncToast] = useState<{ show: boolean; message: string } | null>(null);

  const reloadData = (isAuto = false) => {
    // 1. Fetch local data first (very fast, doesn't require internet / external calls)
    Promise.all([fetchSkills(), fetchAgents(), fetchDashboard()]).then(
      ([s, a, d]) => {
        setSkills(s.skills || []);
        setAgents(a.agents || []);
        setStats(d.stats || null);
        setLoading(false);
        if (isAuto) {
          setSyncToast({ show: true, message: "¡Sincronizado en tiempo real!" });
          setTimeout(() => setSyncToast(null), 3000);
        }
      }
    ).catch((err) => {
      console.error("Failed to load local dashboard data:", err);
      setLoading(false);
    });

    // 2. Fetch remote skills-sh catalog asynchronously in the background
    fetchSkillsSh().then((sh) => {
      setSkillsSh(sh.skills || []);
    }).catch((err) => {
      console.error("Failed to load skills.sh catalog:", err);
    });
  };

  useEffect(() => {
    reloadData(false);
  }, []);

  useEffect(() => {
    const eventSource = new EventSource(`${BASE}/events`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[SSE] Connection established:", data);
      } catch (err) {
        console.error("[SSE] Failed to parse message:", err);
      }
    };
    
    eventSource.addEventListener("update", () => {
      console.log("[SSE] Update event received, reloading...");
      reloadData(true);
    });

    eventSource.onerror = (err) => {
      console.warn("[SSE] Connection lost, retrying...", err);
    };

    return () => {
      eventSource.close();
    };
  }, []);


  const allFrameworks = [...new Set(skills.flatMap((s) => s.frameworks))].sort();
  const allModes = [...new Set(agents.map((a) => a.mode))].sort();
  const allCategories = [...new Set(agents.map((a) => a.category))]
    .sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  const allSources = [...new Set(skillsSh.map((s) => s.source))].sort();
  const allSkillsShCategories = [...new Set(skillsSh.map((s) => s.category || "Other"))]
    .sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

  const filteredSkills = skills.filter((s) => {
    const q = search.toLowerCase();
    if (q && !s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q)) return false;
    if (frameworkFilter && !s.frameworks.includes(frameworkFilter)) return false;
    return true;
  });

  const filteredAgents = agents.filter((a) => {
    const q = search.toLowerCase();
    if (q && !a.name.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q)) return false;
    if (modeFilter && a.mode !== modeFilter) return false;
    if (categoryFilter && a.category !== categoryFilter) return false;
    return true;
  });

  const filteredSkillsSh = skillsSh.filter((s) => {
    const q = search.toLowerCase();
    if (q && !s.name.toLowerCase().includes(q) && !(s.description || "").toLowerCase().includes(q) && !s.source.toLowerCase().includes(q)) return false;
    if (sourceFilter && s.source !== sourceFilter) return false;
    if (skillsShCategoryFilter && (s.category || "Other") !== skillsShCategoryFilter) return false;
    return true;
  });

  const groupedSkillsSh = allSkillsShCategories.reduce((acc, cat) => {
    const items = filteredSkillsSh.filter((s) => (s.category || "Other") === cat);
    if (items.length > 0) acc.push({ category: cat, items });
    return acc;
  }, [] as { category: string; items: SkillsShSkill[] }[]);

  const groupedAgents = allCategories.reduce((acc, cat) => {
    const items = filteredAgents.filter((a) => a.category === cat);
    if (items.length > 0) acc.push({ category: cat, items });
    return acc;
  }, [] as { category: string; items: AgentSummary[] }[]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-975 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-12 h-12">
            <div className="absolute inset-0 border-2 border-brand-500/30 rounded-full" />
            <div className="absolute inset-0 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-surface-400 text-sm font-medium tracking-wide">LOADING DASHBOARD</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-975 text-surface-100 font-sans antialiased selection:bg-brand-500/30">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <StatsHeader stats={stats} />

        <div className="bg-surface-950/80 backdrop-blur-sm rounded-2xl border border-surface-800/60 p-5 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <TabNav tab={tab} onTabChange={setTab} />
            <div className="flex-1 relative w-full">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search agents and skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-900 border border-surface-700/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-surface-100 placeholder-surface-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all duration-200"
              />
            </div>
            {tab === "skills" && allFrameworks.length > 0 && (
              <select
                value={frameworkFilter}
                onChange={(e) => setFrameworkFilter(e.target.value)}
                className="bg-surface-900 border border-surface-700/50 rounded-xl px-4 py-2.5 text-sm text-surface-200 focus:outline-none focus:border-brand-500/50 cursor-pointer appearance-none min-w-[140px]"
              >
                <option value="">All frameworks</option>
                {allFrameworks.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            )}
            {tab === "skills-sh" && (
              <>
                {allSkillsShCategories.length > 0 && (
                  <select
                    value={skillsShCategoryFilter}
                    onChange={(e) => setSkillsShCategoryFilter(e.target.value)}
                    className="bg-surface-900 border border-surface-700/50 rounded-xl px-4 py-2.5 text-sm text-surface-200 focus:outline-none focus:border-brand-500/50 cursor-pointer appearance-none min-w-[150px]"
                  >
                    <option value="">All categories</option>
                    {allSkillsShCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}
                {allSources.length > 0 && (
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="bg-surface-900 border border-surface-700/50 rounded-xl px-4 py-2.5 text-sm text-surface-200 focus:outline-none focus:border-brand-500/50 cursor-pointer appearance-none min-w-[200px]"
                  >
                    <option value="">All sources</option>
                    {allSources.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
                <button
                  onClick={() => setSkillsShView(skillsShView === "all" ? "grouped" : "all")}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-surface-800/50 hover:bg-surface-700/50 text-surface-300 hover:text-surface-100 border border-surface-700/30 hover:border-surface-600/50 cursor-pointer whitespace-nowrap"
                >
                  {skillsShView === "all" ? "Group by category" : "Show all"}
                </button>
              </>
            )}
            {tab === "agents" && (
              <>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-surface-900 border border-surface-700/50 rounded-xl px-4 py-2.5 text-sm text-surface-200 focus:outline-none focus:border-brand-500/50 cursor-pointer appearance-none min-w-[150px]"
                >
                  <option value="">All categories</option>
                  {allCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value)}
                  className="bg-surface-900 border border-surface-700/50 rounded-xl px-4 py-2.5 text-sm text-surface-200 focus:outline-none focus:border-brand-500/50 cursor-pointer appearance-none min-w-[130px]"
                >
                  <option value="">All modes</option>
                  {allModes.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <button
                  onClick={() => setView(view === "all" ? "grouped" : "all")}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-surface-800/50 hover:bg-surface-700/50 text-surface-300 hover:text-surface-100 border border-surface-700/30 hover:border-surface-600/50 cursor-pointer whitespace-nowrap"
                >
                  {view === "all" ? "Group by category" : "Show all"}
                </button>
              </>
            )}
          </div>
        </div>

        {tab === "skills" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSkills.map((s, i) => (
              <div key={s.name} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                <SkillCard skill={s} onClick={() => setSelectedSkill(s.name)} />
              </div>
            ))}
            {filteredSkills.length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="text-4xl mb-3 opacity-30">?</div>
                <p className="text-surface-500">No skills match your filters</p>
              </div>
            )}
          </div>
        )}

        {tab === "agents" && view === "all" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredAgents.map((a, i) => (
              <div key={a.name} className="animate-fade-in" style={{ animationDelay: `${(i % 20) * 25}ms` }}>
                <AgentCard agent={a} onClick={() => setSelectedAgent(a.name)} />
              </div>
            ))}
            {filteredAgents.length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="text-4xl mb-3 opacity-30">?</div>
                <p className="text-surface-500">No agents match your filters</p>
              </div>
            )}
          </div>
        )}

        {tab === "skills-sh" && skillsShView === "all" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredSkillsSh.map((s, i) => (
              <div key={s.id} className="animate-fade-in" style={{ animationDelay: `${(i % 20) * 25}ms` }}>
                <SkillsShCard skill={s} onClick={() => setSelectedSkillsSh(s)} />
              </div>
            ))}
            {filteredSkillsSh.length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="text-4xl mb-3 opacity-30">?</div>
                <p className="text-surface-500">No skills found on skills.sh</p>
              </div>
            )}
          </div>
        )}

        {tab === "skills-sh" && skillsShView === "grouped" && (
          <div className="space-y-10">
            {groupedSkillsSh.map(({ category, items }) => (
              <section key={category} className="animate-fade-in">
                <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r ${CATEGORY_COLORS[category] || "from-surface-800/50 to-surface-900/50 border-surface-700/30"} border mb-5`}>
                  <h2 className="text-sm font-semibold text-surface-200 tracking-wide">{category}</h2>
                  <span className="text-xs font-medium text-surface-500 bg-surface-900/50 px-2.5 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {items.map((s, i) => (
                    <div key={s.id} className="animate-fade-in" style={{ animationDelay: `${i * 20}ms` }}>
                      <SkillsShCard skill={s} onClick={() => setSelectedSkillsSh(s)} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
            {groupedSkillsSh.length === 0 && (
              <div className="text-center py-16">
                <div className="text-4xl mb-3 opacity-30">?</div>
                <p className="text-surface-500">No skills match your filters</p>
              </div>
            )}
          </div>
        )}

        {tab === "agents" && view === "grouped" && (
          <div className="space-y-10">
            {groupedAgents.map(({ category, items }) => (
              <section key={category} className="animate-fade-in">
                <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r ${CATEGORY_COLORS[category] || "from-surface-800/50 to-surface-900/50 border-surface-700/30"} border mb-5`}>
                  <h2 className="text-sm font-semibold text-surface-200 tracking-wide">{category}</h2>
                  <span className="text-xs font-medium text-surface-500 bg-surface-900/50 px-2.5 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {items.map((a, i) => (
                    <div key={a.name} className="animate-fade-in" style={{ animationDelay: `${i * 20}ms` }}>
                      <AgentCard agent={a} onClick={() => setSelectedAgent(a.name)} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
            {groupedAgents.length === 0 && (
              <div className="text-center py-16">
                <div className="text-4xl mb-3 opacity-30">?</div>
                <p className="text-surface-500">No agents match your filters</p>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedSkill && (
        <SkillModal name={selectedSkill} onClose={() => setSelectedSkill(null)} />
      )}
      {selectedAgent && (
        <AgentModal name={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}
      {selectedSkillsSh && (
        <SkillsShModal skill={selectedSkillsSh} onClose={() => setSelectedSkillsSh(null)} />
      )}

      {/* Footer */}
      <footer className="mt-20 border-t border-surface-800/40 py-8 text-center text-xs text-surface-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} SkillNexus. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1.5">
            <span>Creado con ❤️ por</span>
            <a
              href="https://etrinidad.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-400 hover:text-brand-300 transition-all duration-200 hover:underline inline-flex items-center gap-0.5"
            >
              Edward Trinidad
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.6} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </p>
        </div>
      </footer>

      {syncToast?.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-surface-900/90 backdrop-blur-md border border-brand-500/30 rounded-xl shadow-[0_0_20px_rgba(92,124,250,0.2)] text-brand-200 text-sm font-medium animate-fade-in">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-ping" />
          <span>{syncToast.message}</span>
        </div>
      )}
    </div>
  );
}
