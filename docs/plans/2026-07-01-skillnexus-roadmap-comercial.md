# SkillNexus — Hoja de Ruta hacia Producto Comercial

> **Para trabajadores agénticos:** Este es un **roadmap maestro por fases**, no un plan de ejecución paso a paso. Cada fase (P0–P8) es autónoma y produce software funcional y verificable. Antes de ejecutar una fase, genera su plan detallado con la skill `superpowers:writing-plans` (pasos bite-sized con TDD). Las fases están ordenadas por dependencia y riesgo: **P0→P2 son fundacionales** (hacen el producto estable y seguro); **P3→P5 lo hacen usable y vendible**; **P6→P8 lo profesionalizan**.

**Objetivo:** Convertir SkillNexus de una herramienta funcional pero frágil en un producto comercial estable, seguro, mantenible y monetizable.

**Arquitectura actual:** Electron (desktop) + backend Express (Node, puerto 3001) + frontend React/Vite. El backend escanea skills/agentes locales de múltiples IAs y permite instalarlos desde catálogos de GitHub. La app empaquetada forkea su propio backend; la web usa Vite con proxy.

**Stack:** Electron 30, Express 4, React 19, Vite 8, Tailwind, gray-matter, adm-zip, electron-builder, electron-updater.

---

## Constraints Globales (aplican a todas las fases)

- **Plataforma primaria:** Windows 10+ (win32 x64). Mantener rutas con `path.join`, nunca hardcodear separadores.
- **Versión única de la app:** leída siempre desde `package.json`. Prohibido nuevos fallbacks hardcodeados de versión.
- **Compatibilidad hacia atrás:** las instalaciones existentes de skills/agentes (carpeta OpenCode del proyecto, `~/.claude/agents`, `~/.agents/skills`) deben seguir detectándose.
- **Idioma:** UI bilingüe ES/EN (ya existe toggle `agent-modal-lang` en localStorage). Todo texto nuevo debe tener ambas variantes.
- **Sin romper el auto-updater:** cambios de empaquetado deben mantener `electron-updater` + `publish` a GitHub funcionando.
- **Node del backend empaquetado:** el código de `skill-dashboard/backend/src/**` se bundlea en el asar; cualquier dependencia nueva debe agregarse a `dependencies` (no devDependencies) y a la lista `build.files`.

---

## Estado actual (línea base tras el trabajo del 2026-07-01)

Ya resuelto en esta sesión (v1.0.25):
- Contador que revertía (dedup por archivo, YAML tolerante, parser JSONC que respeta strings).
- Instalación de skills multi-IA vía `npx skills add --global`.
- Escaneo de la carpeta canónica global `~/.agents/skills`.

Pendiente de commit: todos los cambios anteriores siguen sin commitear.

---

## FASE P0 — Estabilidad del backend y arranque (CRÍTICA)

**Por qué primero:** es la causa raíz de los dos incidentes de "no carga nada". Sin esto, cualquier conflicto de puerto tumba la app.

**Archivos:**
- Modificar: `skill-dashboard/backend/src/server.js` — manejo de `EADDRINUSE` + selección de puerto libre.
- Modificar: `skill-dashboard/backend/src/config.js` — puerto configurable por env (`PORT`) con rango de fallback.
- Modificar: `skill-dashboard/backend/src/api.js` — handlers globales `uncaughtException`/`unhandledRejection`; endpoint `/api/health`.
- Modificar: `electron-main.js` — detectar backend ya vivo antes de forkear; escribir el puerto elegido a un archivo/IPC.
- Crear: `skill-dashboard/frontend/src/api.ts` (ajuste) — descubrir el puerto del backend (leer de `/health` o de variable inyectada) en vez de hardcodear 3001.
- Modificar: `skill-dashboard/start.ps1` — esperar readiness real (poll a `/api/health`) en vez de `Start-Sleep 3`; no ocultar logs.

**Tareas:**
1. `server.js`: envolver `app.listen` con listener de error; si `EADDRINUSE`, intentar puertos 3001→3010; loguear el puerto final; exponerlo por `process.send({type:'port', port})` cuando corre bajo Electron.
2. `api.js`: añadir `/api/health` (devuelve `{ok:true, version, port, lastScan}`) y handlers globales que loguean sin matar el proceso.
3. `electron-main.js`: antes de `startBackend()`, hacer un fetch a `http://localhost:3001/api/health`; si responde con la misma versión, reusar; si no, forkear y capturar el puerto por IPC; pasar el puerto al renderer vía `additionalArguments` o un archivo temporal.
4. Frontend: `BASE` se resuelve consultando el puerto real (fallback 3001). Mostrar banner "Reconectando al backend…" cuando `/health` falla, con reintento exponencial.
5. `start.ps1`: reemplazar sleep fijo por polling a `/api/health`; mostrar salida de los jobs en consola.

