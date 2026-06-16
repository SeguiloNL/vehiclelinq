import { useEffect, useMemo, useState } from 'react';
import type { DashboardResponse } from '@vehiclelinq/shared';
import { CompanySelector } from '@/components/CompanySelector';
import { usePlatformContext } from '@/hooks/usePlatformContext';
import { api } from '@/lib/api';
import { MapPanel } from '@/lib/maps/MapPanel';

export function DashboardPage() {
  const { accessToken, companies, currentCompanyId, setCurrentCompanyId, loading } =
    usePlatformContext();
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
    return <div className="animate-pulse text-slate-400">Context laden...</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Live kaart</p>
          <h1 className="mt-2 font-serif text-4xl text-white">Voertuigen en actuele status</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Bekijk live voertuigposities, trackerstatus en moduletoegang binnen de actieve tenant.
          </p>
        </div>
        <CompanySelector
          companies={companies}
          value={currentCompanyId}
          onChange={setCurrentCompanyId}
        />
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ['Voertuigen', data?.vehicles.length ?? 0],
          ['Live online', data?.liveStates.filter((state) => state.online).length ?? 0],
          ['Trackers actief', data?.trackers.filter((tracker) => tracker.status === 'active').length ?? 0],
          ['Modules actief', data?.modules.filter((module) => module.enabled).length ?? 0],
        ].map(([label, value]) => (
          <article key={label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-4 text-4xl font-semibold text-white">{value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_0.8fr]">
        <div className="rounded-[32px] border border-white/10 bg-slate-950/70 p-4">
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
              <article
                key={vehicle.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{vehicle.name}</h2>
                    <p className="text-sm text-slate-400">{vehicle.plateNumber}</p>
                  </div>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-300">
                    {vehicle.status}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
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
        </div>
      </section>
    </div>
  );
}
