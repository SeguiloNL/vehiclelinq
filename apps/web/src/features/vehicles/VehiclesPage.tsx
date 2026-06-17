import { type FormEvent, useEffect, useState } from 'react';
import type { Vehicle } from '@vehiclelinq/shared';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { usePlatformContext } from '@/hooks/usePlatformContext';
import { CompanySelector } from '@/components/CompanySelector';

export function VehiclesPage() {
  const { accessToken, companies, currentCompanyId, setCurrentCompanyId } = usePlatformContext();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [name, setName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !currentCompanyId) {
      setVehicles([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setErrorMessage(null);

    api
      .vehicles(accessToken, currentCompanyId)
      .then((nextVehicles) => {
        if (!cancelled) {
          setVehicles(nextVehicles);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Voertuigen laden mislukt.');
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

    const trimmedName = name.trim();
    const trimmedPlateNumber = plateNumber.trim().toUpperCase();

    if (!trimmedName || !trimmedPlateNumber) {
      setErrorMessage('Vul zowel een naam als kenteken in.');
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const vehicle = await api.createVehicle(accessToken, currentCompanyId, {
        name: trimmedName,
        plateNumber: trimmedPlateNumber,
      });

      setVehicles((current) => [...current, vehicle].sort((left, right) => left.name.localeCompare(right.name)));
      setName('');
      setPlateNumber('');
      setSuccessMessage(`Voertuig "${vehicle.name}" is toegevoegd.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Voertuig aanmaken mislukt.');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
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

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[32px] border border-white/10 bg-slate-950/70 p-6">
          <h2 className="text-lg font-semibold text-white">Nieuw voertuig</h2>
          <form className="mt-4 space-y-4" onSubmit={handleCreate}>
            <input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              placeholder="Voertuignaam"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
            />
            <input
              value={plateNumber}
              onChange={(event) => {
                setPlateNumber(event.target.value.toUpperCase());
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              placeholder="Kenteken"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
            />
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
              {isCreating ? 'Voertuig wordt toegevoegd...' : 'Voertuig toevoegen'}
            </button>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {loading ? (
            <p className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-slate-400 md:col-span-2">
              Voertuigen worden geladen...
            </p>
          ) : vehicles.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-slate-400 md:col-span-2">
              Er zijn nog geen voertuigen voor dit bedrijf.
            </p>
          ) : (
            vehicles.map((vehicle) => (
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
            ))
          )}
        </div>
      </section>
    </div>
  );
}
