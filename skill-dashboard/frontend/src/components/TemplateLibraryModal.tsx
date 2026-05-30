import { useState } from "react";
import { REMOTION_TEMPLATES } from "./templates";
import type { RemotionTemplate } from "./templates";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (code: string) => void;
}

export default function TemplateLibraryModal({ isOpen, onClose, onSelectTemplate }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [activeDifficulty, setActiveDifficulty] = useState<string>("Todos");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  // Filter templates
  const filteredTemplates = REMOTION_TEMPLATES.filter((tmpl) => {
    const matchesSearch =
      tmpl.name.toLowerCase().includes(search.toLowerCase()) ||
      tmpl.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "Todos" || tmpl.category === activeCategory;
    const matchesDifficulty = activeDifficulty === "Todos" || tmpl.difficulty === activeDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const handleCopy = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Fácil":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
      case "Intermedio":
        return "bg-amber-500/10 text-amber-400 border-amber-500/25";
      case "Avanzado":
        return "bg-rose-500/10 text-rose-400 border-rose-500/25";
      default:
        return "bg-surface-800 text-surface-400 border-surface-700";
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Básico":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Transiciones":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      case "Texto":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "Mapas":
        return "bg-violet-500/10 text-violet-400 border-violet-500/20";
      case "Gráficos":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Audio y Efectos":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      default:
        return "bg-surface-800 text-surface-400 border-surface-700";
    }
  };

  const categories = ["Todos", "Básico", "Texto", "Mapas", "Gráficos", "Audio y Efectos", "Transiciones"];
  const difficulties = ["Todos", "Fácil", "Intermedio", "Avanzado"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      {/* Modal Card */}
      <div className="relative w-full max-w-6xl max-h-[85vh] flex flex-col bg-surface-950 border border-surface-800/80 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-surface-800/40">
          <div>
            <h2 className="text-xl font-black text-surface-50 flex items-center gap-2">
              <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Biblioteca de Ejemplos y Plantillas
            </h2>
            <p className="text-xs text-surface-400 mt-1">
              Explora una selección exclusiva de códigos listos para copiar, pegar y renderizar en Remotion.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-900 border border-transparent hover:border-surface-800 transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters Panel */}
        <div className="p-6 bg-surface-900/30 border-b border-surface-800/40 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar plantilla..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-950 border border-surface-800 focus:border-brand-500/50 rounded-xl text-xs text-surface-200 placeholder-surface-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? "bg-brand-600 text-white"
                    : "bg-surface-900 border border-surface-800/50 text-surface-400 hover:text-surface-250 hover:border-surface-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Difficulty Dropdown */}
          <div className="flex items-center gap-2 self-stretch md:self-auto">
            <span className="text-[10px] text-surface-550 font-bold uppercase tracking-wider">Dificultad</span>
            <select
              value={activeDifficulty}
              onChange={(e) => setActiveDifficulty(e.target.value)}
              className="bg-surface-950 border border-surface-800 text-xs text-surface-300 font-semibold px-2.5 py-1.5 rounded-xl focus:outline-none cursor-pointer hover:border-surface-700 transition-colors"
            >
              {difficulties.map((diff) => (
                <option key={diff} value={diff}>
                  {diff}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface-975/30">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-12 h-12 text-surface-650 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="text-sm font-semibold text-surface-300">No se encontraron plantillas</h4>
              <p className="text-xs text-surface-500 mt-1">Prueba a cambiar los filtros o a realizar otra búsqueda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTemplates.map((tmpl, idx) => {
                const isCopied = copiedIndex === idx;
                const isExpanded = expandedIndex === idx;

                return (
                  <div
                    key={idx}
                    className="flex flex-col rounded-xl border border-surface-800 bg-surface-950/60 hover:bg-surface-900/35 hover:border-surface-700/60 transition-all duration-200 overflow-hidden group shadow-lg"
                  >
                    {/* Card Header Info */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(tmpl.category)}`}>
                            {tmpl.category}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getDifficultyColor(tmpl.difficulty)}`}>
                            {tmpl.difficulty}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-surface-100 group-hover:text-brand-400 transition-colors">
                          {tmpl.name}
                        </h3>
                        <p className="text-xs text-surface-450 mt-1.5 leading-relaxed">
                          {tmpl.description}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-surface-800/20">
                        <button
                          onClick={() => {
                            onSelectTemplate(tmpl.code);
                            onClose();
                          }}
                          className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold py-2 rounded-lg text-[10px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                          </svg>
                          Cargar en Editor
                        </button>
                        <button
                          onClick={() => handleCopy(tmpl.code, idx)}
                          className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                            isCopied
                              ? "bg-green-500/10 text-green-400 border-green-500/25"
                              : "bg-surface-900 text-surface-300 border-surface-800 hover:text-surface-100 hover:border-surface-700"
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <svg className="w-3.5 h-3.5 animate-scale-up" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              ¡Copiado!
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-4 0h4" />
                              </svg>
                              Copiar
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                          className={`p-2 rounded-lg border text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center ${
                            isExpanded
                              ? "bg-surface-800 text-surface-100 border-surface-700"
                              : "bg-surface-900/50 text-surface-450 border-surface-800 hover:text-surface-300 hover:border-surface-750"
                          }`}
                          title="Mostrar Código"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Expandable Code Viewer */}
                    {isExpanded && (
                      <div className="border-t border-surface-800 bg-surface-975 p-4 relative animate-slide-down">
                        <div className="absolute top-2 right-4 flex gap-1.5 z-10">
                          <span className="text-[8px] bg-surface-900 border border-surface-800 text-surface-500 font-semibold px-2 py-0.5 rounded uppercase">tsx</span>
                        </div>
                        <pre className="text-[10px] font-mono text-violet-300 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                          {tmpl.code}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-800/40 bg-surface-900/20 text-center text-[10px] text-surface-500 flex justify-between items-center px-6">
          <span>Total: {filteredTemplates.length} plantillas disponibles</span>
          <span>Tip: Puedes arrastrar recursos locales y agregarlos a tu plantilla usando <code>staticFile("nombre")</code></span>
        </div>

      </div>
    </div>
  );
}