**Criterio de aceptación:**
- Abrir dos instancias (dev + instalada) NO deja la app en 0; la segunda reusa o elige otro puerto.
- Matar el backend mientras la app corre muestra el banner de reconexión y se recupera al volver.
- Un throw dentro de un scan no tumba el servidor (verificable inyectando un archivo corrupto).

---

## FASE P1 — Seguridad (ALTA)

**Por qué:** hay ejecución de comandos con interpolación y ejecución de código arbitrario. Es requisito para vender/distribuir.

**Archivos:**
- Modificar: `skill-dashboard/backend/src/skills-sh-scanner.js` y `agents-sh-scanner.js` — cambiar `exec(string)` por `execFile`/`spawn` con args en array; validar `owner/repo`/`slug` con regex.
- Modificar: `skill-dashboard/backend/src/server.js` — CORS restringido a `http://localhost:*` y `file://`.
- Modificar: `skill-dashboard/backend/src/api.js` — validación de esquema (zod) en todos los `POST`; gating explícito de `/agents/:name/run` y `/remotion/render` local.
- Crear: `skill-dashboard/backend/src/validate.js` — helpers de validación (`isValidRepo`, `isValidSlug`, esquemas zod).
- Modificar: `package.json` — agregar `zod` a dependencies.

**Tareas:**
1. Reemplazar toda interpolación en `exec` por `execFile("npx", ["-y","skills@latest","add",source,"--skill",slug,"--global","--yes"], {shell:false})`. Validar `source` (`^[\w.-]+/[\w.-]+$`) y `slug` (`^[\w.-]+$`) antes; rechazar con 400 si no cumplen.
2. CORS: `cors({origin: (o,cb)=> cb(null, !o || /^http:\/\/localhost(:\d+)?$/.test(o) || o==='file://')})`.
3. `/agents/:name/run`: requerir header/flag de confirmación; documentar que ejecuta OpenCode con permisos elevados; opción de deshabilitar por config.
4. `/remotion/render` modo local: ejecutar en un directorio sandbox aislado y con timeout; documentar el riesgo; considerar desactivarlo por defecto en producción.
5. zod en `POST /skills-sh/install`, `/agents-sh/install`, `/remotion/*`.

**Criterio de aceptación:**
- Un `source` con `; calc.exe` o backticks es rechazado con 400 y no ejecuta nada.
- CORS bloquea orígenes externos (test con `Origin: https://evil.com`).
- Los endpoints de ejecución exigen confirmación.

---

## FASE P2 — Calidad: tests y refactor del monolito (ALTA)

**Por qué:** sin tests, cada release puede reintroducir los bugs ya arreglados. `api.js` (745 líneas) es difícil de mantener.

**Archivos:**
- Crear: `skill-dashboard/backend/vitest.config.js`, `skill-dashboard/backend/test/agent-scanner.test.js`, `skill-scanner.test.js`, `install.test.js`, `jsonc-parser.test.js`.
- Refactor: dividir `api.js` en `routes/skills.js`, `routes/agents.js`, `routes/catalog.js`, `routes/remotion.js`, `routes/updates.js`, `sse.js`.
- Crear: `skill-dashboard/frontend` tests con Vitest + Testing Library para `SkillsShModal`, `App` (estado de carga/error).
- Modificar: `package.json` (raíz y sub-paquetes) — scripts `test`, `test:watch`.

**Tareas:**
1. Tests unitarios que fijan los bugs ya arreglados: dedup por archivo (dos agentes con mismo `name`), YAML inválido no descarta el archivo, parser JSONC preserva URLs y comas colgantes, `installSkill` devuelve `agents[]`.
2. Extraer routers de `api.js` sin cambiar rutas públicas; `api.js` queda como ensamblador.
3. Extraer `broadcast`/SSE a `sse.js`.
4. Test de humo: levantar el server en puerto efímero y verificar `/api/health`, `/api/dashboard`, `/api/agents`.

**Criterio de aceptación:**
- `npm test` pasa en backend y frontend.
- Cobertura mínima de los scanners (>80% de las funciones de parseo).
- Las rutas siguen respondiendo igual tras el refactor (test de humo verde).

---

## FASE P3 — UX y funcionalidad del dashboard (MEDIA-ALTA)

