import { useEffect, useState } from 'react';
import type { Vehicle } from '@vehiclelinq/shared';
import { api } from '@/lib/api';
import { usePlatformContext } from '@/hooks/usePlatformContext';
import { CompanySelector } from '@/components/CompanySelector';

export function VehiclesPage() {
  const { accessToken, companies, currentCompanyId, setCurrentCompanyId } = usePlatformContext();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    if (!accessToken || !currentCompanyId) {
      return;
    }

    api.vehicles(accessToken, currentCompanyId).then(setVehicles);
  }, [accessToken, currentCompanyId]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Voertuigen</p>
          <h1 className="mt-2 font-serif text-4xl text-white">Vlootoverzicht</h1>
        </div>
        <CompanySelector
          companies={companies}
          value={currentCompanyId}
          onChange={setCurrentCompanyId}
        />
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {vehicles.map((vehicle) => (
          <article key={vehicle.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">{vehicle.name}</h2>
                <p className="text-sm text-slate-400">{vehicle.plateNumber}</p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                {vehicle.status}
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Tracker-ID: {vehicle.trackerId ?? 'Nog niet gekoppeld'}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
