export interface RemotionTemplate {
  name: string;
  description: string;
  category: "Básico" | "Transiciones" | "Texto" | "Mapas" | "Gráficos" | "Audio y Efectos";
  difficulty: "Fácil" | "Intermedio" | "Avanzado";
  code: string;
}

export const REMOTION_TEMPLATES: RemotionTemplate[] = [
  {
    name: "Entrada Suave (Spring)",
    description: "Efecto de rebote elástico usando resortes físicos (springs) para títulos impactantes.",
    category: "Básico",
    difficulty: "Fácil",
    code: `import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';

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
}`
  },
  {
    name: "Rotación Continua (Spin Loop)",
    description: "Un elemento rotando 360 grados de manera cíclica e infinita.",
    category: "Básico",
    difficulty: "Fácil",
    code: `import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

export default function Main() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Rotar 360 grados a lo largo de toda la duración
  const rotation = (frame / durationInFrames) * 360;

  return (
    <AbsoluteFill style={{
      backgroundColor: '#0c0f1d',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        transform: \`rotate(\${rotation}deg)\`,
        width: 200,
        height: 200,
        borderRadius: 32,
        background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
        boxShadow: '0 0 40px rgba(124, 58, 237, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <span style={{
          color: '#ffffff',
          fontSize: 80,
          fontWeight: 'bold'
        }}>
          🌀
        </span>
      </div>
    </AbsoluteFill>
  );
}`
  },
  {
    name: "Efecto Latido (Zoom Pulse)",
    description: "Animación de escala pulsante suave y orgánica usando la función trigonométrica seno.",
    category: "Básico",
    difficulty: "Fácil",
    code: `import { AbsoluteFill, useCurrentFrame } from 'remotion';

export default function Main() {
  const frame = useCurrentFrame();

  // Crear un latido/pulso infinito usando la función matemática seno
  const scale = 1 + Math.sin(frame * 0.15) * 0.08;

  return (
    <AbsoluteFill style={{
      backgroundColor: '#090514',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        transform: \`scale(\${scale})\`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20
      }}>
        <div style={{
          width: 140,
          height: 140,
          borderRadius: '50%',
          backgroundColor: '#ef4444',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: 64,
          boxShadow: '0 0 50px rgba(239, 68, 68, 0.4)'
        }}>
          ❤️
        </div>
        <h3 style={{ color: '#fca5a5', fontSize: 28, margin: 0 }}>
          Efecto Latido / Pulse
        </h3>
      </div>
    </AbsoluteFill>
  );
}`
  },
  {
    name: "Desvanecimiento e Interpolación (Fade & Zoom)",
    description: "Entrada y salida gradual (Fade In + Out) combinada con un zoom constante a lo largo del tiempo.",
    category: "Transiciones",
    difficulty: "Fácil",
    code: `import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';

export default function Main() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Opacidad: 0 -> 1 en los primeros 15 frames, y 1 -> 0 en los últimos 15 frames
  const opacity = interpolate(
    frame,
    [0, 15, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Escala suave de 0.8 a 1.2 a lo largo de todo el video
  const scale = interpolate(
    frame,
    [0, durationInFrames],
    [0.8, 1.2],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{
      backgroundColor: '#020617',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#f8fafc',
      fontFamily: 'system-ui, sans-serif',
      opacity
    }}>
      <div style={{
        transform: \`scale(\${scale})\`,
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: 64, margin: 0, fontWeight: 900 }}>
          Efecto Interpolado
        </h2>
        <p style={{ color: '#38bdf8', fontSize: 24, marginTop: 15 }}>
          Fade In + Zoom Suave + Fade Out
        </p>
      </div>
    </AbsoluteFill>
  );
}`
  },
  {
    name: "Revelación Letra por Letra (Text Reveal)",
    description: "Alinear entrada secuencial de cada letra de un texto con resortes elásticos.",
    category: "Texto",
    difficulty: "Intermedio",
    code: `import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export default function Main() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = "REMOTION";
  const words = text.split("");

  return (
    <AbsoluteFill style={{
      backgroundColor: '#070a13',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {words.map((char, i) => {
        // Retrasar la entrada de cada letra (2 frames por letra)
        const delay = i * 2;
        const scale = spring({
          frame: frame - delay,
          fps,
          config: { damping: 10 }
        });

        const opacity = interpolate(
          frame - delay,
          [0, 5],
          [0, 1],
          { extrapolateLeft: 'clamp' }
        );

        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              color: '#38bdf8',
              fontSize: 72,
              fontWeight: 900,
              transform: \`scale(\${scale})\`,
              opacity,
              margin: '0 4px',
              textShadow: '0 0 20px rgba(56, 189, 248, 0.3)'
            }}
          >
            {char}
          </span>
        );
      })}
    </AbsoluteFill>
  );
}`
  },
  {
    name: "Mapa Animado (Maplibre GL)",
    description: "Animación de viaje interactivo desde el espacio a una ciudad usando Maplibre GL, marcadores y estilo CartoDB Dark Matter.",
    category: "Mapas",
    difficulty: "Avanzado",
    code: `import { useEffect, useRef, useState } from 'react';
import { AbsoluteFill, useDelayRender, useVideoConfig, useCurrentFrame, interpolate } from 'remotion';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// 🌎 Thunder Bay, Ontario
const thunderBay: [number, number] = [-89.2477, 48.3809];

// Inicio del viaje (vista amplia de Canadá)
const start: [number, number] = [-100, 55];

export default function Main() {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const { delayRender, continueRender } = useDelayRender();
  const [initHandle] = useState(() => delayRender("Loading map..."));

  const [map, setMap] = useState<maplibregl.Map | null>(null);

  // 1. INICIALIZAR MAPA
  useEffect(() => {
    if (!ref.current) return;

    const m = new maplibregl.Map({
      container: ref.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: start,
      zoom: 2,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      canvasContextAttributes: {
        preserveDrawingBuffer: true, // Requerido para capturar WebGL
      }
    });

    m.on('load', () => {
      // Marcador en Thunder Bay
      new maplibregl.Marker({
        color: "#8b5cf6"
      })
        .setLngLat(thunderBay)
        .addTo(m);

      m.once('idle', () => {
        continueRender(initHandle);
        setMap(m);
      });
    });
  }, [initHandle, continueRender]);

  // 2. ANIMACIÓN DE CÁMARA
  useEffect(() => {
    if (!map) return;

    const lng = interpolate(frame, [0, durationInFrames], [start[0], thunderBay[0]]);
    const lat = interpolate(frame, [0, durationInFrames], [start[1], thunderBay[1]]);
    const zoom = interpolate(frame, [0, durationInFrames], [2, 10], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    });

    const renderHandle = delayRender('Camera frame ' + frame);
    map.jumpTo({
      center: [lng, lat],
      zoom,
    });

    map.once('idle', () => {
      continueRender(renderHandle);
    });

    map.triggerRepaint();
  }, [frame, durationInFrames, map, delayRender, continueRender]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#020617' }}>
      <div
        ref={ref}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(0,0,0,0.1), rgba(0,0,0,0.7))',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 50,
          left: 50,
          background: 'rgba(5, 7, 11, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '18px 26px',
          borderRadius: 16,
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, letterSpacing: 2 }}>
          DESTINATION HIGHLIGHT
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#a78bfa' }}>
          Thunder Bay
        </div>
        <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
          Ontario, Canada
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 80,
          color: 'white',
          fontSize: 64,
          fontWeight: 900,
          letterSpacing: -2,
          textShadow: '0 0 30px rgba(0,0,0,0.8)'
        }}
      >
        Thunder Bay
      </div>
    </AbsoluteFill>
  );
}`
  },
  {
    name: "Ruta Dinámica en Mapa (GeoPath)",
    description: "Dibuja progresivamente una línea de viaje animada entre Ottawa y Montreal en tiempo real.",
    category: "Mapas",
    difficulty: "Avanzado",
    code: `import { useEffect, useRef, useState } from 'react';
import { AbsoluteFill, useDelayRender, useVideoConfig, useCurrentFrame, interpolate } from 'remotion';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Coordenadas
const ottawa: [number, number] = [-75.6972, 45.4215];
const montreal: [number, number] = [-73.5673, 45.5017];

export default function Main() {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const { delayRender, continueRender } = useDelayRender();
  const [initHandle] = useState(() => delayRender("Loading map..."));
  const [map, setMap] = useState<maplibregl.Map | null>(null);

  // 1. INICIALIZAR MAPA
  useEffect(() => {
    if (!ref.current) return;

    const m = new maplibregl.Map({
      container: ref.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [-74.63, 45.46], // Centro aproximado entre ambas ciudades
      zoom: 7.2,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      canvasContextAttributes: {
        preserveDrawingBuffer: true,
      }
    });

    m.on('load', () => {
      // Marcadores iniciales
      new maplibregl.Marker({ color: "#ef4444" }).setLngLat(ottawa).addTo(m);
      new maplibregl.Marker({ color: "#10b981" }).setLngLat(montreal).addTo(m);

      // Agregar la fuente GeoJSON para la línea
      m.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [ottawa]
          }
        }
      });

      // Agregar la capa de la línea
      m.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#f59e0b',
          'line-width': 6,
          'line-shadow-color': '#f59e0b',
          'line-shadow-width': 10
        }
      });

      m.once('idle', () => {
        continueRender(initHandle);
        setMap(m);
      });
    });
  }, [initHandle, continueRender]);

  // 2. ACTUALIZAR RUTA SEGÚN EL FRAME
  useEffect(() => {
    if (!map) return;

    // Calcular el punto actual de la línea
    const progress = frame / durationInFrames;
    const currentLng = interpolate(frame, [0, durationInFrames], [ottawa[0], montreal[0]]);
    const currentLat = interpolate(frame, [0, durationInFrames], [ottawa[1], montreal[1]]);

    const currentCoords = [
      ottawa,
      [currentLng, currentLat]
    ];

    const source = map.getSource('route') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: currentCoords
        }
      });
    }

    const renderHandle = delayRender('Path frame ' + frame);
    map.once('idle', () => {
      continueRender(renderHandle);
    });
    map.triggerRepaint();

  }, [frame, durationInFrames, map, delayRender, continueRender]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#020617' }}>
      <div ref={ref} style={{ width: '100%', height: '100%', position: 'absolute' }} />
      
      {/* HUD Info */}
      <div style={{
        position: 'absolute',
        top: 40,
        left: 40,
        background: 'rgba(10, 15, 30, 0.85)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        padding: '16px 24px',
        borderRadius: 12,
        color: 'white',
        fontFamily: 'monospace',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
      }}>
        <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: 16 }}>⚡ CARRETERA EN VIVO</div>
        <div style={{ fontSize: 12, marginTop: 6, color: '#94a3b8' }}>
          De: Ottawa [ON]<br/>
          A: Montreal [QC]
        </div>
      </div>
    </AbsoluteFill>
  );
}`
  },
  {
    name: "Subtítulos Estilo Karaoke",
    description: "Sincronización de subtítulos palabra por palabra, resaltando la palabra activa con escala y brillo violeta.",
    category: "Texto",
    difficulty: "Intermedio",
    code: `import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

const words = [
  { text: "El", start: 0, end: 10 },
  { text: "futuro", start: 10, end: 22 },
  { text: "de", start: 22, end: 28 },
  { text: "la", start: 28, end: 34 },
  { text: "creación", start: 34, end: 48 },
  { text: "de", start: 48, end: 54 },
  { text: "video", start: 54, end: 68 },
  { text: "está", start: 68, end: 76 },
  { text: "aquí.", start: 76, end: 90 }
];

export default function Main() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{
      backgroundColor: '#05070b',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <div style={{
        maxWidth: 800,
        textAlign: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '12px 20px',
        padding: '0 40px'
      }}>
        {words.map((w, i) => {
          const isActive = frame >= w.start && frame < w.end;
          
          // Animar escala y rebote de la palabra activa
          const scale = spring({
            frame: frame - w.start,
            fps,
            config: { damping: 10, stiffness: 100 },
          });

          const wordScale = isActive ? interpolate(scale, [0, 1], [1, 1.25]) : 1;
          const color = isActive ? '#a78bfa' : '#475569';
          const textShadow = isActive ? '0 0 20px rgba(167, 139, 250, 0.6)' : 'none';

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontSize: 54,
                fontWeight: 900,
                color,
                textShadow,
                transform: \`scale(\${wordScale})\`,
                transition: 'color 0.15s ease, transform 0.15s ease',
                textTransform: 'uppercase'
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}`
  },
  {
    name: "Gráfico de Barras Animado",
    description: "Gráfico dinámico donde las barras aumentan de tamaño progresivamente con números animados en porcentaje.",
    category: "Gráficos",
    difficulty: "Intermedio",
    code: `import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

const data = [
  { label: "React / Vite", value: 88, color: "linear-gradient(90deg, #3b82f6, #06b6d4)" },
  { label: "Remotion Engine", value: 95, color: "linear-gradient(90deg, #ec4899, #f43f5e)" },
  { label: "Maplibre WebGL", value: 78, color: "linear-gradient(90deg, #8b5cf6, #a78bfa)" },
  { label: "Turf.js Math", value: 65, color: "linear-gradient(90deg, #10b981, #34d399)" }
];

export default function Main() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{
      backgroundColor: '#090d16',
      color: 'white',
      fontFamily: 'system-ui, sans-serif',
      padding: '80px 100px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <h2 style={{ fontSize: 44, fontWeight: 900, marginBottom: 50, color: '#f8fafc', letterSpacing: -1 }}>
        Rendimiento de Herramientas
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {data.map((item, idx) => {
          // Animación individual con un desfase de 4 frames por fila
          const delay = idx * 5;
          const progress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 14 }
          });

          // Animar el ancho de la barra
          const barWidth = interpolate(progress, [0, 1], [0, item.value]);
          // Animar el valor del contador numérico
          const currentValue = Math.round(interpolate(progress, [0, 1], [0, item.value]));

          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 600, color: '#94a3b8' }}>
                <span>{item.label}</span>
                <span style={{ color: '#fff', fontWeight: 800 }}>{currentValue}%</span>
              </div>
              
              {/* Contenedor de la barra */}
              <div style={{
                height: 28,
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.05)',
                overflow: 'hidden'
              }}>
                {/* Relleno de la barra animada */}
                <div style={{
                  height: '100%',
                  width: \`\${barWidth}%\`,
                  background: item.color,
                  borderRadius: 8,
                  boxShadow: '0 0 15px rgba(139, 92, 246, 0.15)'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}`
  },
  {
    name: "Visualizador Espectro de Audio",
    description: "Simulador estético de ondas o ecualizador de audio que pulsa de forma fluida y colorida.",
    category: "Audio y Efectos",
    difficulty: "Intermedio",
    code: `import { AbsoluteFill, useCurrentFrame } from 'remotion';

export default function Main() {
  const frame = useCurrentFrame();
  const barsCount = 20;

  return (
    <AbsoluteFill style={{
      backgroundColor: '#030712',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 200
      }}>
        {Array.from({ length: barsCount }).map((_, i) => {
          // Genera una oscilación dinámica basada en el frame y el índice de la barra
          const waveHeight = 20 + Math.sin(frame * 0.2 + i * 0.6) * 75 + Math.cos(frame * 0.15 - i * 0.4) * 35;
          const finalHeight = Math.max(10, Math.min(180, waveHeight));

          // Gradiente de color según la posición de la barra
          const colorIntensity = (i / barsCount) * 100;
          const background = \`linear-gradient(to top, #7c3aed, hsl(\${280 + colorIntensity}, 85%, 60%))\`;

          return (
            <div
              key={i}
              style={{
                width: 14,
                height: finalHeight,
                background,
                borderRadius: 8,
                boxShadow: '0 0 15px rgba(124, 58, 237, 0.4)',
                transition: 'height 0.05s linear'
              }}
            />
          );
        })}
      </div>

      <p style={{
        color: '#6b7280',
        fontSize: 14,
        marginTop: 40,
        letterSpacing: 3,
        fontWeight: 600,
        textTransform: 'uppercase'
      }}>
        AUDIO SPECTRUM
      </p>
    </AbsoluteFill>
  );
}`
  },
  {
    name: "Efecto Glitch RGB Cyberpunk",
    description: "Texto holográfico que vibra y divide sus canales de color aleatoriamente al estilo de un sistema corrupto.",
    category: "Audio y Efectos",
    difficulty: "Avanzado",
    code: `import { AbsoluteFill, useCurrentFrame } from 'remotion';

export default function Main() {
  const frame = useCurrentFrame();

  // Activar la distorsión de forma intermitente (cada ciertos frames)
  const isGlitchFrame = frame % 12 === 0 || frame % 19 === 0 || (frame > 45 && frame < 52);
  
  // Desfases aleatorios si es frame de glitch
  const shiftX = isGlitchFrame ? (Math.random() - 0.5) * 18 : 0;
  const shiftY = isGlitchFrame ? (Math.random() - 0.5) * 8 : 0;
  
  // Sombras de color RGB split (Cian y Magenta)
  const textShadow = isGlitchFrame
    ? \`\${shiftX * -1}px \${shiftY}px 0 #00ffff, \${shiftX}px \${shiftY * -1}px 0 #ff00ff\`
    : '2px 2px 0 rgba(0,0,0,0.5)';

  const scale = isGlitchFrame ? 1 + (Math.random() - 0.5) * 0.05 : 1;

  return (
    <AbsoluteFill style={{
      backgroundColor: '#0a0515',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'monospace',
      overflow: 'hidden'
    }}>
      {/* Grid de líneas de fondo retro-futurista */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(18, 10, 36, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(18, 10, 36, 0.4) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        pointerEvents: 'none'
      }} />

      <div style={{
        transform: \`scale(\${scale}) translate(\${shiftX}px, \${shiftY}px)\`,
        textAlign: 'center',
        padding: 40,
        zIndex: 10
      }}>
        <h1 style={{
          fontSize: 88,
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: 6,
          margin: 0,
          textShadow,
          fontFamily: '"Impact", "Arial Black", sans-serif'
        }}>
          SYSTEM ERROR
        </h1>

        <p style={{
          fontSize: 20,
          color: isGlitchFrame ? '#ff00ff' : '#00ffff',
          marginTop: 10,
          fontWeight: 'bold',
          letterSpacing: 4,
          textTransform: 'uppercase',
          textShadow: isGlitchFrame ? '0 0 10px rgba(255,0,255,0.8)' : 'none'
        }}>
          {isGlitchFrame ? "OVERRIDING SECURITY PROTOCOL" : "STATUS: CRITICAL"}
        </p>
      </div>
    </AbsoluteFill>
  );
}`
  },
  {
    name: "Cuenta Regresiva (Countdown)",
    description: "Números 3-2-1 con escala y desvanecimiento. Ideal para intros.",
    category: "Texto",
    difficulty: "Fácil",
    code: `import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export default function Main() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const total = 3;
  const per = durationInFrames / total;
  const idx = Math.min(total - 1, Math.floor(frame / per));
  const local = frame - idx * per;
  const scale = interpolate(local, [0, per * 0.3, per], [0.4, 1.2, 0.9], { extrapolateRight: 'clamp' });
  const opacity = interpolate(local, [0, per * 0.2, per * 0.8, per], [0, 1, 1, 0]);
  return (
    <AbsoluteFill style={{ backgroundColor: '#0b0b14', justifyContent: 'center', alignItems: 'center', fontFamily: 'system-ui' }}>
      <div style={{ fontSize: 260, fontWeight: 900, color: '#8b5cf6', transform: \`scale(\${scale})\`, opacity }}>
        {total - idx}
      </div>
    </AbsoluteFill>
  );
}`
  },
  {
    name: "Lower Third (Nombre y Cargo)",
    description: "Rótulo inferior que entra deslizando. Para presentar personas.",
    category: "Texto",
    difficulty: "Intermedio",
    code: `import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

export default function Main() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14 } });
  const x = interpolate(enter, [0, 1], [-500, 0]);
  return (
    <AbsoluteFill style={{ backgroundColor: '#05070b', justifyContent: 'flex-end', padding: 80, fontFamily: 'system-ui' }}>
      <div style={{ transform: \`translateX(\${x}px)\`, background: 'linear-gradient(90deg, #8b5cf6, #ec4899)', padding: '18px 30px', borderRadius: 12, alignSelf: 'flex-start' }}>
        <div style={{ color: 'white', fontSize: 44, fontWeight: 800 }}>Edward Trinidad</div>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 24 }}>Creador de SkillNexus</div>
      </div>
    </AbsoluteFill>
  );
}`
  },
  {
    name: "Máquina de Escribir (Typewriter)",
    description: "El texto aparece carácter por carácter con cursor parpadeante.",
    category: "Texto",
    difficulty: "Fácil",
    code: `import { AbsoluteFill, useCurrentFrame } from 'remotion';

export default function Main() {
  const frame = useCurrentFrame();
  const text = 'Hola, esto es SkillNexus.';
  const chars = Math.floor(frame / 3);
  const shown = text.slice(0, chars);
  const cursor = Math.floor(frame / 15) % 2 === 0 ? '|' : ' ';
  return (
    <AbsoluteFill style={{ backgroundColor: '#0d1117', justifyContent: 'center', alignItems: 'center', fontFamily: 'ui-monospace, monospace' }}>
      <div style={{ color: '#39ff14', fontSize: 60 }}>{shown}<span>{cursor}</span></div>
    </AbsoluteFill>
  );
}`
  },
  {
    name: "Fondo Gradiente Animado",
    description: "Un gradiente que rota lentamente. Perfecto como fondo de otras capas.",
    category: "Gráficos",
    difficulty: "Fácil",
    code: `import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export default function Main() {
  const frame = useCurrentFrame();
  const angle = interpolate(frame, [0, 200], [0, 360]);
  return (
    <AbsoluteFill style={{ background: \`linear-gradient(\${angle}deg, #7c3aed, #ec4899, #06b6d4)\`, justifyContent: 'center', alignItems: 'center', fontFamily: 'system-ui' }}>
      <h1 style={{ color: 'white', fontSize: 90, fontWeight: 900, textShadow: '0 4px 30px rgba(0,0,0,0.3)' }}>SkillNexus</h1>
    </AbsoluteFill>
  );
}`
  },
  {
    name: "Logo Reveal (Escala + Brillo)",
    description: "Un texto/logo aparece con escala elástica y un destello.",
    category: "Básico",
    difficulty: "Intermedio",
    code: `import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

export default function Main() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 10, mass: 0.8 } });
  const glow = interpolate(frame, [10, 25, 45], [0, 40, 12], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ backgroundColor: '#05070b', justifyContent: 'center', alignItems: 'center', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 120, fontWeight: 900, color: 'white', transform: \`scale(\${s})\`, textShadow: \`0 0 \${glow}px #8b5cf6\` }}>NEXUS</h1>
    </AbsoluteFill>
  );
}`
  },
  {
    name: "Barra de Progreso",
    description: "Una barra que se llena de 0 a 100% con porcentaje.",
    category: "Gráficos",
    difficulty: "Fácil",
    code: `import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export default function Main() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const pct = interpolate(frame, [0, durationInFrames], [0, 100], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ backgroundColor: '#0b0b14', justifyContent: 'center', alignItems: 'center', fontFamily: 'system-ui', gap: 20 }}>
      <div style={{ color: 'white', fontSize: 70, fontWeight: 800 }}>{Math.round(pct)}%</div>
      <div style={{ width: 700, height: 22, background: '#1e1e2e', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ width: \`\${pct}%\`, height: '100%', background: 'linear-gradient(90deg,#8b5cf6,#ec4899)' }} />
      </div>
    </AbsoluteFill>
  );
}`
  },
  {
    name: "Tipografía Cinética (Palabras)",
    description: "Una frase donde cada palabra entra en secuencia.",
    category: "Texto",
    difficulty: "Intermedio",
    code: `import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';

export default function Main() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = ['Crea', 'videos', 'con', 'código'];
  return (
    <AbsoluteFill style={{ backgroundColor: '#05070b', justifyContent: 'center', alignItems: 'center', fontFamily: 'system-ui', gap: 16, flexDirection: 'row', flexWrap: 'wrap' }}>
      {words.map((w, i) => {
        const s = spring({ frame: frame - i * 10, fps, config: { damping: 12 } });
        return (
          <span key={i} style={{ fontSize: 90, fontWeight: 900, color: 'white', opacity: s, transform: \`translateY(\${(1 - s) * 40}px)\` }}>{w}</span>
        );
      })}
    </AbsoluteFill>
  );
}`
  },
  {
    name: "Formas Rebotando",
    description: "Círculos que caen y rebotan con física simple usando springs.",
    category: "Gráficos",
    difficulty: "Intermedio",
    code: `import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

export default function Main() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b'];
  return (
    <AbsoluteFill style={{ backgroundColor: '#0b0b14', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 200, gap: 40 }}>
      {colors.map((c, i) => {
        const s = spring({ frame: frame - i * 6, fps, config: { damping: 8, mass: 0.6 } });
        const y = interpolate(s, [0, 1], [-300, 0]);
        return <div key={i} style={{ width: 120, height: 120, borderRadius: '50%', background: c, transform: \`translateY(\${y}px)\` }} />;
      })}
    </AbsoluteFill>
  );
}`
  },
  {
    name: "Título + Subtítulo (Slide-in)",
    description: "Título y subtítulo que entran desde lados opuestos.",
    category: "Básico",
    difficulty: "Fácil",
    code: `import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

export default function Main() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 16 } });
  const b = spring({ frame: frame - 8, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ backgroundColor: '#05070b', justifyContent: 'center', alignItems: 'center', fontFamily: 'system-ui' }}>
      <h1 style={{ color: 'white', fontSize: 100, fontWeight: 900, transform: \`translateX(\${interpolate(a, [0,1], [-600, 0])}px)\`, margin: 0 }}>SkillNexus</h1>
      <p style={{ color: '#94a3b8', fontSize: 36, transform: \`translateX(\${interpolate(b, [0,1], [600, 0])}px)\` }}>Gestión inteligente de agentes</p>
    </AbsoluteFill>
  );
}`
  }
];