**Por qué:** para ser comercial necesita gestión completa (no solo instalar) y feedback de errores.

**Archivos:**
- Modificar: `frontend/src/App.tsx` — error boundary, estado "backend offline", persistencia de filtros en URL/localStorage.
- Crear: `frontend/src/components/ErrorBoundary.tsx`.
- Modificar: `SkillCard/AgentCard` + modales — botón **Desinstalar**; badge "instalada en N IAs".
- Backend: endpoints `DELETE /skills-sh/:slug` (usa `npx skills remove`) y `DELETE /agents/:name`; endpoint `/api/installed` que reporta, por skill, en qué IAs está.
- Modificar: `frontend/src/App.tsx` — code-splitting: `VideoStudio` con `React.lazy`.

**Tareas:**
1. `ErrorBoundary` global + pantalla de "backend no disponible, reintentando" ligada al `/health` de P0.
2. Desinstalar skill (todas las IAs) y agente; refrescar vía SSE.
3. Indicador por skill de IAs donde está instalada (reusar detección de `~/.agents/skills` + symlinks).
4. Persistir `tab`, `search`, `categoryFilter` en la URL (querystring) para recargar sin perder estado.
5. `React.lazy` para Video Studio y modales pesados; reduce el bundle inicial.

**Criterio de aceptación:**
- Se puede instalar y desinstalar desde la UI y el contador refleja el cambio.
- Recargar mantiene búsqueda y filtros.
- Con el backend caído, la UI explica qué pasa en vez de mostrar 0 sin contexto.

---

## FASE P4 — Datos, catálogo y rendimiento (MEDIA)

**Por qué:** el catálogo depende de GitHub sin token (60 req/h) y la traducción es falsa.

**Archivos:**
- Modificar: `agents-sh-scanner.js`, `skills-sh-scanner.js` — soporte de `GITHUB_TOKEN` opcional; backoff ante 403/429.
- Modificar: `translator.js` — traducción real opcional (ya está `@vitalets/google-translate-api` en deps) con caché en disco; si no, etiquetar claramente como "descripción por categoría".
- Crear: capa de caché persistente con TTL y `ETag`/`If-None-Match` para las llamadas a GitHub.

**Tareas:**
1. Leer `GITHUB_TOKEN` de env o de un ajuste en la app; añadirlo a los headers de las llamadas a la API de GitHub.
2. Manejar rate-limit (leer `X-RateLimit-Remaining`, backoff, servir caché).
3. Traducción real con caché (`~/.config/opencode/translations-cache.json`) para descripciones EN→ES; fallback al método por plantilla.

**Criterio de aceptación:**
- Con token configurado, refrescar el catálogo varias veces no agota la cuota.
- Las descripciones en español dejan de ser idénticas por categoría (o se etiquetan honestamente).

---

## FASE P5 — Distribución, releases y auto-update reales (MEDIA)

**Por qué:** el release es manual y el instalador dio el error del acceso directo. Comercialmente necesitas updates automáticos fiables.

**Archivos:**
- Crear: `.github/workflows/release.yml` — build + `electron-builder --publish always` en cada tag `v*`.
- Modificar: `package.json` (`build.nsis`) — revisar `runAfterFinish`, shortcuts, y `oneClick`.
- Crear: `CHANGELOG.md` + automatización de notas de versión.
- Considerar: firma de código (certificado) para evitar SmartScreen — requisito real para distribución masiva.

**Tareas:**
1. Workflow de GitHub Actions que compile en Windows runner y publique el instalador + `latest.yml` al release.
2. Ajustar NSIS para eliminar el error del acceso directo (probar `runAfterFinish:false` o crear el `.lnk` antes del finish).
3. Documentar/planear firma de código (DigiCert/SSL.com o certificado EV) — sin firma, Windows marca la app como no confiable.
4. Probar el ciclo completo: publicar `v1.0.26`, y que una instalación previa se auto-actualice.

**Criterio de aceptación:**
- Un `git tag v1.0.26 && push` produce un release publicado automáticamente.
- El auto-updater actualiza una instalación previa sin intervención.

---

## FASE P6 — Onboarding, ajustes y persistencia de preferencias (MEDIA-BAJA)

**Por qué:** un producto comercial necesita configuración visible y primer arranque guiado.

