import { useEffect, useMemo, useState } from 'react';
import type { DashboardResponse } from '@vehiclelinq/shared';
import { PageHeader } from '@/components/PageHeader';
import { usePlatformContext } from '@/hooks/usePlatformContext';
import { api } from '@/lib/api';
import { MapPanel } from '@/lib/maps/MapPanel';

export function DashboardPage() {
  const { accessToken, currentCompanyId, loading } = usePlatformContext();
  const [data, setData] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    if (!accessToken || !currentCompanyId) {
      return;
    }

    api.dashboard(accessToken, currentCompanyId).then(setData);
  }, [accessToken, currentCompanyId]);

  const mapCenter = useMemo<[number, number]>(() => {
    const firstState = data?.liveStates[0];
    return firstState ? [firstState.lng, firstState.lat] : [4.9041, 52.3676];
  }, [data]);

  if (loading) {
    return <div className="animate-pulse text-slate-500">Context laden...</div>;
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Dashboard"
        title="Voertuigen en actuele status"
        description="Bekijk live voertuigposities, trackerstatus en moduletoegang binnen de actieve tenant."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Voertuigen', data?.vehicles.length ?? 0],
          ['Live online', data?.liveStates.filter((state) => state.online).length ?? 0],
          ['Trackers actief', data?.trackers.filter((tracker) => tracker.status === 'active').length ?? 0],
          ['Modules actief', data?.modules.filter((module) => module.enabled).length ?? 0],
        ].map(([label, value]) => (
          <article key={label} className="metric-card">
            <p className="metric-label">{label}</p>
            <p className="metric-value">{value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.65fr_0.85fr]">
        <div className="section-card p-4">
          <MapPanel
            tileUrl="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
            center={mapCenter}
            zoom={7}
            liveStates={data?.liveStates}
          />
        </div>

        <div className="space-y-4">
          {data?.vehicles.map((vehicle) => {
            const liveState = data.liveStates.find((state) => state.vehicleId === vehicle.id);

            return (
              <article key={vehicle.id} className="list-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{vehicle.name}</h2>
                    <p className="text-sm text-slate-500">{vehicle.plateNumber}</p>
                  </div>
                  <span className="status-badge status-badge-success">
                    {vehicle.status}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div>
                    <dt className="text-slate-500">Snelheid</dt>
                    <dd>{liveState?.speedKph ?? 0} km/u</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Ignition</dt>
                    <dd>{liveState?.ignition ? 'Aan' : 'Uit'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Tracker</dt>
                    <dd>{liveState?.trackerImei ?? 'Niet gekoppeld'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Laatste ping</dt>
                    <dd>{liveState?.recordedAt ? new Date(liveState.recordedAt).toLocaleString() : '-'}</dd>
                  </div>
                </dl>
              </article>
            );
          })}

          {data && data.vehicles.length === 0 ? (
            <p className="empty-state">Er zijn nog geen voertuigen beschikbaar voor de actieve tenant.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
