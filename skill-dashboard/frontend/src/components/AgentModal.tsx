import { useEffect, useState, useCallback } from "react";
import type { AgentDetail } from "../api";
import { fetchAgent } from "../api";

interface Props {
  name: string;
  onClose: () => void;
}

export default function AgentModal({ name, onClose }: Props) {
  const [detail, setDetail] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState<"en" | "es">(() => {
    const saved = localStorage.getItem("agent-modal-lang");
    return (saved === "en" || saved === "es") ? saved : "es";
  });
  const [userPrompt, setUserPrompt] = useState("");
  const [terminalOutput, setTerminalOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    localStorage.setItem("agent-modal-lang", lang);
  }, [lang]);

  const runAgent = useCallback(async () => {
    if (!userPrompt.trim() || isRunning) return;
    setIsRunning(true);
    setTerminalOutput("");
    
    try {
      const res = await fetch(`/api/agents/${name}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: userPrompt })
      });

      if (!res.body) {
        setTerminalOutput("Error: No response body stream available.");
        setIsRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                setTerminalOutput((prev) => prev + data.chunk);
              }
              if (data.done) {
                setIsRunning(false);
              }
            } catch (e) {
              // Ignored
            }
          }
        }
      }
    } catch (err) {
      setTerminalOutput((prev) => prev + `\nError during execution: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRunning(false);
    }
  }, [name, userPrompt, isRunning]);



  useEffect(() => {
    fetchAgent(name).then((res) => {
      setDetail(res.agent);
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

  const copyPrompt = useCallback(() => {
    if (!detail?.prompt) return;
    navigator.clipboard.writeText(detail.prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [detail]);

  const modeClass = detail
    ? detail.mode === "primary"
      ? "bg-violet-500/15 text-violet-400 border-violet-500/20"
      : detail.mode === "subagent"
        ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/20"
        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="animate-scale-in bg-surface-900 border border-surface-700/60 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl shadow-black/50">
        <div className="shrink-0 bg-surface-900/95 backdrop-blur-sm border-b border-surface-800/60 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-surface-100">
            {loading ? "Loading..." : detail?.displayName || detail?.name || name}
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
              Loading agent details...
            </div>
          ) : detail ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border ${modeClass}`}>
                  {detail.mode}
                </span>
                {detail.native && <span className="text-[10px] bg-surface-800/50 text-surface-400 px-2.5 py-1 rounded-full">Built-in</span>}
                {!detail.native && <span className="text-[10px] bg-violet-500/10 text-violet-400 px-2.5 py-1 rounded-full">Custom</span>}
                {detail.hidden && <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full">Hidden</span>}
                <span className="text-[10px] bg-surface-800/50 text-surface-400 px-2.5 py-1 rounded-full">{detail.category}</span>
              </div>

              <div className="bg-gradient-to-br from-brand-600/5 to-brand-900/5 border border-brand-500/15 rounded-xl p-5">
                <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider mb-2">Invocation</p>
                <div className="flex items-center gap-3">
                  <code className="text-xl text-brand-300 font-mono font-bold">{detail.invocation}</code>
                  <span className="text-[10px] text-surface-500 bg-surface-900/50 px-2 py-1 rounded-full">
                    {detail.source === "claude" ? "Claude Code" : "OpenCode"}
                  </span>
                </div>
                <p className="text-xs text-surface-500 mt-2">
                  {detail.source === "claude"
                    ? "Type this command in Claude Code to activate this specialized agent"
                    : "Type this command in OpenCode to invoke this agent"}
                </p>
              </div>

              <div className="bg-surface-950/50 border border-surface-800/50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-1.5">
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
                <p className="text-surface-200 leading-relaxed text-sm">
                  {lang === "es" ? (detail.descriptionEs || detail.description) : (detail.descriptionEn || detail.description || "No description")}
                </p>
              </div>

              {/* Playground / Entorno de Pruebas */}
              <div className="bg-surface-950/60 border border-surface-800/80 rounded-xl p-5 space-y-4 shadow-inner">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider">Playground / Laboratorio</p>
                  <span className="text-[10px] bg-brand-500/10 text-brand-400 px-2.5 py-0.5 rounded-full font-semibold">Interactive Terminal</span>
                </div>
                <p className="text-xs text-surface-400 leading-relaxed">
                  Prueba este agente directamente ingresando una instrucción o pregunta. Se ejecutará asíncronamente en el backend en un subproceso.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Escribe una instrucción para el agente..."
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && userPrompt.trim() && !isRunning) {
                        runAgent();
                      }
                    }}
                    disabled={isRunning}
                    className="flex-1 bg-surface-900 border border-surface-700/60 rounded-xl px-4 py-2 text-sm text-surface-100 placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={runAgent}
                    disabled={isRunning || !userPrompt.trim()}
                    className="bg-brand-500 hover:bg-brand-400 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-all shadow-md shadow-brand-500/10 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-2 cursor-pointer"
                  >
                    {isRunning ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Ejecutando...
                      </>
                    ) : (
                      "Ejecutar"
                    )}
                  </button>
                </div>
                
                {(terminalOutput || isRunning) && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-semibold text-surface-500 uppercase tracking-wider">Terminal Output</p>
                      <button
                        onClick={() => setTerminalOutput("")}
                        className="text-[9px] text-surface-500 hover:text-surface-300 font-semibold uppercase tracking-wider transition-colors"
                      >
                        Limpiar
                      </button>
                    </div>
                    <pre className="text-xs text-emerald-400 bg-surface-950 rounded-xl p-4 border border-surface-800/80 whitespace-pre-wrap font-mono leading-relaxed max-h-60 overflow-y-auto shadow-inner">
                      {terminalOutput}
                      {isRunning && <span className="animate-pulse">_</span>}
                    </pre>
                  </div>
                )}
              </div>

              {detail.useCases && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-emerald-950/20 border border-emerald-500/15 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="text-emerald-400 text-sm">✓</span> Úsame cuando...
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.useCases.use.map((u) => (
                        <span key={u} className="text-[11px] bg-emerald-500/10 text-emerald-400/90 px-2.5 py-1 rounded-lg">{u}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-red-950/20 border border-red-500/15 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="text-red-400 text-sm">✕</span> No me uses para...
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.useCases.avoid.map((a) => (
                        <span key={a} className="text-[11px] bg-red-500/10 text-red-400/90 px-2.5 py-1 rounded-lg">{a}</span>
                      ))}
                    </div>
                  </div>
                  <div className="sm:col-span-2 bg-surface-950/30 border border-surface-700/30 rounded-xl p-3 flex items-center gap-3">
                    <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider shrink-0">Formatos:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.useCases.formats.map((f) => (
                        <code key={f} className="text-[11px] bg-surface-800/50 text-surface-400 px-2.5 py-1 rounded-lg font-mono">{f}</code>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {detail.model && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-950/50 border border-surface-800/50 rounded-xl p-4">
                    <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider mb-1.5">Model</p>
                    <code className="text-xs text-surface-300 font-mono">
                      {typeof detail.model === "string" ? detail.model : `${detail.model.providerID}/${detail.model.modelID}`}
                    </code>
                  </div>
                  <div className="bg-surface-950/50 border border-surface-800/50 rounded-xl p-4">
                    <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider mb-1.5">Source</p>
                    <p className="text-xs text-surface-300 capitalize">{detail.source}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {detail.variant && (
                  <div className="bg-surface-950/50 border border-surface-800/50 rounded-xl p-4">
                    <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider mb-1.5">Variant</p>
                    <code className="text-xs text-surface-300 font-mono">{detail.variant}</code>
                  </div>
                )}
                {detail.temperature !== null && (
                  <div className="bg-surface-950/50 border border-surface-800/50 rounded-xl p-4">
                    <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider mb-1.5">Temperature</p>
                    <p className="text-sm text-surface-300">{detail.temperature}</p>
                  </div>
                )}
                {detail.topP !== null && (
                  <div className="bg-surface-950/50 border border-surface-800/50 rounded-xl p-4">
                    <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider mb-1.5">Top P</p>
                    <p className="text-sm text-surface-300">{detail.topP}</p>
                  </div>
                )}
                {detail.steps !== null && (
                  <div className="bg-surface-950/50 border border-surface-800/50 rounded-xl p-4">
                    <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider mb-1.5">Max Steps</p>
                    <p className="text-sm text-surface-300">{detail.steps}</p>
                  </div>
                )}
              </div>

              {detail.prompt && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider">System Prompt</p>
                    <button
                      onClick={copyPrompt}
                      className="text-[10px] bg-surface-800/50 hover:bg-surface-700/50 text-surface-400 hover:text-surface-200 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium"
                    >
                      {copied ? "Copied!" : "Copy prompt"}
                    </button>
                  </div>
                  <p className="text-xs text-surface-500 mb-3 leading-relaxed">
                    This is the full agent definition. Paste it into any AI as a system prompt to get this agent's specialized behavior, or use it to create a custom agent in your <code className="text-surface-400 bg-surface-800/50 px-1 rounded">opencode.jsonc</code>.
                  </p>
                  <div className="bg-surface-950/50 border border-surface-800/50 rounded-xl p-4 max-h-72 overflow-y-auto">
                    <pre className="text-xs text-surface-400 whitespace-pre-wrap font-mono leading-relaxed">
                      {detail.prompt}
                    </pre>
                  </div>
                </div>
              )}

              {detail.tools && Object.keys(detail.tools).length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider mb-2">Tools</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(detail.tools).map(([tool, enabled]) => (
                      <span key={tool} className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
                        enabled
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}>
                        {tool}: {enabled ? "on" : "off"}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {detail.permission && (
                <div>
                  <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider mb-2">Permissions</p>
                  <div className="bg-surface-950/50 border border-surface-800/50 rounded-xl p-4 max-h-40 overflow-y-auto">
                    <pre className="text-xs text-surface-400 whitespace-pre-wrap font-mono">
                      {JSON.stringify(detail.permission, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-surface-500">Agent not found</p>
          )}
        </div>
      </div>
    </div>
  );
}
