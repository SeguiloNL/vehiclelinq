import { type FormEvent, useEffect, useState } from 'react';
import type { Tracker, Vehicle } from '@vehiclelinq/shared';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { usePlatformContext } from '@/hooks/usePlatformContext';
import { CompanySelector } from '@/components/CompanySelector';

export function TrackersPage() {
  const { accessToken, companies, currentCompanyId, setCurrentCompanyId } = usePlatformContext();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [imei, setImei] = useState('');
  const [model, setModel] = useState<Tracker['model']>('FMC130');
  const [vehicleId, setVehicleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !currentCompanyId) {
      setTrackers([]);
      setVehicles([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setErrorMessage(null);

    Promise.all([
      api.trackers(accessToken, currentCompanyId),
      api.vehicles(accessToken, currentCompanyId),
    ])
      .then(([nextTrackers, nextVehicles]) => {
        if (!cancelled) {
          setTrackers(nextTrackers);
          setVehicles(nextVehicles);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Trackers laden mislukt.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, currentCompanyId]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken || !currentCompanyId) {
      setErrorMessage('Selecteer eerst een bedrijf.');
      return;
    }

    const trimmedImei = imei.trim();
    if (!trimmedImei) {
      setErrorMessage('Vul een IMEI in.');
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const tracker = await api.createTracker(accessToken, currentCompanyId, {
        imei: trimmedImei,
        model,
        vehicleId: vehicleId || null,
      });

      setTrackers((current) => [tracker, ...current]);
      setImei('');
      setModel('FMC130');
      setVehicleId('');
      setSuccessMessage(`Tracker ${tracker.imei} is toegevoegd.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Tracker aanmaken mislukt.');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
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

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[32px] border border-white/10 bg-slate-950/70 p-6">
          <h2 className="text-lg font-semibold text-white">Nieuwe tracker</h2>
          <form className="mt-4 space-y-4" onSubmit={handleCreate}>
            <input
              value={imei}
              onChange={(event) => {
                setImei(event.target.value.replace(/\s+/g, ''));
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              placeholder="IMEI"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
            />
            <select
              value={model}
              onChange={(event) => {
                setModel(event.target.value as Tracker['model']);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
            >
              <option value="FMC130">Teltonika FMC130</option>
              <option value="FMC150">Teltonika FMC150</option>
              <option value="FMC650">Teltonika FMC650</option>
            </select>
            <select
              value={vehicleId}
              onChange={(event) => {
                setVehicleId(event.target.value);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
            >
              <option value="">Nog niet koppelen</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name} ({vehicle.plateNumber})
                </option>
              ))}
            </select>
            {errorMessage ? (
              <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {errorMessage}
              </p>
            ) : null}
            {successMessage ? (
              <p className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                {successMessage}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={!currentCompanyId || isCreating}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {isCreating ? 'Tracker wordt toegevoegd...' : 'Tracker toevoegen'}
            </button>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {loading ? (
            <p className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-slate-400 md:col-span-2">
              Trackers worden geladen...
            </p>
          ) : trackers.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-slate-400 md:col-span-2">
              Er zijn nog geen trackers voor dit bedrijf.
            </p>
          ) : (
            trackers.map((tracker) => {
              const linkedVehicle = vehicles.find((vehicle) => vehicle.id === tracker.vehicleId);

              return (
                <article key={tracker.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{tracker.model}</p>
                  <h2 className="mt-3 text-lg font-semibold text-white">{tracker.imei}</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Voertuig:{' '}
                    {linkedVehicle ? `${linkedVehicle.name} (${linkedVehicle.plateNumber})` : 'Niet gekoppeld'}
                  </p>
                  <span className="mt-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-300">
                    {tracker.status}
                  </span>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