**Archivos:**
- Crear: `frontend/src/components/SettingsModal.tsx` — puerto, `GITHUB_TOKEN`, idioma por defecto, activar/desactivar Remotion/run, rutas de escaneo.
- Crear: backend `routes/settings.js` + persistencia en `~/.config/skillnexus/settings.json`.
- Modificar: `config.js` — leer rutas de escaneo desde settings (hoy están hardcodeadas a `curso-opencode`).

**Tareas:**
1. Panel de ajustes con persistencia; las rutas de escaneo dejan de estar hardcodeadas (hoy `Documents/curso-opencode` es específico de tu máquina).
2. Detección automática de IAs instaladas para mostrarlas en ajustes.
3. Onboarding en primer arranque (el intro.mp4 ya existe; integrarlo al primer run, no solo al Help).

**Criterio de aceptación:**
- Otro usuario en otra PC puede usar la app sin editar código (las rutas `curso-opencode` no deben ser obligatorias).
- Los ajustes persisten entre reinicios.

---

## FASE P7 — Modelo comercial: licencias y monetización (COMERCIAL)

**Por qué:** para "100% comercial" hace falta una vía de ingreso y control de acceso.

**Opciones a decidir (requieren tu input de negocio):**
- **Freemium:** funciones base gratis; pro (instalación masiva, traducción real, Video Studio, soporte) por licencia.
- **Licencia por clave:** activación offline/online con clave firmada (JWT/ed25519 verificado en cliente).
- **Suscripción:** requiere backend en la nube (Supabase ya disponible en tu entorno) para validar y gestionar cuentas.

**Archivos (si se elige licencia por clave):**
- Crear: `backend/routes/license.js` — validación de clave firmada.
- Crear: `frontend/src/components/LicenseModal.tsx`.
- Backend en la nube (Supabase): tabla `licenses`, edge function de validación/activación.

**Tareas:**
1. Definir el modelo (freemium vs suscripción) — decisión de negocio.
2. Implementar gating de features "pro" detrás de licencia válida.
3. (Si nube) usar Supabase para cuentas, licencias y telemetría de activaciones.

**Criterio de aceptación:**
- Las features pro se bloquean sin licencia válida y se desbloquean con una clave legítima.

---

## FASE P8 — Observabilidad, soporte y legal (COMERCIAL)

**Por qué:** producto comercial = telemetría opt-in, reporte de errores, y cobertura legal.

**Archivos:**
- Crear: integración de crash/error reporting (Sentry para Electron) — opt-in.
- Crear: `PRIVACY.md`, `TERMS.md`, `LICENSE` (elegir licencia comercial/EULA).
- Crear: telemetría anónima opt-in (qué skills se instalan más, errores comunes) — con consentimiento explícito.
- Docs: `README` comercial, sitio/landing, guía de usuario.

**Tareas:**
1. Sentry (o similar) con consentimiento; capturar `uncaughtException` de P0.
2. EULA + política de privacidad (obligatorio si hay telemetría/cuentas).
3. Telemetría anónima opt-in con panel de "qué recopilamos".
4. Landing page y documentación de usuario final.

**Criterio de aceptación:**
- El usuario acepta explícitamente antes de enviar cualquier dato.
- Los crashes llegan a un dashboard para poder soportar el producto.

---

## Decisiones de negocio que necesito de ti (bloquean P7–P8)

1. **Modelo de monetización:** ¿freemium, licencia de pago única, o suscripción?
2. **Backend en la nube:** ¿usamos Supabase (ya lo tienes) para cuentas/licencias, o todo offline?
3. **Firma de código:** ¿inviertes en certificado (evita alertas de Windows) o distribución sin firmar por ahora?
4. **Alcance de plataformas:** ¿solo Windows, o también macOS/Linux (afecta empaquetado y firma)?

---

## Orden de ejecución recomendado

```
P0 (estabilidad) ─┬─> P1 (seguridad) ─> P2 (tests/refactor) ─┬─> P3 (UX) ─> P4 (datos)
                  │                                          │
                  └──────────────────────────────────────────┴─> P5 (releases)
P6 (ajustes) depende de P2/P3.
P7 (licencias) y P8 (legal/telemetría) son la capa comercial final; requieren tus decisiones de negocio.
```

**Recomendación:** ejecutar P0→P2 de corrido (fundacional, bajo riesgo, alto impacto), sacar un release estable, y luego decidir el modelo comercial antes de P7–P8.

---

## Cómo ejecutar una fase

Cuando elijas una fase, pídeme "genera el plan detallado de PX" y produciré el plan bite-sized con TDD (pasos de 2–5 min, tests primero, commits frecuentes) usando la skill `superpowers:writing-plans`, listo para ejecutar con subagentes o inline.
