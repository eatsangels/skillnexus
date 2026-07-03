import { useEffect, useMemo, useState } from "react";
import { Player } from "@remotion/player";
import { compileRemotion } from "../lib/compileRemotion";

interface Props {
  code: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  inputProps?: Record<string, unknown>;
  assetsBaseUrl?: string;
}

// Previsualización en tiempo real (sin renderizar). Compila el TSX del usuario con un
// pequeño debounce y lo reproduce con <Player>. Los errores de compilación y de ejecución
// se muestran de forma amable en vez de romper la app.
export default function LivePreview({ code, width, height, fps, duration, inputProps, assetsBaseUrl }: Props) {
  const [debouncedCode, setDebouncedCode] = useState(code);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCode(code), 400);
    return () => clearTimeout(t);
  }, [code]);

  const { component, error } = useMemo(() => compileRemotion(debouncedCode, assetsBaseUrl), [debouncedCode, assetsBaseUrl]);

  const durationInFrames = Math.max(1, Math.floor(Number(duration) * Number(fps)) || 1);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-2xl mb-2">⚠️</div>
          <p className="text-xs font-semibold text-rose-400 mb-1">Error al compilar el componente</p>
          <pre className="text-[10px] text-rose-300/80 whitespace-pre-wrap font-mono text-left bg-rose-500/5 border border-rose-500/20 rounded-lg p-2 max-h-40 overflow-auto">
            {error}
          </pre>
        </div>
      </div>
    );
  }

  if (!component) {
    return <div className="w-full h-full flex items-center justify-center text-surface-500 text-xs">Compilando…</div>;
  }

  return (
    <Player
      component={component}
      durationInFrames={durationInFrames}
      fps={Number(fps)}
      compositionWidth={Number(width)}
      compositionHeight={Number(height)}
      inputProps={inputProps}
      controls
      loop
      style={{ width: "100%", height: "100%" }}
      errorFallback={({ error: e }: { error: Error }) => (
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-2xl mb-2">🐞</div>
            <p className="text-xs font-semibold text-rose-400 mb-1">Error en tiempo de ejecución</p>
            <pre className="text-[10px] text-rose-300/80 whitespace-pre-wrap font-mono text-left bg-rose-500/5 border border-rose-500/20 rounded-lg p-2 max-h-40 overflow-auto">
              {e.message}
            </pre>
          </div>
        </div>
      )}
    />
  );
}
