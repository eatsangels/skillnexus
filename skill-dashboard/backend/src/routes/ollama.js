import { Router } from "express";

const router = Router();

// Host de Ollama (por defecto el local). Configurable por entorno.
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";

// Prompt de sistema: fuerza al modelo a devolver SOLO un componente Remotion válido
// que use únicamente imports de 'remotion' (el sandbox del preview no permite otros).
const SYSTEM_PROMPT = `Eres un experto en Remotion (videos con React). Genera SOLO un componente de React en TypeScript (TSX) listo para renderizar.

REGLAS ESTRICTAS:
- Devuelve ÚNICAMENTE el código, sin explicaciones ni texto adicional.
- El componente debe tener 'export default function Main()'.
- Importa SOLO desde 'remotion' (por ejemplo: AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence, Series, Img, staticFile). NO uses otras librerías ni @remotion/*.
- Anima usando useCurrentFrame() + interpolate()/spring(). Usa estilos en línea (style={{...}}).
- No uses assets externos por URL salvo que se pidan; prefiere formas, texto y gradientes.
- El código debe ser autocontenido y compilar sin errores.

Ejemplo de estructura válida:
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
export default function Main() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ backgroundColor: '#05070b', justifyContent: 'center', alignItems: 'center' }}>
      <h1 style={{ color: 'white', opacity, fontSize: 80 }}>Hola</h1>
    </AbsoluteFill>
  );
}`;

// Extrae el bloque de código de una respuesta (por si el modelo lo envuelve en ```tsx ... ```).
function extractCode(text) {
  if (!text) return "";
  const fence = text.match(/```(?:tsx|jsx|typescript|ts|javascript|js)?\s*\n([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  return text.trim();
}

// Lista los modelos cargados en Ollama.
router.get("/models", async (_req, res) => {
  try {
    const r = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) throw new Error(`Ollama respondió ${r.status}`);
    const data = await r.json();
    const models = (data.models || []).map((m) => m.name).filter(Boolean);
    res.json({ available: true, models });
  } catch (e) {
    // Ollama no está corriendo o no es accesible.
    res.json({ available: false, models: [], error: e.message });
  }
});

// Genera código Remotion a partir de un prompt usando el modelo elegido.
router.post("/generate", async (req, res) => {
  const { model, prompt } = req.body || {};
  if (!model || typeof model !== "string") {
    return res.status(400).json({ error: "Falta el parámetro 'model'." });
  }
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Falta el parámetro 'prompt'." });
  }

  try {
    const r = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        system: SYSTEM_PROMPT,
        prompt: `Crea un video Remotion para: ${prompt.slice(0, 2000)}`,
        stream: false,
        options: { temperature: 0.4 },
      }),
      // Generar código puede tardar; damos margen amplio.
      signal: AbortSignal.timeout(180000),
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      return res.status(502).json({ error: `Ollama error ${r.status}: ${txt.slice(0, 200)}` });
    }

    const data = await r.json();
    const raw = data.response || "";
    const code = extractCode(raw);
    if (!code) {
      return res.status(502).json({ error: "El modelo no devolvió código. Prueba con otro modelo o reformula el prompt." });
    }
    res.json({ code, model });
  } catch (e) {
    const msg = e.name === "TimeoutError"
      ? "El modelo tardó demasiado en responder (timeout). Prueba con un modelo más pequeño/rápido."
      : e.message;
    res.status(502).json({ error: msg });
  }
});

export default router;
