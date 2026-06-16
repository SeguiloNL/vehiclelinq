import { useEffect, useState } from 'react';
import type { Tracker } from '@vehiclelinq/shared';
import { api } from '@/lib/api';
import { usePlatformContext } from '@/hooks/usePlatformContext';
import { CompanySelector } from '@/components/CompanySelector';

export function TrackersPage() {
  const { accessToken, companies, currentCompanyId, setCurrentCompanyId } = usePlatformContext();
  const [trackers, setTrackers] = useState<Tracker[]>([]);

  useEffect(() => {
    if (!accessToken || !currentCompanyId) {
      return;
    }

    api.trackers(accessToken, currentCompanyId).then(setTrackers);
  }, [accessToken, currentCompanyId]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Trackers</p>
          <h1 className="mt-2 font-serif text-4xl text-white">Teltonika apparaten</h1>
        </div>
        <CompanySelector
          companies={companies}
          value={currentCompanyId}
          onChange={setCurrentCompanyId}
        />
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {trackers.map((tracker) => (
          <article key={tracker.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{tracker.model}</p>
            <h2 className="mt-3 text-lg font-semibold text-white">{tracker.imei}</h2>
            <p className="mt-2 text-sm text-slate-400">Voertuig: {tracker.vehicleId ?? 'Niet gekoppeld'}</p>
            <span className="mt-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-300">
              {tracker.status}
            </span>
          </article>
        ))}
      </div>
    </div>
  );
}
