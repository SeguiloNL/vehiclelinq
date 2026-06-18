import { type FormEvent, useEffect, useState } from 'react';
import type { Company } from '@vehiclelinq/shared';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { api } from '@/lib/api';
import { usePlatformContext } from '@/hooks/usePlatformContext';
import { useSessionStore } from '@/store/session';

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function CompaniesPage() {
  const { accessToken, companies, currentCompanyId, setCurrentCompanyId } = usePlatformContext();
  const setCompanies = useSessionStore((state) => state.setCompanies);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [items, setItems] = useState<Company[]>(companies);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setItems(companies);
  }, [companies]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const normalizedSlug = toSlug(slug || name);

    if (!accessToken) {
      setErrorMessage('Je sessie is verlopen. Log opnieuw in.');
      return;
    }

    if (!trimmedName || !normalizedSlug) {
      setErrorMessage('Vul een bedrijfsnaam en geldige slug in.');
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const company = await api.createCompany(accessToken, {
        name: trimmedName,
        slug: normalizedSlug,
      });
      const nextItems = [...items, company].sort((left, right) => left.name.localeCompare(right.name));

      setItems(nextItems);
      setCompanies(nextItems);
      setCurrentCompanyId(company.id);
      setName('');
      setSlug('');
      setSuccessMessage(`Bedrijf "${company.name}" is aangemaakt en geselecteerd.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Bedrijf aanmaken mislukt.');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Platform"
        title="Bedrijven beheren"
        description="Beheer tenants, kies de actieve context en maak nieuwe bedrijven aan."
      />

      <section className="grid gap-6 xl:grid-cols-[1fr_0.82fr]">
        <div className="section-card">
          <h2 className="text-lg font-semibold text-slate-900">Tenant overzicht</h2>
          <p className="mt-2 text-sm text-slate-500">
            Selecteer welk bedrijf je in het dashboard en de beheerpagina&apos;s wilt openen.
          </p>
          <div className="mt-4 space-y-3">
            {items.length === 0 ? (
              <p className="empty-state">Er zijn nog geen bedrijven beschikbaar.</p>
            ) : (
              items.map((company) => (
                <article key={company.id} className="table-like-row">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">{company.name}</h3>
                      <span
                        className={`status-badge ${
                          company.isActive ? 'status-badge-success' : 'status-badge-warning'
                        }`}
                      >
                        {company.isActive ? 'Beschikbaar' : 'Uitgeschakeld'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{company.slug}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentCompanyId(company.id)}
                    className="btn-secondary px-4 py-2"
                  >
                    {company.id === currentCompanyId ? 'Geselecteerd' : 'Selecteren'}
                  </button>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="section-card">
          <h2 className="text-lg font-semibold text-slate-900">Nieuw bedrijf</h2>
          <form className="mt-4 space-y-4" onSubmit={handleCreate}>
            <input
              value={name}
              onChange={(event) => {
                const nextName = event.target.value;
                setName(nextName);
                if (!slug) {
                  setSlug(toSlug(nextName));
                }
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              placeholder="Bedrijfsnaam"
              className="form-control"
            />
            <input
              value={slug}
              onChange={(event) => {
                setSlug(toSlug(event.target.value));
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              placeholder="Slug"
              className="form-control"
            />
            <p className="text-xs text-slate-500">
              Gebruik een korte slug zoals <span className="font-semibold text-slate-700">demo-logistics</span>.
            </p>
            {errorMessage ? <p className="alert-error">{errorMessage}</p> : null}
            {successMessage ? <p className="alert-success">{successMessage}</p> : null}
            <button type="submit" disabled={isCreating} className="btn-primary w-full">
              <Plus className="h-4 w-4" />
              {isCreating ? 'Bedrijf wordt aangemaakt...' : 'Bedrijf toevoegen'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
