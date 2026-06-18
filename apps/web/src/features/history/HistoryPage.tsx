import { useEffect, useState } from 'react';
import type { Vehicle, VehicleHistoryResponse } from '@vehiclelinq/shared';
import { PageHeader } from '@/components/PageHeader';
import { api } from '@/lib/api';
import { usePlatformContext } from '@/hooks/usePlatformContext';
import { MapPanel } from '@/lib/maps/MapPanel';

export function HistoryPage() {
  const { accessToken, currentCompanyId } = usePlatformContext();
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
    <div className="page-shell">
      <PageHeader
        eyebrow="Historie"
        title="Routes en replay"
        description="Bekijk recente routepunten en replay-gegevens voor voertuigen uit de actieve tenant."
      />

      <div className="grid gap-4 md:grid-cols-[0.82fr_1.18fr]">
        <div className="section-card">
          <label className="block text-sm font-medium text-slate-600">
            Voertuig
            <select
              value={selectedVehicleId}
              onChange={(event) => setSelectedVehicleId(event.target.value)}
              className="form-select mt-2"
            >
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-6 space-y-3">
            {history?.points.length ? (
              history.points.map((point) => (
                <article key={point.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(point.recordedAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">
                    {point.lat.toFixed(5)}, {point.lng.toFixed(5)} · {point.speedKph} km/u
                  </p>
                </article>
              ))
            ) : (
              <p className="empty-state">Er zijn nog geen routepunten beschikbaar voor dit voertuig.</p>
            )}
          </div>
        </div>

        <div className="section-card p-4">
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
