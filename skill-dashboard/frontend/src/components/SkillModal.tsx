import { useEffect, useState } from "react";
import type { SkillDetail } from "../api";
import { fetchSkill } from "../api";

interface Props {
  name: string;
  onClose: () => void;
}

export default function SkillModal({ name, onClose }: Props) {
  const [detail, setDetail] = useState<SkillDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"en" | "es">(() => {
    const saved = localStorage.getItem("agent-modal-lang");
    return (saved === "en" || saved === "es") ? saved : "es";
  });

  useEffect(() => {
    localStorage.setItem("agent-modal-lang", lang);
  }, [lang]);

  useEffect(() => {
    fetchSkill(name).then((res) => {
      setDetail(res.skill);
      setLoading(false);
    });
  }, [name]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="animate-scale-in bg-surface-900 border border-surface-700/60 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl shadow-black/50">
        <div className="shrink-0 bg-surface-900/95 backdrop-blur-sm border-b border-surface-800/60 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-surface-100">
            {loading ? "Loading..." : detail?.name || name}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface-800/50 hover:bg-surface-700/50 text-surface-400 hover:text-surface-200 transition-all cursor-pointer"
          >
            &times;
          </button>
        </div>
        <div className="p-6 overflow-y-auto min-h-0 flex-1">
          {loading ? (
            <div className="flex items-center gap-3 text-surface-400">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              Loading skill details...
            </div>
          ) : detail ? (
            <div className="space-y-6">
              <div className="bg-surface-950/50 border border-surface-800/50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-1.5">
                  <p className="text-sm font-medium text-surface-400 uppercase tracking-wider text-[11px]">Description</p>
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
                <p className="text-surface-200 leading-relaxed text-sm">
                  {lang === "es" ? (detail.descriptionEs || detail.description) : (detail.descriptionEn || detail.description || "No description")}
                </p>
              </div>

              {detail.frameworks.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-surface-400 uppercase tracking-wider mb-2 text-[11px]">Frameworks</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.frameworks.map((fw) => (
                      <span key={fw} className="text-xs bg-brand-500/10 text-brand-400 px-3 py-1 rounded-full font-medium">{fw}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-surface-400 uppercase tracking-wider mb-1.5 text-[11px]">Location</p>
                <code className="text-xs text-surface-400 bg-surface-950/50 px-3 py-2 rounded-xl block overflow-x-auto border border-surface-800/50">
                  {detail.location}
                </code>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-surface-400 uppercase tracking-wider text-[11px]">Format</p>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                  detail.format === "directory"
                    ? "bg-blue-500/15 text-blue-400"
                    : "bg-amber-500/15 text-amber-400"
                }`}>
                  {detail.format}
                </span>
              </div>

              {detail.assets.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-surface-400 uppercase tracking-wider mb-2 text-[11px]">Assets</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.assets.map((a) => (
                      <span key={a} className="text-[11px] bg-surface-800/50 text-surface-400 px-2.5 py-1 rounded-full font-mono">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {detail.references.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-surface-400 uppercase tracking-wider mb-2 text-[11px]">References</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.references.map((r) => (
                      <span key={r} className="text-[11px] bg-surface-800/50 text-surface-400 px-2.5 py-1 rounded-full font-mono">{r}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-surface-400 uppercase tracking-wider mb-2 text-[11px]">Body</p>
                <div className="bg-surface-950/50 border border-surface-800/50 rounded-xl p-4 max-h-64 overflow-y-auto">
                  <pre className="text-xs text-surface-400 whitespace-pre-wrap font-mono leading-relaxed">
                    {detail.body.substring(0, 3000)}
                    {detail.body.length > 3000 ? "\n\n..." : ""}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-surface-500">Skill not found</p>
          )}
        </div>
      </div>
    </div>
  );
}
