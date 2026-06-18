import { type FormEvent, useEffect, useState } from 'react';
import type { Tracker, Vehicle } from '@vehiclelinq/shared';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { api } from '@/lib/api';
import { usePlatformContext } from '@/hooks/usePlatformContext';

export function TrackersPage() {
  const { accessToken, currentCompanyId } = usePlatformContext();
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
    <div className="page-shell">
      <PageHeader
        eyebrow="Trackers"
        title="Teltonika apparaten"
        description="Registreer nieuwe trackers en koppel ze direct aan voertuigen binnen de actieve tenant."
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="section-card">
          <h2 className="text-lg font-semibold text-slate-900">Nieuwe tracker</h2>
          <form className="mt-4 space-y-4" onSubmit={handleCreate}>
            <input
              value={imei}
              onChange={(event) => {
                setImei(event.target.value.replace(/\s+/g, ''));
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              placeholder="IMEI"
              className="form-control"
            />
            <select
              value={model}
              onChange={(event) => {
                setModel(event.target.value as Tracker['model']);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="form-select"
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
              className="form-select"
            >
              <option value="">Nog niet koppelen</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name} ({vehicle.plateNumber})
                </option>
              ))}
            </select>
            {errorMessage ? <p className="alert-error">{errorMessage}</p> : null}
            {successMessage ? <p className="alert-success">{successMessage}</p> : null}
            <button type="submit" disabled={!currentCompanyId || isCreating} className="btn-primary w-full">
              <Plus className="h-4 w-4" />
              {isCreating ? 'Tracker wordt toegevoegd...' : 'Tracker toevoegen'}
            </button>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {loading ? (
            <p className="empty-state md:col-span-2">
              Trackers worden geladen...
            </p>
          ) : trackers.length === 0 ? (
            <p className="empty-state md:col-span-2">
              Er zijn nog geen trackers voor dit bedrijf.
            </p>
          ) : (
            trackers.map((tracker) => {
              const linkedVehicle = vehicles.find((vehicle) => vehicle.id === tracker.vehicleId);

              return (
                <article key={tracker.id} className="list-card">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{tracker.model}</p>
                  <h2 className="mt-3 text-lg font-semibold text-slate-900">{tracker.imei}</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Voertuig:{' '}
                    {linkedVehicle ? `${linkedVehicle.name} (${linkedVehicle.plateNumber})` : 'Niet gekoppeld'}
                  </p>
                  <span className="status-badge status-badge-success mt-4">
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
