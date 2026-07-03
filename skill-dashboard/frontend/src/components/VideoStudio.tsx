import { useState, useEffect, useRef } from "react";

interface Props {
  base: string;
}

interface AuthStatus {
  loggedIn: boolean;
  email?: string;
  name?: string;
}

const DEFAULT_CODE = `import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';

export default function Main() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animación suave de entrada usando resortes (springs)
  const scale = spring({
    frame,
    fps,
    config: { damping: 12 }
  });

  return (
    <AbsoluteFill style={{
      backgroundColor: '#05070b',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Círculo de brillo violeta en el fondo */}
      <div style={{
        position: 'absolute',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.2) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(40px)'
      }} />

      {/* Tarjeta con efecto de cristal (glassmorphic card) */}
      <div style={{
        transform: \`scale(\${scale})\`,
        textAlign: 'center',
        padding: 40,
        borderRadius: 24,
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
      }}>
        <h1 style={{
          fontSize: 56,
          fontWeight: 800,
          margin: 0,
          background: 'linear-gradient(to right, #8b5cf6, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          SkillNexus
        </h1>
        <p style={{
          color: '#94a3b8',
          fontSize: 20,
          marginTop: 10,
          marginBottom: 0
        }}>
          Video Renderizado con Remotion
        </p>
      </div>
    </AbsoluteFill>
  );
}`;

import { REMOTION_TEMPLATES } from "./templates";
import TemplateLibraryModal from "./TemplateLibraryModal";
import LivePreview from "./LivePreview";

// Presets de formato/plataforma para acelerar la configuración de dimensiones.
const FORMAT_PRESETS: { label: string; icon: string; w: number; h: number }[] = [
  { label: "Horizontal 16:9", icon: "🖥️", w: 1920, h: 1080 },
  { label: "Vertical 9:16", icon: "📱", w: 1080, h: 1920 },
  { label: "Cuadrado 1:1", icon: "🟩", w: 1080, h: 1080 },
  { label: "Story 9:16", icon: "📸", w: 1080, h: 1920 },
  { label: "HD 720p", icon: "🎬", w: 1280, h: 720 },
  { label: "4K", icon: "✨", w: 3840, h: 2160 },
];

// Persistencia del proyecto (código + ajustes) para no perder el trabajo al recargar.
const STORAGE_KEY = "skillnexus-video-project";
function loadProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Helper to process logs, strip ANSI escape codes, and collapse progress updates in-place
const getProcessedLogs = (rawLogs: string[]): string[] => {
  const stripAnsi = (str: string): string => {
    return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
  };

  const fullText = rawLogs.join("");
  const lines = fullText.split(/\r?\n/);
  const processed: string[] = [];

  let lastRenderedIdx = -1;
  let lastEncodedIdx = -1;

  for (const line of lines) {
    let cleanLine = stripAnsi(line).trim();
    if (!cleanLine) continue;

    // Handle carriage returns (\r) in-place
    if (cleanLine.includes("\r")) {
      const parts = cleanLine.split("\r");
      cleanLine = parts.filter(p => p.trim() !== "").pop() || "";
      cleanLine = cleanLine.trim();
    }

    if (!cleanLine) continue;

    if (/^Rendered \d+\/\d+/.test(cleanLine)) {
      if (lastRenderedIdx !== -1) {
        processed[lastRenderedIdx] = cleanLine;
      } else {
        lastRenderedIdx = processed.length;
        processed.push(cleanLine);
      }
    } else if (/^Encoded \d+\/\d+/.test(cleanLine)) {
      if (lastEncodedIdx !== -1) {
        processed[lastEncodedIdx] = cleanLine;
      } else {
        lastEncodedIdx = processed.length;
        processed.push(cleanLine);
      }
    } else {
      processed.push(cleanLine);
      lastRenderedIdx = -1;
      lastEncodedIdx = -1;
    }
  }
  return processed;
};

