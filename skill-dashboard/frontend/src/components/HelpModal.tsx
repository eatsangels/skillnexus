import { useEffect, useState } from "react";
import type { SystemPaths } from "../api";

interface Props {
  systemPaths: SystemPaths | null;
  onClose: () => void;
}

export default function HelpModal({ systemPaths, onClose }: Props) {
  const [lang, setLang] = useState<"en" | "es">(() => {
    const saved = localStorage.getItem("agent-modal-lang");
    return saved === "en" || saved === "es" ? saved : "es";
  });

  useEffect(() => {
    localStorage.setItem("agent-modal-lang", lang);
  }, [lang]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const skillsPath = systemPaths?.skillsDir || "C:\\Users\\EaTsAngels\\Documents\\curso-opencode\\.opencode\\skills";
  const projectRootPath = systemPaths?.projectRoot || "C:\\ID_Skills";
  const backendDirPath = systemPaths?.backendDir || "C:\\ID_Skills\\skill-dashboard\\backend";

  const content = {
    es: {
      title: "Centro de Ayuda - SkillNexus",
      aboutTitle: "Acerca de SkillNexus",
      aboutDesc: "SkillNexus es un centro de control profesional y premium diseñado para la orquestación, prueba e instalación local de habilidades y agentes cognitivos. Funciona perfectamente integrado con sistemas basados en Claude Code y OpenCode.",
      diffTitle: "🧠 Agente vs. 🔧 Skill",
      diffIntro: "La diferencia principal es que un Agente decide qué hacer, mientras que una Skill sabe cómo hacer una tarea específica.",
      agentTitle: "Agente (Agent)",
      agentDesc: "Es una IA que recibe un objetivo general, analiza la situación, toma decisiones, selecciona herramientas o skills, ejecuta secuencias de acciones y se adapta a los resultados para resolver problemas complejos de manera autónoma.",
      agentExample: 'Ejemplo: "Crea una app de Uber Eats" -> El agente diseña la base de datos, programa el frontend, configura Supabase y realiza el despliegue de forma autónoma.',
      skillTitle: "Skill (Habilidad)",
      skillDesc: "Es una capacidad concreta y especializada. No toma decisiones complejas ni formula planes por sí sola; simplemente ejecuta de forma experta la tarea exacta para la que fue creada.",
      skillExample: 'Ejemplo: "Generar código React" -> Recibe una entrada como "Crear formulario de login" y devuelve estrictamente el componente correspondiente.',
      analogyTitle: "Analogía Sencilla: La Empresa",
      analogyDesc: "En una empresa: Agente = Gerente | Skills = Empleados especializados. El gerente decide la estrategia (\"Necesitamos una web\") y coordina y delega las tareas a los especialistas (diseñador, programador, DevOps). Los especialistas ejecutan sus habilidades concretas.",
      cliTitle: "Comandos Rápidos de la CLI",
      cliDesc: "Puedes interactuar con tus habilidades y agentes directamente desde la terminal del sistema ejecutando:",
      shortcutTitle: "Atajos de Teclado",
      pathsTitle: "Directorios y Rutas Clave",
      shortcuts: [
        { key: "Esc", desc: "Cerrar modales y ventanas emergentes." },
        { key: "Enter", desc: "Ejecutar pruebas en el Playground del Agente." },
        { key: "Ctrl + F", desc: "Enfocar la barra de búsqueda de agentes/skills." },
      ],
      paths: [
        { name: "Directorio de Skills", path: skillsPath },
        { name: "Raíz del Proyecto", path: projectRootPath },
        { name: "Dashboard Backend", path: backendDirPath },
      ],
      supportTitle: "Contacto y Soporte",
      supportDesc: "Si tienes alguna sugerencia de diseño, encuentras algún error o deseas colaborar, puedes comunicarte directamente con el desarrollador o visitar su portafolio.",
      visitPortfolio: "Visitar Portafolio",
      closeBtn: "Entendido / Cerrar",
      videoTitle: "Guía Rápida de Introducción",
      videoDesc: "Visualiza este video introductorio para familiarizarte con las capacidades, interfaz e integración de agentes y habilidades en SkillNexus."
    },
    en: {
      title: "Help Center - SkillNexus",
      aboutTitle: "About SkillNexus",
      aboutDesc: "SkillNexus is a professional, premium control center designed for orchestrating, testing, and installing local cognitive skills and agents. It integrates seamlessly with cognitive execution environments such as Claude Code and OpenCode.",
      diffTitle: "🧠 Agent vs. 🔧 Skill",
      diffIntro: "The primary difference is that an Agent decides what to do, while a Skill knows how to perform a specific task.",
      agentTitle: "Agent",
      agentDesc: "An AI that receives a general goal, analyzes the context, makes decisions, chooses appropriate tools or skills, executes action sequences, and adapts based on outcomes to solve complex tasks autonomously.",
      agentExample: 'Example: "Create a Uber Eats clone" -> The agent plans the DB design, writes the frontend, configures Supabase, and deploys it.',
      skillTitle: "Skill",
      skillDesc: "A concrete, specialized capability. It does not make high-level decisions or formulate strategic plans on its own; it simply performs the exact task it was programmed for.",
      skillExample: 'Example: "Generate React Code" -> Takes an input like "Create a login form" and returns strictly the code snippet.',
      analogyTitle: "Simple Analogy: The Company",
      analogyDesc: "In a company: Agent = Manager | Skills = Specialized Employees. The manager decides the strategy (\"We need a website\") and delegates tasks to the specialists (designer, programmer, DevOps). The specialists perform their specific skills.",
      cliTitle: "CLI Quick Commands",
      cliDesc: "You can interact with your skills and agents directly from your system console by running:",
      shortcutTitle: "Keyboard Shortcuts",
      pathsTitle: "Key Directories & Paths",
      shortcuts: [
        { key: "Esc", desc: "Close modals and overlay windows." },
        { key: "Enter", desc: "Run agent tests inside the Playground." },
        { key: "Ctrl + F", desc: "Focus search bar." },
      ],
      paths: [
        { name: "Skills Directory", path: skillsPath },
        { name: "Workspace Root", path: projectRootPath },
        { name: "Dashboard Backend", path: backendDirPath },
      ],
      supportTitle: "Contact & Support",
      supportDesc: "If you have design suggestions, find bugs, or want to collaborate, feel free to contact the developer directly or visit his personal website.",
      visitPortfolio: "Visit Portfolio",
      closeBtn: "Got it / Close",
      videoTitle: "Quick Introduction Guide",
      videoDesc: "Watch this introductory video to get familiar with the capabilities, interface, and integration of agents and skills in SkillNexus."
    }
  };

  const t = content[lang];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-scale-in bg-surface-900 border border-surface-700/60 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="shrink-0 bg-surface-900/95 backdrop-blur-sm border-b border-surface-800/60 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm">
              ?
            </div>
            <h2 className="text-lg font-bold text-surface-100">{t.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-surface-950 border border-surface-800 rounded-lg p-0.5">
              <button
                onClick={() => setLang("en")}
                className={`text-[9px] font-semibold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  lang === "en" ? "bg-brand-500 text-white shadow-sm" : "text-surface-400 hover:text-surface-200"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("es")}
                className={`text-[9px] font-semibold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  lang === "es" ? "bg-brand-500 text-white shadow-sm" : "text-surface-400 hover:text-surface-200"
                }`}
              >
                ES
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface-800/50 hover:bg-surface-700/50 text-surface-400 hover:text-surface-200 transition-all cursor-pointer shrink-0"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto min-h-0 flex-1 space-y-6">
          {/* About */}
          <div className="bg-gradient-to-br from-brand-600/5 to-brand-900/5 border border-brand-500/15 rounded-xl p-5">
            <h3 className="text-xs font-bold text-brand-300 uppercase tracking-wider mb-2">
              {t.aboutTitle}
            </h3>
            <p className="text-sm text-surface-300 leading-relaxed">{t.aboutDesc}</p>
          </div>

          {/* Video Tutorial */}
          <div className="bg-surface-950/40 border border-surface-800/50 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 bg-brand-500 rounded-full"></span>
              <h3 className="text-xs font-bold text-surface-200 uppercase tracking-wider">
                {t.videoTitle}
              </h3>
            </div>
            <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-black shadow-[4px_4px_0px_0px_#000000] bg-black group transition-all duration-300 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000000]">
              <video
                src={`${import.meta.env.BASE_URL}intro.mp4`}
                controls
                className="w-full h-full object-cover"
                poster={`${import.meta.env.BASE_URL}mascot_logo.png`}
              />
            </div>
            <p className="text-xs text-surface-400 leading-relaxed">
              {t.videoDesc}
            </p>
          </div>

          {/* Difference between Agent and Skill */}
          <div className="border border-surface-800/60 bg-surface-950/20 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 bg-brand-500 rounded-full"></span>
              <h3 className="text-xs font-bold text-surface-200 uppercase tracking-wider">
                {t.diffTitle}
              </h3>
            </div>
            
            <p className="text-xs text-surface-300 leading-relaxed font-semibold italic bg-surface-950/60 p-3 rounded-lg border border-surface-800/40">
              "{t.diffIntro}"
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Agent Card */}
              <div className="bg-surface-900/60 border border-brand-500/20 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-brand-400 font-bold text-sm">
                  <span>🧠</span>
                  <span>{t.agentTitle}</span>
                </div>
                <p className="text-xs text-surface-300 leading-relaxed">
                  {t.agentDesc}
                </p>
                <div className="text-[11px] text-brand-300/80 bg-brand-500/5 border border-brand-500/10 rounded p-2.5 font-mono italic">
                  {t.agentExample}
                </div>
              </div>

              {/* Skill Card */}
              <div className="bg-surface-900/60 border border-blue-500/20 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-blue-400 font-bold text-sm">
                  <span>🔧</span>
                  <span>{t.skillTitle}</span>
                </div>
                <p className="text-xs text-surface-300 leading-relaxed">
                  {t.skillDesc}
                </p>
                <div className="text-[11px] text-blue-300/80 bg-blue-500/5 border border-blue-500/10 rounded p-2.5 font-mono italic">
                  {t.skillExample}
                </div>
              </div>
            </div>

            {/* Analogy Box */}
            <div className="bg-surface-950/40 border border-surface-800/50 rounded-xl p-4 flex gap-3">
              <div className="text-xl shrink-0">🏢</div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-surface-300">
                  {t.analogyTitle}
                </h4>
                <p className="text-xs text-surface-400 leading-relaxed">
                  {t.analogyDesc}
                </p>
              </div>
            </div>
          </div>

          {/* Paths */}
          <div>
            <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-3">
              {t.pathsTitle}
            </h3>
            <div className="space-y-2">
              {t.paths.map((p) => (
                <div
                  key={p.name}
                  className="bg-surface-950/40 border border-surface-800/50 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <span className="text-xs font-semibold text-surface-400">{p.name}</span>
                  <code className="text-[11px] text-brand-300 bg-surface-900 px-2 py-0.5 rounded border border-surface-800/50 font-mono break-all sm:break-normal">
                    {p.path}
                  </code>
                </div>
              ))}
            </div>
          </div>

          {/* Shortcuts & CLI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-3">
                {t.shortcutTitle}
              </h3>
              <div className="space-y-2.5">
                {t.shortcuts.map((s) => (
                  <div key={s.key} className="flex items-center gap-3">
                    <kbd className="min-w-[50px] text-center bg-surface-850 border border-surface-700/60 rounded px-1.5 py-0.5 text-[11px] text-surface-300 font-mono shadow-sm">
                      {s.key}
                    </kbd>
                    <span className="text-xs text-surface-400">{s.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-3">
                {t.cliTitle}
              </h3>
              <p className="text-xs text-surface-500 mb-2">{t.cliDesc}</p>
              <div className="bg-surface-950/80 border border-surface-800/80 rounded-xl p-3 font-mono text-[11px] space-y-1.5 text-emerald-400">
                <div># List active agents</div>
                <div>npx opencode agents list</div>
                <div className="pt-1.5"># Scan new skills</div>
                <div>npx opencode skills scan</div>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="bg-surface-950/40 border border-surface-800/50 rounded-xl p-5 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-surface-300 uppercase tracking-wider mb-1.5">
                {t.supportTitle}
              </h4>
              <p className="text-xs text-surface-400 leading-relaxed">{t.supportDesc}</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-surface-800/40">
              <span className="text-[11px] text-surface-500">
                Creado por <span className="font-semibold text-brand-400">Edward Trinidad</span>
              </span>
              <a
                href="https://etrinidad.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-brand-600/10 inline-flex items-center gap-1.5 cursor-pointer"
              >
                {t.visitPortfolio}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.3}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="shrink-0 border-t border-surface-800/60 px-6 py-4 bg-surface-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-surface-800 hover:bg-surface-700 text-surface-200 text-xs font-semibold rounded-xl transition-all border border-surface-700/50 hover:border-surface-600 cursor-pointer"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
