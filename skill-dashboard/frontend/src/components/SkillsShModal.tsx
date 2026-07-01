import { useEffect, useState } from "react";
import type { SkillsShDetail, SkillsShSkill } from "../api";
import { fetchSkillsShDetail, installSkillsSh } from "../api";

interface Props {
  skill: SkillsShSkill;
  onClose: () => void;
  onInstallSuccess?: () => void;
}

export default function SkillsShModal({ skill, onClose, onInstallSuccess }: Props) {
  const [copied, setCopied] = useState(false);
  const [detail, setDetail] = useState<SkillsShDetail | null>(null);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [installedAgents, setInstalledAgents] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [lang, setLang] = useState<"en" | "es">("es");


  useEffect(() => {
    fetchSkillsShDetail(skill.source, skill.slug)
      .then((r) => setDetail(r.skill))
      .catch(() => setDetail(null));
  }, [skill.source, skill.slug]);

  async function handleInstall() {
    setInstalling(true);
    setError("");
    try {
      const res = await installSkillsSh(skill.source, skill.slug);
      setInstalled(true);
      setInstalledAgents(res.result?.agents || []);
      if (onInstallSuccess) {
        onInstallSuccess();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Install failed");
    } finally {
      setInstalling(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl bg-surface-900 border border-surface-700/50 rounded-2xl shadow-2xl shadow-black/40 animate-scale-in flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-surface-700/30 shrink-0 gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-lg font-bold text-surface-100 truncate">{skill.name}</h2>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`skills ${skill.name}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="p-1 rounded hover:bg-surface-800/60 text-surface-500 hover:text-emerald-400 transition-all cursor-pointer shrink-0"
                title="Copy skill name"
              >
                {copied ? (
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            <span className="text-sm text-surface-400 font-mono block truncate">{skill.source}</span>
          </div>
          <button onClick={onClose} className="text-surface-500 hover:text-surface-200 transition-colors cursor-pointer p-1 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-semibold">
              {skill.installs.toLocaleString()} installs
            </span>
            {skill.topic && (
              <span className="text-xs text-surface-400 bg-surface-800/60 px-2.5 py-1 rounded-full">{skill.topic}</span>
            )}
          </div>

          {detail?.description && (
            <div className="bg-surface-950/30 border border-surface-800/40 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider">Description</p>
                <div className="flex items-center gap-1 bg-surface-900 border border-surface-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setLang("en")}
                    className={`text-[9px] font-semibold px-2 py-0.5 rounded-md transition-all cursor-pointer ${lang === "en" ? "bg-brand-500 text-white shadow-sm" : "text-surface-400 hover:text-surface-200"}`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setLang("es")}
                    className={`text-[9px] font-semibold px-2 py-0.5 rounded-md transition-all cursor-pointer ${lang === "es" ? "bg-brand-500 text-white shadow-sm" : "text-surface-400 hover:text-surface-200"}`}
                  >
                    ES
                  </button>
                </div>
              </div>
              <p className="text-sm text-surface-300 leading-relaxed">
                {lang === "es" ? (detail.descriptionEs || detail.description) : (detail.descriptionEn || detail.description)}
              </p>
            </div>
          )}

          <div className="bg-surface-950/60 rounded-xl p-3 border border-surface-700/30">
            <p className="text-[11px] text-surface-500 font-semibold tracking-wider mb-1">INSTALL COMMAND</p>
            <code className="text-sm text-emerald-300 font-mono break-all">
              npx skills add {skill.installUrl} --skill {skill.name}
            </code>
          </div>

          {detail?.skMd && (
            <div>
              <p className="text-[11px] text-surface-500 font-semibold tracking-wider mb-2">SKILL.md</p>
              <pre className="text-xs text-surface-300 bg-surface-950/60 rounded-xl p-4 border border-surface-700/30 whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-y-auto">
                {detail.skMd.length > 4000 ? detail.skMd.slice(0, 4000) + "\n\n... (truncated)" : detail.skMd}
              </pre>
            </div>
          )}

          {!detail?.skMd && !detail?.description && (
            <p className="text-sm text-surface-500 italic">Loading skill details...</p>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="p-5 border-t border-surface-700/30 shrink-0 space-y-3">
          <button
            onClick={handleInstall}
            disabled={installing || installed}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              installed
                ? "bg-emerald-600/30 text-emerald-400 border border-emerald-500/30"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {installing
              ? (lang === "es" ? "Instalando en todas tus IAs..." : "Installing to all your AIs...")
              : installed
                ? (lang === "es" ? "Instalada" : "Installed")
                : (lang === "es" ? "Instalar en todas mis IAs" : "Install to all my AIs")}
          </button>

          {installed && installedAgents.length > 0 && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                {lang === "es" ? `Instalada en ${installedAgents.length} IA${installedAgents.length === 1 ? "" : "s"}` : `Installed to ${installedAgents.length} AI${installedAgents.length === 1 ? "" : "s"}`}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {installedAgents.map((a) => (
                  <span key={a} className="text-[11px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
