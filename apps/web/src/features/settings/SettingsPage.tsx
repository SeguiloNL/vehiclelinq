import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
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
    return <div className="text-slate-500">Instellingen laden...</div>;
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Instellingen"
        title="Platformconfiguratie"
        description="Pas kaart- en retentie-instellingen aan voor het platform."
      />

      <div className="section-card">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-600">
            Tile URL
            <input
              value={settings.mapTileUrl}
              onChange={(event) =>
                setSettings((current) =>
                  current ? { ...current, mapTileUrl: event.target.value } : current,
                )
              }
              className="form-control mt-2"
            />
          </label>
          <label className="text-sm font-medium text-slate-600">
            Attributie
            <input
              value={settings.mapAttribution}
              onChange={(event) =>
                setSettings((current) =>
                  current ? { ...current, mapAttribution: event.target.value } : current,
                )
              }
              className="form-control mt-2"
            />
          </label>
          <label className="text-sm font-medium text-slate-600">
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
              className="form-control mt-2"
            />
          </label>
        </div>

        <button type="button" onClick={handleSave} className="btn-primary mt-6">
          <Save className="h-4 w-4" />
          Instellingen opslaan
        </button>
      </div>
    </div>
  );
}
