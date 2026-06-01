import { useEffect, useState, useRef } from "react";
import type { SkillSummary, AgentSummary, DashboardStats, SkillsShSkill, SystemPaths, AgentsShAgent } from "./api";
import { fetchSkills, fetchAgents, fetchDashboard, fetchSkillsSh, fetchAgentsSh, BASE } from "./api";
import StatsHeader from "./components/StatsHeader.tsx";
import TabNav from "./components/TabNav.tsx";
import SkillCard from "./components/SkillCard.tsx";
import AgentCard from "./components/AgentCard.tsx";
import SkillModal from "./components/SkillModal.tsx";
import AgentModal from "./components/AgentModal.tsx";
import SkillsShCard from "./components/SkillsShCard.tsx";
import SkillsShModal from "./components/SkillsShModal.tsx";
import AgentsShCard from "./components/AgentsShCard.tsx";
import AgentsShModal from "./components/AgentsShModal.tsx";
import HelpModal from "./components/HelpModal.tsx";
import VideoStudio from "./components/VideoStudio.tsx";

type Tab = "skills" | "agents" | "skills-sh" | "agents-sh" | "video";
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
  const [agentsShView, setAgentsShView] = useState<ViewMode>("all");
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [skillsSh, setSkillsSh] = useState<SkillsShSkill[]>([]);
  const [agentsSh, setAgentsSh] = useState<AgentsShAgent[]>([]);
  const [search, setSearch] = useState("");
  const [frameworkFilter, setFrameworkFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [skillsShCategoryFilter, setSkillsShCategoryFilter] = useState("");
  const [agentsShCategoryFilter, setAgentsShCategoryFilter] = useState("");
  const [agentsShSourceFilter, setAgentsShSourceFilter] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedSkillsSh, setSelectedSkillsSh] = useState<SkillsShSkill | null>(null);
  const [selectedAgentsSh, setSelectedAgentsSh] = useState<AgentsShAgent | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncToast, setSyncToast] = useState<{ show: boolean; message: string } | null>(null);
  const [systemPaths, setSystemPaths] = useState<SystemPaths | null>(null);

  // Dynamic version and auto-updater state
  const [version, setVersion] = useState("1.0.7");
  const [updateState, setUpdateState] = useState<{ status: string; version?: string | null; error?: string | null }>({ status: "idle" });
  const [showHelp, setShowHelp] = useState(false);
  const [hideUpdateBanner, setHideUpdateBanner] = useState(false);
  const [applyingUpdate, setApplyingUpdate] = useState(false);
  const [mascotEnabled, setMascotEnabled] = useState<boolean>(() => {
    return localStorage.getItem("nexus-mascot-enabled") !== "false";
  });

  const toggleMascot = () => {
    setMascotEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("nexus-mascot-enabled", String(next));
      return next;
    });
  };

  const reloadData = (isAuto = false) => {
    // 1. Fetch local data first (very fast, doesn't require internet / external calls)
    Promise.all([fetchSkills(), fetchAgents(), fetchDashboard()]).then(
      ([s, a, d]) => {
        setSkills(s.skills || []);
        setAgents(a.agents || []);
        setStats(d.stats || null);
        if (d.version) setVersion(d.version);
        if (d.update) setUpdateState(d.update);
        if (d.systemPaths) setSystemPaths(d.systemPaths);
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

    // 3. Fetch remote agents-sh catalog asynchronously in the background
    fetchAgentsSh().then((ash) => {
      setAgentsSh(ash.agents || []);
    }).catch((err) => {
      console.error("Failed to load agents.sh catalog:", err);
    });
  };

  const handleApplyUpdate = async () => {
    if (applyingUpdate) return;
    setApplyingUpdate(true);
    try {
      const res = await fetch(`${BASE}/updates/apply`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to apply update");
    } catch (err) {
      console.error("Error applying update:", err);
      alert("Error al reiniciar y aplicar la actualización: " + (err instanceof Error ? err.message : String(err)));
      setApplyingUpdate(false);
    }
  };

  useEffect(() => {
    reloadData(false);
  }, []);

  useEffect(() => {
    const eventSource = new EventSource(`${BASE}/events`);
    
    eventSource.onopen = () => {
      console.log("[SSE] Connection opened, reloading data...");
      reloadData(true);
    };

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

    eventSource.addEventListener("app-update", (event: any) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[SSE] Real-time update state changed:", data);
        setUpdateState(data);
      } catch (err) {
        console.error("[SSE] Failed to parse app-update data:", err);
      }
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

  const allAgentsShSources = [...new Set(agentsSh.map((s) => s.source))].sort();
  const allAgentsShCategories = [...new Set(agentsSh.map((s) => s.category || "Other"))]
    .sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

  const filteredAgentsSh = agentsSh.filter((s) => {
    const q = search.toLowerCase();
    if (q && !s.name.toLowerCase().includes(q) && !(s.description || "").toLowerCase().includes(q) && !s.source.toLowerCase().includes(q)) return false;
    if (agentsShSourceFilter && s.source !== agentsShSourceFilter) return false;
    if (agentsShCategoryFilter && (s.category || "Other") !== agentsShCategoryFilter) return false;
    return true;
  });

  const groupedAgentsSh = allAgentsShCategories.reduce((acc, cat) => {
    const items = filteredAgentsSh.filter((s) => (s.category || "Other") === cat);
    if (items.length > 0) acc.push({ category: cat, items });
    return acc;
  }, [] as { category: string; items: AgentsShAgent[] }[]);

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
      {updateState.status === "available" && (
        <div className="bg-brand-500/10 border-b border-brand-500/20 text-brand-300 text-xs py-2.5 px-6 flex items-center justify-center gap-2 animate-fade-in shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
          </span>
          <span>Sincronizando: La versión v{updateState.version} se está descargando automáticamente en segundo plano.</span>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <StatsHeader
          stats={stats}
          version={version}
          onHelpClick={() => setShowHelp(true)}
          updateState={updateState}
          applyingUpdate={applyingUpdate}
          onApplyUpdate={handleApplyUpdate}
        />

        <div className="bg-surface-950/80 backdrop-blur-sm rounded-2xl border border-surface-800/60 p-5 mb-8">
          <div className="flex flex-col gap-4">
            {/* Fila superior: Navegación por pestañas y Barra de búsqueda */}
            <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${tab !== "video" ? "pb-4 border-b border-surface-800/60" : ""}`}>
              <TabNav tab={tab} onTabChange={setTab} />
              {tab !== "video" && (
                <div className="relative w-full md:w-80 shrink-0">
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
              )}
            </div>

            {/* Fila inferior: Selectores de filtros y opciones */}
            {tab !== "video" && (
              <div className="flex flex-wrap items-center gap-3">
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
                {tab === "agents-sh" && (
                  <>
                    {allAgentsShCategories.length > 0 && (
                      <select
                        value={agentsShCategoryFilter}
                        onChange={(e) => setAgentsShCategoryFilter(e.target.value)}
                        className="bg-surface-900 border border-surface-700/50 rounded-xl px-4 py-2.5 text-sm text-surface-200 focus:outline-none focus:border-brand-500/50 cursor-pointer appearance-none min-w-[150px]"
                      >
                        <option value="">All categories</option>
                        {allAgentsShCategories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    )}
                    {allAgentsShSources.length > 0 && (
                      <select
                        value={agentsShSourceFilter}
                        onChange={(e) => setAgentsShSourceFilter(e.target.value)}
                        className="bg-surface-900 border border-surface-700/50 rounded-xl px-4 py-2.5 text-sm text-surface-200 focus:outline-none focus:border-brand-500/50 cursor-pointer appearance-none min-w-[200px]"
                      >
                        <option value="">All sources</option>
                        {allAgentsShSources.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                    <button
                      onClick={() => setAgentsShView(agentsShView === "all" ? "grouped" : "all")}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-surface-800/50 hover:bg-surface-700/50 text-surface-300 hover:text-surface-100 border border-surface-700/30 hover:border-surface-600/50 cursor-pointer whitespace-nowrap"
                    >
                      {agentsShView === "all" ? "Group by category" : "Show all"}
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

        {tab === "agents-sh" && agentsShView === "all" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredAgentsSh.map((s, i) => (
              <div key={s.id} className="animate-fade-in" style={{ animationDelay: `${(i % 20) * 25}ms` }}>
                <AgentsShCard agent={s} onClick={() => setSelectedAgentsSh(s)} />
              </div>
            ))}
            {filteredAgentsSh.length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="text-4xl mb-3 opacity-30">?</div>
                <p className="text-surface-500">No agents found on agents.sh</p>
              </div>
            )}
          </div>
        )}

        {tab === "agents-sh" && agentsShView === "grouped" && (
          <div className="space-y-10">
            {groupedAgentsSh.map(({ category, items }) => (
              <section key={category} className="animate-fade-in">
                <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r ${CATEGORY_COLORS[category] || "from-surface-800/50 to-surface-900/50 border-surface-700/30"} border mb-5`}>
                  <h2 className="text-sm font-semibold text-surface-200 tracking-wide">{category}</h2>
                  <span className="text-xs font-medium text-surface-500 bg-surface-900/50 px-2.5 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {items.map((s, i) => (
                    <div key={s.id} className="animate-fade-in" style={{ animationDelay: `${i * 20}ms` }}>
                      <AgentsShCard agent={s} onClick={() => setSelectedAgentsSh(s)} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
            {groupedAgentsSh.length === 0 && (
              <div className="text-center py-16">
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

        {tab === "video" && (
          <VideoStudio base={BASE} />
        )}
      </div>

      {selectedSkill && (
        <SkillModal name={selectedSkill} onClose={() => setSelectedSkill(null)} />
      )}
      {selectedAgent && (
        <AgentModal name={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}
      {selectedSkillsSh && (
        <SkillsShModal
          skill={selectedSkillsSh}
          onClose={() => setSelectedSkillsSh(null)}
          onInstallSuccess={() => reloadData(true)}
        />
      )}
      {selectedAgentsSh && (
        <AgentsShModal
          agent={selectedAgentsSh}
          onClose={() => setSelectedAgentsSh(null)}
          onInstallSuccess={() => reloadData(true)}
        />
      )}
      {showHelp && (
        <HelpModal systemPaths={systemPaths} onClose={() => setShowHelp(false)} />
      )}

      {/* Floating downloaded update banner */}
      {updateState.status === "downloaded" && !hideUpdateBanner && (
        <div className="fixed bottom-6 right-6 z-40 max-w-sm w-full bg-surface-900/95 backdrop-blur-md border border-brand-500/40 rounded-2xl p-5 shadow-[0_10px_50px_rgba(0,0,0,0.8)] animate-scale-in">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-bold text-surface-100">
                ¡Actualización Lista!
              </h4>
              <p className="text-xs text-surface-400 leading-relaxed">
                La versión <span className="font-semibold text-brand-300">v{updateState.version}</span> se ha descargado de forma segura y está lista para instalar.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-surface-800/40">
            <button
              onClick={() => setHideUpdateBanner(true)}
              className="px-3.5 py-1.5 hover:bg-surface-800 text-surface-400 hover:text-surface-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Más tarde
            </button>
            <button
              onClick={handleApplyUpdate}
              disabled={applyingUpdate}
              className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-brand-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              {applyingUpdate ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Instalando...
                </>
              ) : (
                "Reiniciar y actualizar"
              )}
            </button>
          </div>
        </div>
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

      {/* Mascot Toggle Button — fixed bottom-right corner */}
      <button
        id="mascot-toggle-btn"
        onClick={toggleMascot}
        title={mascotEnabled ? "Ocultar mascota" : "Mostrar mascota"}
        className="mascot-toggle-btn"
      >
        <span className="mascot-toggle-icon">🐯</span>
        <span className="mascot-toggle-track">
          <span className={`mascot-toggle-thumb ${mascotEnabled ? "mascot-toggle-thumb--on" : ""}`} />
        </span>
      </button>

      {/* Nexus Tiger Mascot */}
      {mascotEnabled && <NexusTiger />}
    </div>
  );
}

interface TransparentVideoProps {
  src: string;
  className?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
}

function TransparentVideo({ src, className, onClick, onMouseEnter }: TransparentVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let active = true;
    const ctx = canvas.getContext("2d");

    const TARGET_HEIGHT = 160; // px — match container size

    const renderFrame = () => {
      if (!active) return;
      if (video.paused || video.ended) {
        requestAnimationFrame(renderFrame);
        return;
      }

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (vw && vh) {
        // Scale canvas so height = TARGET_HEIGHT, preserving aspect ratio
        const scale = TARGET_HEIGHT / vh;
        const w = Math.round(vw * scale);
        const h = TARGET_HEIGHT;

        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;

        if (ctx) {
          // Use high-quality downscaling
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(video, 0, 0, w, h);
          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;

          // Sample background color from top-left pixel (0,0)
          const bgR = data[0];
          const bgG = data[1];
          const bgB = data[2];

          // Key out background color with some tolerance
          const tolerance = 30;
          const feather = 8;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];

            const diffR = Math.abs(r - bgR);
            const diffG = Math.abs(g - bgG);
            const diffB = Math.abs(b - bgB);

            const dist = Math.max(diffR, diffG, diffB);
            if (dist < tolerance) {
              if (dist < tolerance - feather) {
                data[i+3] = 0; // Fully transparent
              } else {
                // Smooth feathered edge
                const alphaRatio = (dist - (tolerance - feather)) / feather;
                data[i+3] = Math.floor(alphaRatio * 255);
              }
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }
      }

      requestAnimationFrame(renderFrame);
    };

    const handlePlay = () => {
      requestAnimationFrame(renderFrame);
    };

    const handleCanPlay = () => {
      video.play().catch(() => {});
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("canplay", handleCanPlay);

    // Explicitly try playing
    video.play().catch(() => {});

    // In case video is already playing
    if (!video.paused) {
      requestAnimationFrame(renderFrame);
    }

    return () => {
      active = false;
      if (video) {
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("canplay", handleCanPlay);
      }
    };
  }, [src]);

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        crossOrigin="anonymous"
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: -1,
        }}
        autoPlay
        loop
        muted
        playsInline
      />
      <canvas
        ref={canvasRef}
        className={className}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
      />
    </>
  );
}

type BubbleType = "speech" | "thought";

// Animation total duration must match CSS walk-back-and-forth
const ANIM_DURATION_MS = 22000;
const ANIM_START = Date.now(); // approximates CSS animation start

function NexusTiger() {
  const [showBubble, setShowBubble] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [bubbleText, setBubbleText] = useState("");
  const [bubbleType, setBubbleType] = useState<BubbleType>("speech");
  const [tigerLeft, setTigerLeft] = useState(-2);
  const [isFlipped, setIsFlipped] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const elapsedRef = useRef(0);
  const lastTickRef = useRef(Date.now());

  // Track position & direction via JS, pausing animation smoothly on hover
  useEffect(() => {
    lastTickRef.current = Date.now();
    
    const tick = () => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      if (!isHovered) {
        elapsedRef.current = (elapsedRef.current + delta) % ANIM_DURATION_MS;
        const p = elapsedRef.current / ANIM_DURATION_MS;

        let left: number;
        if (p < 0.48) {
          // Walking left → right: -2% to 88%
          left = -2 + (p / 0.48) * 90;
        } else if (p < 0.50) {
          left = 88; // pausing at right end
        } else if (p < 0.98) {
          // Walking right → left: 88% to -2%
          left = 88 - ((p - 0.50) / 0.48) * 90;
        } else {
          left = -2; // pausing at left end
        }
        setTigerLeft(left);
        setIsFlipped(p < 0.50);
      }
    };

    const id = setInterval(tick, 50);
    return () => clearInterval(id);
  }, [isHovered]);

  const speechPhrases = [
    "¡Ruge con código! 🐯",
    "¡Modo Hacker activado! 💻",
    "¿Listo para crear impacto?",
    "¡Estilo Neo-Brutalista al 100%! ⭐",
    "¡Sincronizando habilidades! 🔄",
    "¡Tigre Nexus en patrulla! 🚀",
    "¡Ruge con Neo-Brutalis!",
    "¿Qué skill usaremos hoy? 🛠️",
    "¡El código no se escribe solo! 💪",
    "¡Vamos a romperla hoy! 🔥",
    "¡SkillNexus al poder! ⚡",
    "¡Ese bug no tiene escapatoria! 🐛",
  ];

  const thoughtPhrases = [
    "Hmm... ¿será un bug o una feature? 🤔",
    "No olvides tomar agua 💧",
    "Si funciona, no lo toques... 🫣",
    "Necesito más café ☕",
    "¿Y si refactorizo todo? 😈",
    "El README dice que funciona...",
    "Funciona en mi máquina 🤷",
    "99 bugs en el código... arreglé uno... 101 bugs 😅",
    "¿Semicolón o no semicolón? 🧐",
    "Debería escribir más tests... mañana 😴",
    "¿Por qué funciona esto? 🤯",
    "Modo focus: activado 🧠",
  ];

  const triggerBubble = (type: BubbleType, text: string) => {
    setFadingOut(false);
    setBubbleType(type);
    setBubbleText(text);
    setShowBubble(true);
  };

  const handleInteraction = () => {
    const randomPhrase = speechPhrases[Math.floor(Math.random() * speechPhrases.length)];
    triggerBubble("speech", randomPhrase);
  };

  // Hide bubble with fade-out, but keep it visible and pause fade timer if hovered
  useEffect(() => {
    if (showBubble && !isHovered) {
      const fadeTimer = setTimeout(() => setFadingOut(true), 2800);
      const hideTimer = setTimeout(() => {
        setShowBubble(false);
        setFadingOut(false);
      }, 3200);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    } else if (isHovered) {
      setFadingOut(false);
    }
  }, [showBubble, isHovered]);

  // Auto-trigger bubbles randomly only when not hovered
  useEffect(() => {
    if (isHovered) return;

    const scheduleNext = () => {
      const delay = 8000 + Math.random() * 10000;
      return setTimeout(() => {
        if (isHovered) return;
        const isThought = Math.random() < 0.4;
        const pool = isThought ? thoughtPhrases : speechPhrases;
        const randomPhrase = pool[Math.floor(Math.random() * pool.length)];
        triggerBubble(isThought ? "thought" : "speech", randomPhrase);
      }, delay);
    };

    let timer = scheduleNext();
    const interval = setInterval(() => {
      if (isHovered) return;
      clearTimeout(timer);
      timer = scheduleNext();
    }, 3500);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered]);

  return (
    <>
      <div 
        className="nexus-tiger-container"
        style={{ left: `${tigerLeft}%` }}
        onMouseEnter={() => {
          setIsHovered(true);
          handleInteraction();
        }}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div 
          className="nexus-tiger-wrapper"
          style={{ transform: isFlipped ? "scaleX(-1)" : "scaleX(1)" }}
        >
          <TransparentVideo
            src={`${import.meta.env.BASE_URL}Animado.mp4`}
            className="nexus-tiger-image"
            onClick={handleInteraction}
          />
        </div>

        {/* Bubble rendered inside container — text is always readable and moves with the tiger */}
        {showBubble && (
          <div
            className={`nexus-speech-bubble nexus-speech-bubble--${bubbleType} ${fadingOut ? "nexus-speech-bubble--fade-out" : ""}`}
          >
            {bubbleText}
          </div>
        )}
      </div>
    </>
  );
}

