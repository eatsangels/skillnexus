import { useEffect, useState } from "react";
import { fetchSettings, saveSettings } from "../api";

interface Props {
  onClose: () => void;
  onSaved?: () => void;
}

export default function SettingsModal({ onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [skillInstallDir, setSkillInstallDir] = useState("");
  const [hasToken, setHasToken] = useState(false);
  const [token, setToken] = useState("");
  const [settingsPath, setSettingsPath] = useState("");

  useEffect(() => {
    fetchSettings()
      .then((s) => {
        setSkillInstallDir(s.skillInstallDir || "");
        setHasToken(s.hasGithubToken);
        setSettingsPath(s.settingsPath || "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const patch: { skillInstallDir: string; githubToken?: string } = { skillInstallDir };
      // Solo enviar el token si el usuario escribió uno nuevo (no lo mostramos en claro).
      if (token.trim()) patch.githubToken = token.trim();
      await saveSettings(patch);
      setSaved(true);
      setToken("");
      setHasToken(hasToken || Boolean(patch.githubToken));
      onSaved?.();
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg bg-surface-900 border border-surface-700/50 rounded-2xl shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-surface-100">Ajustes</h2>
          <button onClick={onClose} className="text-surface-500 hover:text-surface-200 cursor-pointer text-xl leading-none">&times;</button>
        </div>

        {loading ? (
          <p className="text-sm text-surface-400">Cargando…</p>
        ) : (
          <>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">Carpeta de instalación local de skills</label>
              <input
                value={skillInstallDir}
                onChange={(e) => setSkillInstallDir(e.target.value)}
                className="w-full bg-surface-950 border border-surface-700 rounded-xl px-3 py-2 text-sm text-surface-200 font-mono"
                spellCheck={false}
              />
              <p className="text-[11px] text-surface-500">Copia local de referencia. Las skills se instalan globalmente en todas tus IAs de todos modos.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">Token de GitHub (opcional)</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={hasToken ? "•••••••• (guardado — escribe para reemplazar)" : "ghp_… sube el límite de la API a 5000/hora"}
                className="w-full bg-surface-950 border border-surface-700 rounded-xl px-3 py-2 text-sm text-surface-200 font-mono"
                spellCheck={false}
                autoComplete="off"
              />
              <p className="text-[11px] text-surface-500">Sube el límite de la API de GitHub de 60 a 5000 peticiones por hora al refrescar catálogos.</p>
            </div>

            {settingsPath && (
              <p className="text-[10px] text-surface-600 font-mono break-all">{settingsPath}</p>
            )}

            {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex items-center justify-end gap-2 pt-1">
              {saved && <span className="text-xs text-emerald-400">Guardado ✓</span>}
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