export default function VideoStudio({ base }: Props) {
  const saved = loadProject();
  const [code, setCode] = useState<string>(saved?.code ?? DEFAULT_CODE);
  const [mode, setMode] = useState<"cloud" | "local">("local");
  const [width, setWidth] = useState<number>(saved?.width ?? 1920);
  const [height, setHeight] = useState<number>(saved?.height ?? 1080);
  const [fps, setFps] = useState<number>(saved?.fps ?? 30);
  const [duration, setDuration] = useState<number>(saved?.duration ?? 3);
  const [previewMode, setPreviewMode] = useState<"live" | "rendered">("live");
  const [outputFormat, setOutputFormat] = useState<"mp4" | "webm" | "gif">(saved?.outputFormat ?? "mp4");
  // IA local con Ollama
  const [ollamaAvailable, setOllamaAvailable] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<{ name: string; size: number }[]>([]);
  const [ollamaModel, setOllamaModel] = useState<string>("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [isRendering, setIsRendering] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [assets, setAssets] = useState<{ name: string; size: number; createdAt: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const logEndRef = useRef<HTMLDivElement>(null);
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Persistir el proyecto (código + ajustes) con un pequeño debounce.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, width, height, fps, duration, outputFormat }));
      } catch {
        // ignorar errores de cuota de localStorage
      }
    }, 500);
    return () => clearTimeout(t);
  }, [code, width, height, fps, duration, outputFormat]);

  // Check auth status
  const checkAuth = async () => {
    try {
      const res = await fetch(`${base}/remotion/status`);
      if (res.ok) {
        const data = await res.json();
        setAuthStatus(data);
      }
    } catch (e) {
      console.error("Error checking remotion status:", e);
    }
  };

  // Fetch local assets list
  const fetchAssets = async () => {
    try {
      const res = await fetch(`${base}/remotion/assets`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
      }
    } catch (e) {
      console.error("Error fetching assets:", e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = reader.result as string;
        const base64Data = result.split(",")[1];
        
        const res = await fetch(`${base}/remotion/assets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, base64Data })
        });
        
        if (res.ok) {
          await fetchAssets();
        } else {
          const errData = await res.json();
          alert("Error al subir recurso: " + (errData.error || "Error desconocido"));
        }
      } catch (e) {
        console.error("Upload error:", e);
        alert("Error al subir archivo");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAsset = async (filename: string) => {
    if (!confirm(`¿Estás seguro de eliminar el recurso "${filename}"?`)) return;
    try {
      const res = await fetch(`${base}/remotion/assets/${encodeURIComponent(filename)}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchAssets();
      } else {
        alert("Error al eliminar recurso");
      }
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  // Construye el snippet JSX apropiado según el tipo de archivo y qué componentes de
  // remotion necesita importar.
  const buildSnippet = (filename: string): { snippet: string; needs: string[] } => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
      return { snippet: `<Img src={staticFile("${filename}")} style={{ width: 300 }} />`, needs: ["Img", "staticFile"] };
    }
    if (["mp3", "wav", "ogg"].includes(ext)) {
      return { snippet: `<Audio src={staticFile("${filename}")} />`, needs: ["Audio", "staticFile"] };
    }
    if (["mp4", "webm", "mkv"].includes(ext)) {
      return { snippet: `<Video src={staticFile("${filename}")} style={{ width: '100%' }} />`, needs: ["Video", "staticFile"] };
    }
    return { snippet: `staticFile("${filename}")`, needs: ["staticFile"] };
  };

  // Añade los nombres que falten al import de 'remotion' (o crea el import si no existe).
  const ensureRemotionImport = (src: string, needs: string[]): string => {
    const importRe = /import\s*\{([^}]*)\}\s*from\s*['"]remotion['"];?/;
    const m = src.match(importRe);
    if (m) {
      const existing = m[1].split(",").map((s) => s.trim()).filter(Boolean);
      const merged = Array.from(new Set([...existing, ...needs]));
      return src.replace(importRe, `import { ${merged.join(", ")} } from 'remotion';`);
    }
    return `import { ${needs.join(", ")} } from 'remotion';\n` + src;
  };

  const copySnippet = (filename: string) => {
    const { snippet } = buildSnippet(filename);
    navigator.clipboard.writeText(snippet);
    setCopiedNotification(filename);
    setTimeout(() => setCopiedNotification(null), 2000);
  };

  // Inserta el asset en el LUGAR CORRECTO automáticamente: como último hijo del elemento
  // raíz del JSX (justo antes de su etiqueta de cierre), y asegura el import de remotion.
  // Así el usuario no tiene que saber dónde colocarlo ni posicionar el cursor.
  const insertSnippet = (filename: string) => {
    const { snippet, needs } = buildSnippet(filename);
    let next = ensureRemotionImport(code, needs);

    // En JSX bien formado, la etiqueta de cierre del elemento raíz es la ÚLTIMA del archivo.
    // Insertamos el snippet en su propia línea justo antes de ella, con la indentación adecuada.
    const matches = [...next.matchAll(/([ \t]*)<\/[A-Za-z][\w.]*>/g)];
    if (matches.length > 0) {
      const last = matches[matches.length - 1];
      const at = last.index ?? next.length;
      const indent = last[1] || "      ";
      const insertion = `${indent}  ${snippet}\n`;
      next = next.slice(0, at) + insertion + next.slice(at);
    } else {
      // Sin JSX de cierre detectable: lo dejamos comentado al final para que el usuario lo ubique.
      next = `${next}\n// Pega esto dentro del return: ${snippet}`;
    }

    setCode(next);
    setPreviewMode("live");
    setCopiedNotification(filename);
    setTimeout(() => setCopiedNotification(null), 2000);
    requestAnimationFrame(() => codeEditorRef.current?.focus());
  };

  // Genera automáticamente un video de SECUENCIA a partir de las imágenes subidas:
  // cada imagen aparece en orden con crossfade (fundido cruzado) + Ken Burns (zoom suave),
  // más fundido de entrada y salida (inicio y final limpios). 2, 5 o las que quieras.
  const generateSlideshow = () => {
    const imgs = assets
      .filter((a) => /\.(png|jpe?g|gif|webp|svg)$/i.test(a.name))
      .map((a) => a.name);
    if (imgs.length === 0) {
      alert("Sube al menos una imagen en 'Recursos Locales del Video' antes de crear la secuencia.");
      return;
    }
    // ~2.5s por imagen; ajusta la duración total automáticamente.
    setDuration(Math.max(2, Math.round(imgs.length * 2.5)));
    const list = imgs.map((n) => JSON.stringify(n)).join(", ");
    // Nota: el código generado usa concatenación de strings (sin backticks) a propósito.
    const generated =
      "import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';\n\n" +
      "// Secuencia automática de imágenes: crossfade + Ken Burns (zoom suave), con inicio y final.\n" +
      "const IMAGES = [" + list + "];\n\n" +
      "export default function Main() {\n" +
      "  const frame = useCurrentFrame();\n" +
      "  const { durationInFrames } = useVideoConfig();\n" +
      "  const per = durationInFrames / IMAGES.length;\n" +
      "  const fade = Math.min(18, per * 0.35);\n" +
      "  return (\n" +
      "    <AbsoluteFill style={{ backgroundColor: 'black' }}>\n" +
      "      {IMAGES.map((src, i) => {\n" +
      "        const start = i * per;\n" +
      "        const end = start + per;\n" +
      "        const opacity = interpolate(frame, [start - fade, start, end - fade, end], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });\n" +
      "        if (opacity <= 0) return null;\n" +
      "        const scale = interpolate(frame, [start, end], [1.05, 1.2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });\n" +
      "        return (\n" +
      "          <AbsoluteFill key={i} style={{ opacity }}>\n" +
      "            <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(' + scale + ')' }} />\n" +
      "          </AbsoluteFill>\n" +
      "        );\n" +
      "      })}\n" +
      "      <AbsoluteFill style={{ backgroundColor: 'black', pointerEvents: 'none', opacity: interpolate(frame, [0, 15, durationInFrames - 15, durationInFrames], [1, 0, 0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }} />\n" +
      "    </AbsoluteFill>\n" +
      "  );\n" +
      "}\n";
    setCode(generated);
    setPreviewMode("live");
  };

  // Detectar modelos de Ollama disponibles al montar.
  const loadOllamaModels = async () => {
    try {
      const res = await fetch(`${base}/ollama/models`);
      const data = await res.json();
      setOllamaAvailable(!!data.available);
      // El backend devuelve [{name, size}] ordenados de menor a mayor.
      const models: { name: string; size: number }[] = (data.models || []).map((m: unknown) =>
        typeof m === "string" ? { name: m, size: 0 } : (m as { name: string; size: number })
      );
      setOllamaModels(models);
      if (models.length > 0) {
        // Por defecto elegimos el más pequeño (primero tras el orden ascendente) para que quepa en RAM.
        setOllamaModel((prev) => prev || models[0].name);
      }
    } catch {
      setOllamaAvailable(false);
    }
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim() || !ollamaModel || aiGenerating) return;
    setAiGenerating(true);
    setAiError("");
    try {
      const res = await fetch(`${base}/ollama/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: ollamaModel, prompt: aiPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fallo al generar");
      if (data.code) {
        setCode(data.code);
        setPreviewMode("live");
      }
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Fallo al generar");
    } finally {
      setAiGenerating(false);
    }
  };

  useEffect(() => {
    checkAuth();
    fetchAssets();
    loadOllamaModels();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setIsAuthenticating(true);
    try {
      const res = await fetch(`${base}/remotion/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: apiKey })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await checkAuth();
        setApiKey("");
      } else {
        alert("Error de autenticación: " + (data.error || "Fallo en el servidor"));
      }
    } catch (e) {
      alert("Error al conectar: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRender = async () => {
    setIsRendering(true);
    setLogs([`Iniciando renderizado en modo ${mode === "cloud" ? "Nube (inference.sh)" : "Local (Tu PC)"}...\n`]);
    setVideoUrl(null);

    try {
      const response = await fetch(`${base}/remotion/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, width, height, fps, duration_seconds: duration, mode, format: outputFormat })
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.chunk) {
                setLogs((prev) => [...prev, data.chunk]);
              }
              if (data.done) {
                setIsRendering(false);
                if (data.code === 0) {
                  if (data.localVideo) {
                    setVideoUrl(`${base}/remotion/video?format=${data.format || outputFormat}&t=${Date.now()}`);
                    setPreviewMode("rendered");
                    setLogs((prev) => [...prev, `\n✓ ¡Renderizado completado con éxito! Cargando video local...\n`]);
                  } else if (data.videoUrl) {
                    setVideoUrl(data.videoUrl);
                    setPreviewMode("rendered");
                    setLogs((prev) => [...prev, `\n✓ ¡Renderizado completado con éxito!\nURL del Video: ${data.videoUrl}\n`]);
                  }
                } else {
                  setLogs((prev) => [...prev, `\n✗ El proceso de renderizado falló (Código de salida: ${data.code})\n`]);
                }
              }
            } catch (e) {
              // Ignore parse errors on SSE keep-alives or comments
            }
          }
        }
      }
    } catch (err) {
      setLogs((prev) => [...prev, `\n[ERROR] Ocurrió un error en el renderizado: ${err instanceof Error ? err.message : String(err)}\n`]);
      setIsRendering(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade-in">
      {/* Columna Izquierda: Configuración y Editor */}
      <div className="xl:col-span-7 flex flex-col gap-6">
        <div className="bg-surface-950/80 backdrop-blur-sm rounded-2xl border border-surface-800/60 p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-surface-800/40 pb-4">
            <div>
              <h3 className="text-lg font-bold text-surface-100 flex items-center gap-2">
                <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Editor de Animación Remotion
              </h3>
              <p className="text-xs text-surface-400">Modifica el código de tu componente React e inicializa el renderizado.</p>
            </div>
            {/* Selector de Modo */}
            <div className="flex gap-1 bg-surface-900 border border-surface-800 rounded-xl p-1">
              <button
                onClick={() => setMode("local")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  mode === "local" ? "bg-brand-600 text-white" : "text-surface-400 hover:text-surface-200"
                }`}
              >
                Local (Tu PC)
              </button>
              <button
                onClick={() => setMode("cloud")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  mode === "cloud" ? "bg-brand-600 text-white" : "text-surface-400 hover:text-surface-200"
                }`}
              >
                Nube (inference.sh)
              </button>
            </div>
          </div>

          {/* Advertencias y Autenticación del Modo Nube */}
          {mode === "cloud" && (
            <div className="bg-brand-500/5 border border-brand-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="text-xs text-brand-300 leading-relaxed">
                  <strong>Servidor de Renderizado en la Nube:</strong> Usa la API pública de <code>inference.sh</code>.
                  {authStatus?.loggedIn ? (
                    <div className="mt-1 text-surface-300">
                      Conectado como: <span className="font-semibold text-brand-400">{authStatus.email}</span>
                    </div>
                  ) : (
                    <div className="mt-1 text-rose-400">
                      Requiere autenticación. Por favor introduce tu API Key a continuación.
                    </div>
                  )}
                </div>
              </div>

              {!authStatus?.loggedIn && (
                <form onSubmit={handleLogin} className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Introduce tu API Key de inference.sh..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1 bg-surface-900 border border-surface-700/50 focus:border-brand-500/50 rounded-lg px-3 py-2 text-xs text-surface-200 placeholder-surface-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap"
                  >
                    {isAuthenticating ? "Conectando..." : "Conectar"}
                  </button>
                </form>
              )}
            </div>
          )}

          {mode === "local" && (
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 text-xs text-surface-400 leading-relaxed">
              <strong>Renderizado Local:</strong> Se compilará usando tu CPU/GPU local. La primera vez se instalarán las dependencias del motor de Remotion en segundo plano (toma unos segundos). Es 100% gratuito e ilimitado.
            </div>
          )}

          {/* Presets de formato/plataforma */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-surface-400">Formato rápido</label>
            <div className="flex flex-wrap gap-2">
              {FORMAT_PRESETS.map((p) => {
                const active = width === p.w && height === p.h;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => { setWidth(p.w); setHeight(p.h); }}
                    className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      active
                        ? "bg-brand-600 text-white border-brand-500"
                        : "bg-surface-900 text-surface-300 border-surface-800 hover:border-brand-500/50"
                    }`}
                    title={`${p.w}×${p.h}`}
                  >
                    {p.icon} {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Formulario de Ajustes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-surface-400">Duración (seg.)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={duration}
                onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
                className="bg-surface-900 border border-surface-700/50 focus:border-brand-500/50 rounded-xl px-3 py-2 text-sm text-surface-200 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-surface-400">Frames por Segundo (FPS)</label>
              <select
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                className="bg-surface-900 border border-surface-700/50 focus:border-brand-500/50 rounded-xl px-3 py-2 text-sm text-surface-200 focus:outline-none cursor-pointer"
              >
                <option value={24}>24 FPS (cine)</option>
                <option value={25}>25 FPS (PAL)</option>
                <option value={30}>30 FPS</option>
                <option value={50}>50 FPS</option>
                <option value={60}>60 FPS</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-surface-400">Ancho (px)</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Math.max(100, Number(e.target.value)))}
                className="bg-surface-900 border border-surface-700/50 focus:border-brand-500/50 rounded-xl px-3 py-2 text-sm text-surface-200 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-surface-400">Alto (px)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Math.max(100, Number(e.target.value)))}
                className="bg-surface-900 border border-surface-700/50 focus:border-brand-500/50 rounded-xl px-3 py-2 text-sm text-surface-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Generar con IA (Ollama local) */}
          <div className="bg-gradient-to-br from-brand-500/10 to-fuchsia-500/5 border border-brand-500/25 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-brand-300 flex items-center gap-1.5">
                ✨ Generar con IA (Ollama local)
              </p>
              {ollamaAvailable ? (
                <select
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  className="bg-surface-900 border border-surface-700/50 rounded-lg px-2 py-1 text-[11px] text-surface-200 focus:outline-none cursor-pointer max-w-[180px]"
                  title="Modelo de Ollama"
                >
                  {ollamaModels.map((m) => {
                    const gb = m.size ? ` (${(m.size / 1e9).toFixed(1)} GB)` : "";
                    return <option key={m.name} value={m.name}>{m.name}{gb}</option>;
                  })}
                </select>
              ) : (
                <button
                  onClick={loadOllamaModels}
                  className="text-[10px] text-surface-400 hover:text-brand-300 underline cursor-pointer"
                  title="Reintentar detección de Ollama"
                >
                  Ollama no detectado — reintentar
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") generateWithAI(); }}
                disabled={!ollamaAvailable || aiGenerating}
                placeholder={ollamaAvailable ? "Describe tu video: ej. 'intro con mi logo y texto neón violeta'" : "Inicia Ollama en tu PC para usar esto"}
                className="flex-1 bg-surface-900 border border-surface-700/50 focus:border-brand-500/50 rounded-lg px-3 py-2 text-xs text-surface-200 placeholder-surface-500 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={generateWithAI}
                disabled={!ollamaAvailable || aiGenerating || !aiPrompt.trim()}
                className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
              >
                {aiGenerating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generando…
                  </>
                ) : "Generar código"}
              </button>
            </div>
            {aiError && <p className="text-[11px] text-rose-400">{aiError}</p>}
            <p className="text-[10px] text-surface-500">
              Genera <strong>videos animados</strong> (Remotion), no páginas web. Usa tus modelos locales de Ollama; elige uno que quepa en tu RAM (los de menos GB son más rápidos). El resultado reemplaza el código del editor.
            </p>
          </div>

          {/* Formato de salida */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-surface-400">Formato de salida</label>
            <div className="flex gap-1 bg-surface-900 border border-surface-800 rounded-xl p-1">
              {(["mp4", "webm", "gif"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setOutputFormat(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-all cursor-pointer ${
                    outputFormat === f ? "bg-brand-600 text-white" : "text-surface-400 hover:text-surface-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-surface-500">
              {outputFormat === "gif" ? "GIF animado (sin audio)" : outputFormat === "webm" ? "WebM (VP8/VP9)" : "MP4 (H.264)"}
            </span>
          </div>

          {/* Editor de código */}
          <div className="flex flex-col gap-1.5 flex-1 min-h-[350px]">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-semibold text-surface-400">Código React Component (TSX)</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLibraryOpen(true)}
                  className="flex items-center gap-1 bg-brand-600/15 hover:bg-brand-600/25 border border-brand-500/35 text-brand-350 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Explorar Biblioteca de Plantillas y Ejemplos"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  💡 Biblioteca de Plantillas
                </button>
                <select
                  onChange={(e) => {
                    const selectedIdx = Number(e.target.value);
                    if (selectedIdx >= 0) {
                      setCode(REMOTION_TEMPLATES[selectedIdx].code);
                    }
                  }}
                  className="bg-surface-900 border border-surface-800 text-[10px] text-brand-300 font-semibold px-2 py-1 rounded-lg focus:outline-none cursor-pointer hover:border-brand-500/50 transition-colors"
                  defaultValue="-1"
                >
                  <option value="-1" disabled>⚡ Ejemplos rápidos...</option>
                  {REMOTION_TEMPLATES.map((tmpl, idx) => (
                    <option key={idx} value={idx}>
                      {tmpl.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="relative flex-1 rounded-xl border border-surface-700/50 overflow-hidden bg-surface-975 min-h-[350px]">
              <textarea
                ref={codeEditorRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                className="w-full h-full min-h-[350px] p-4 bg-transparent text-[13px] leading-relaxed font-mono text-slate-100 placeholder-surface-600 focus:outline-none resize-none"
                style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", tabSize: 2 }}
              />
            </div>
          </div>

          {/* Botón de Renderizado */}
          <button
            onClick={handleRender}
            disabled={isRendering || (mode === "cloud" && !authStatus?.loggedIn)}
            className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-600/25 cursor-pointer flex items-center justify-center gap-2"
          >
            {isRendering ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Renderizando video en progreso...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Iniciar Renderizado de Video
              </>
            )}
          </button>
        </div>
      </div>

      {/* Columna Derecha: Previsualización y Consola de logs */}
      <div className="xl:col-span-5 flex flex-col gap-6">
        {/* Previsualización del Video */}
        <div className="bg-surface-950/80 backdrop-blur-sm rounded-2xl border border-surface-800/60 p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-surface-800/40 pb-4">
            <h3 className="text-lg font-bold text-surface-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              Previsualización
            </h3>
            <div className="flex gap-1 bg-surface-900 border border-surface-800 rounded-xl p-1">
              <button
                onClick={() => setPreviewMode("live")}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${previewMode === "live" ? "bg-brand-600 text-white" : "text-surface-400 hover:text-surface-200"}`}
                title="Previsualización en tiempo real (sin renderizar)"
              >
                ⚡ En vivo
              </button>
              <button
                onClick={() => setPreviewMode("rendered")}
                disabled={!videoUrl}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${previewMode === "rendered" ? "bg-brand-600 text-white" : "text-surface-400 hover:text-surface-200"}`}
                title="Video renderizado (MP4/WebM/GIF)"
              >
                🎬 Renderizado
              </button>
            </div>
          </div>

          <div className="aspect-video bg-surface-975 rounded-xl border border-surface-800 overflow-hidden flex items-center justify-center relative">
            {previewMode === "live" ? (
              <LivePreview code={code} width={width} height={height} fps={fps} duration={duration} assetsBaseUrl={`${base}/remotion/assets/`} />
            ) : videoUrl ? (
              outputFormat === "gif" ? (
                <img src={videoUrl} alt="GIF renderizado" className="w-full h-full object-contain" />
              ) : (
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full object-contain"
                  autoPlay
                  loop
                />
              )
            ) : (
              <div className="text-center p-6 space-y-3">
                {isRendering ? (
                  <>
                    <div className="relative mx-auto w-12 h-12 mb-3">
                      <div className="absolute inset-0 border-2 border-brand-500/20 rounded-full" />
                      <div className="absolute inset-0 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-sm font-semibold text-brand-300 animate-pulse">Renderizando frames...</p>
                    <p className="text-xs text-surface-500">Mira el progreso abajo en la terminal de logs.</p>
                  </>
                ) : (
                  <>
                    <svg className="w-12 h-12 text-surface-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm font-medium text-surface-400">Sin video renderizado</p>
                    <p className="text-xs text-surface-500">Usa "En vivo" para ver mientras editas, o renderiza para exportar.</p>
                  </>
                )}
              </div>
            )}
          </div>

          {videoUrl && (
            <div className="flex gap-3">
              <a
                href={videoUrl}
                download={`remotion-video.${outputFormat}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-surface-800 hover:bg-surface-700 text-surface-200 border border-surface-700/60 font-semibold py-2.5 rounded-xl transition-all cursor-pointer text-center text-xs flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar {outputFormat.toUpperCase()}
              </a>
            </div>
          )}
        </div>

        {/* Recursos Locales del Video */}
        <div className="bg-surface-950/80 backdrop-blur-sm rounded-2xl border border-surface-800/60 p-6 flex flex-col gap-4">
          <h3 className="text-lg font-bold text-surface-100 flex items-center gap-2 border-b border-surface-800/40 pb-4">
            <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Recursos Locales del Video
          </h3>
          
          <p className="text-xs text-surface-400 leading-relaxed">
            Sube imágenes, audios o videos y pulsa <strong className="text-brand-300">+ Insertar</strong> para agregarlos directamente al editor (con su import). Funcionan en la <strong>preview en vivo</strong> y en el <strong>render</strong> vía <code>staticFile("nombre")</code>.
          </p>

          {/* Área de Subida de Archivos */}
          <div className="relative border border-dashed border-surface-700/60 hover:border-brand-500/50 rounded-xl p-4 transition-all duration-200 text-center cursor-pointer group bg-surface-900/35">
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept="image/*,audio/*,video/*"
            />
            <div className="flex flex-col items-center gap-1.5 py-1">
              <svg className="w-8 h-8 text-surface-500 group-hover:text-brand-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-xs font-semibold text-surface-300 group-hover:text-surface-100 transition-colors">
                {isUploading ? "Subiendo archivo..." : "Selecciona o arrastra un archivo"}
              </span>
              <span className="text-[10px] text-surface-500">
                Imágenes, música (MP3) o videos (MP4) de hasta 50MB
              </span>
            </div>
          </div>

          {/* Crear video de secuencia con las imágenes subidas */}
          {assets.filter((a) => /\.(png|jpe?g|gif|webp|svg)$/i.test(a.name)).length > 0 && (
            <button
              onClick={generateSlideshow}
              className="w-full bg-gradient-to-r from-brand-600 to-fuchsia-600 hover:from-brand-500 hover:to-fuchsia-500 text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              title="Crea un video que recorre tus imágenes con transiciones (crossfade + zoom)"
            >
              🎞️ Crear video de secuencia con mis imágenes
            </button>
          )}

          {/* Lista de Recursos */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {assets.length === 0 ? (
              <div className="text-center py-6 border border-surface-900 rounded-xl bg-surface-975/30">
                <p className="text-xs text-surface-500">No hay recursos locales subidos aún.</p>
              </div>
            ) : (
              assets.map((asset) => {
                const ext = asset.name.split(".").pop()?.toLowerCase() || "";
                const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
                const formatSize = (bytes: number) => {
                  if (bytes === 0) return "0 Bytes";
                  const k = 1024;
                  const sizes = ["Bytes", "KB", "MB"];
                  const i = Math.floor(Math.log(bytes) / Math.log(k));
                  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
                };
                const isCopied = copiedNotification === asset.name;
                
                return (
                  <div key={asset.name} className="flex items-center justify-between p-2.5 rounded-xl border border-surface-900 bg-surface-975/40 hover:bg-surface-900/60 transition-all duration-150">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Thumbnail / Icon */}
                      <div className="w-10 h-10 rounded-lg bg-surface-900 border border-surface-800 overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                        {isImage ? (
                          <img
                            src={`${base}/remotion/assets/${encodeURIComponent(asset.name)}`}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                          />
                        ) : ["mp4", "webm"].includes(ext) ? (
                          <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                        )}
                      </div>
                      
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-surface-200 truncate pr-2" title={asset.name}>
                          {asset.name}
                        </p>
                        <p className="text-[10px] text-surface-500">
                          {formatSize(asset.size)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => insertSnippet(asset.name)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-brand-600/20 text-brand-300 hover:bg-brand-600/40 transition-all cursor-pointer"
                        title="Insertar en el editor (agrega el código y el import)"
                      >
                        + Insertar
                      </button>
                      <button
                        onClick={() => copySnippet(asset.name)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer relative ${
                          isCopied ? "text-green-400 bg-green-500/10" : "text-surface-400 hover:text-brand-400 hover:bg-surface-800"
                        }`}
                        title="Copiar Snippet de Código"
                      >
                        {isCopied ? (
                          <svg className="w-4 h-4 animate-scale-up" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-4 0h4" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteAsset(asset.name)}
                        className="p-1.5 text-surface-400 hover:text-rose-500 hover:bg-surface-800 rounded-lg transition-all cursor-pointer"
                        title="Eliminar Recurso"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Consola de logs en tiempo real */}
        <div className="bg-surface-950/80 backdrop-blur-sm rounded-2xl border border-surface-800/60 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-surface-800/40 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/85" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/85" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/85" />
              <span className="text-[10px] font-mono text-surface-400 ml-2">bash - remotion render</span>
            </div>
            <span className="text-[10px] font-mono text-brand-400 font-semibold uppercase flex items-center gap-1.5">
              {isRendering && <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />}
              {isRendering ? "Procesando" : "Listo"}
            </span>
          </div>

          <div className="bg-surface-975 border border-surface-900 rounded-xl p-4 font-mono text-[10px] text-green-400/90 overflow-y-auto h-[220px] whitespace-pre-wrap leading-relaxed">
            {logs.length > 0 ? (
              getProcessedLogs(logs).map((line, index) => (
                <div key={index}>{line}</div>
              ))
            ) : (
              <span className="text-surface-600">Esperando el inicio del proceso...</span>
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      <TemplateLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectTemplate={(newCode) => setCode(newCode)}
      />
      </div>
    </div>
  );
}
