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
      closeBtn: "Entendido / Cerrar"
    },
    en: {
      title: "Help Center - SkillNexus",
      aboutTitle: "About SkillNexus",
      aboutDesc: "SkillNexus is a professional, premium control center designed for orchestrating, testing, and installing local cognitive skills and agents. It integrates seamlessly with cognitive execution environments such as Claude Code and OpenCode.",
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
      closeBtn: "Got it / Close"
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
