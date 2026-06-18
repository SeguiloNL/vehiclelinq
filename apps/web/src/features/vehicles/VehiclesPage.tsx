import { type FormEvent, useEffect, useState } from 'react';
import type { Vehicle } from '@vehiclelinq/shared';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { api } from '@/lib/api';
import { usePlatformContext } from '@/hooks/usePlatformContext';

export function VehiclesPage() {
  const { accessToken, currentCompanyId } = usePlatformContext();
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
    <div className="page-shell">
      <PageHeader
        eyebrow="Voertuigen"
        title="Vlootoverzicht"
        description="Beheer voertuigen binnen de actieve tenant en voeg nieuwe assets toe aan de vloot."
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="section-card">
          <h2 className="text-lg font-semibold text-slate-900">Nieuw voertuig</h2>
          <form className="mt-4 space-y-4" onSubmit={handleCreate}>
            <input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              placeholder="Voertuignaam"
              className="form-control"
            />
            <input
              value={plateNumber}
              onChange={(event) => {
                setPlateNumber(event.target.value.toUpperCase());
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              placeholder="Kenteken"
              className="form-control"
            />
            {errorMessage ? <p className="alert-error">{errorMessage}</p> : null}
            {successMessage ? <p className="alert-success">{successMessage}</p> : null}
            <button type="submit" disabled={!currentCompanyId || isCreating} className="btn-primary w-full">
              <Plus className="h-4 w-4" />
              {isCreating ? 'Voertuig wordt toegevoegd...' : 'Voertuig toevoegen'}
            </button>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {loading ? (
            <p className="empty-state md:col-span-2">
              Voertuigen worden geladen...
            </p>
          ) : vehicles.length === 0 ? (
            <p className="empty-state md:col-span-2">
              Er zijn nog geen voertuigen voor dit bedrijf.
            </p>
          ) : (
            vehicles.map((vehicle) => (
              <article key={vehicle.id} className="list-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{vehicle.name}</h2>
                    <p className="text-sm text-slate-500">{vehicle.plateNumber}</p>
                  </div>
                  <span className="status-badge status-badge-neutral">
                    {vehicle.status}
                  </span>
                </div>
                <p className="mt-4 text-sm text-slate-500">
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
