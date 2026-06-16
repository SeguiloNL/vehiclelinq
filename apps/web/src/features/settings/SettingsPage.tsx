import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '@/lib/api';
import { useSessionStore } from '@/store/session';
import type { PlatformSettingsView } from './types';

export function SettingsPage() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const [settings, setSettings] = useState<PlatformSettingsView | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    api.platformSettings(accessToken).then(setSettings);
  }, [accessToken]);

  async function handleSave() {
    if (!accessToken || !settings) {
      return;
    }

    const next = await api.updatePlatformSettings(accessToken, settings);
    setSettings(next);
  }

  if (!settings) {
    return <div className="text-slate-400">Instellingen laden...</div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Instellingen</p>
        <h1 className="mt-2 font-serif text-4xl text-white">Platformconfiguratie</h1>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-slate-400">
          Tile URL
          <input
            value={settings.mapTileUrl}
            onChange={(event) =>
              setSettings((current) =>
                current ? { ...current, mapTileUrl: event.target.value } : current,
              )
            }
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
          />
        </label>
        <label className="text-sm text-slate-400">
          Attributie
          <input
            value={settings.mapAttribution}
            onChange={(event) =>
              setSettings((current) =>
                current ? { ...current, mapAttribution: event.target.value } : current,
              )
            }
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
          />
        </label>
        <label className="text-sm text-slate-400">
          Retentie in maanden
          <input
            type="number"
            value={settings.telemetryRetentionMonths}
            onChange={(event) =>
              setSettings((current) =>
                current
                  ? {
                      ...current,
                      telemetryRetentionMonths: Number(event.target.value),
                    }
                  : current,
              )
            }
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="flex items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950"
      >
        <Save className="h-4 w-4" />
        Instellingen opslaan
      </button>
    </div>
  );
}
