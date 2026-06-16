import { useEffect, useState } from 'react';
import type { Vehicle, VehicleHistoryResponse } from '@vehiclelinq/shared';
import { api } from '@/lib/api';
import { CompanySelector } from '@/components/CompanySelector';
import { usePlatformContext } from '@/hooks/usePlatformContext';
import { MapPanel } from '@/lib/maps/MapPanel';

export function HistoryPage() {
  const { accessToken, companies, currentCompanyId, setCurrentCompanyId } = usePlatformContext();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [history, setHistory] = useState<VehicleHistoryResponse | null>(null);

  useEffect(() => {
    if (!accessToken || !currentCompanyId) {
      return;
    }

    api.vehicles(accessToken, currentCompanyId).then((items) => {
      setVehicles(items);
      if (!selectedVehicleId && items[0]) {
        setSelectedVehicleId(items[0].id);
      }
    });
  }, [accessToken, currentCompanyId, selectedVehicleId]);

  useEffect(() => {
    if (!accessToken || !currentCompanyId || !selectedVehicleId) {
      return;
    }

    const to = new Date().toISOString();
    const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    api.vehicleHistory(accessToken, currentCompanyId, selectedVehicleId, from, to).then(setHistory);
  }, [accessToken, currentCompanyId, selectedVehicleId]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Historie</p>
          <h1 className="mt-2 font-serif text-4xl text-white">Routes en replay</h1>
        </div>
        <CompanySelector
          companies={companies}
          value={currentCompanyId}
          onChange={setCurrentCompanyId}
        />
      </header>

      <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-5">
          <label className="block text-sm text-slate-400">
            Voertuig
            <select
              value={selectedVehicleId}
              onChange={(event) => setSelectedVehicleId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
            >
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id} className="bg-slate-950">
                  {vehicle.name}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-6 space-y-3">
            {history?.points.map((point) => (
              <article key={point.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-sm text-white">{new Date(point.recordedAt).toLocaleString()}</p>
                <p className="text-xs text-slate-400">
                  {point.lat.toFixed(5)}, {point.lng.toFixed(5)} · {point.speedKph} km/u
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-slate-950/70 p-4">
          <MapPanel
            tileUrl="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
            center={[4.9041, 52.3676]}
            zoom={7}
            historyPoints={history?.points}
          />
        </div>
      </div>
    </div>
  );
}
