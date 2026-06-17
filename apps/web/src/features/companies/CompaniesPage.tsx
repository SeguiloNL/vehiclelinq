import { type FormEvent, useEffect, useState } from 'react';
import type { Company } from '@vehiclelinq/shared';
import { Plus } from 'lucide-react';
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
      setSuccessMessage(`Bedrijf "${company.name}" is aangemaakt en geactiveerd.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Bedrijf aanmaken mislukt.');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Platform</p>
        <h1 className="mt-2 font-serif text-4xl text-white">Bedrijven beheren</h1>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">Tenant overzicht</h2>
          <div className="mt-4 space-y-3">
            {items.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-5 text-sm text-slate-400">
                Er zijn nog geen bedrijven beschikbaar.
              </p>
            ) : (
              items.map((company) => (
                <article
                  key={company.id}
                  className="rounded-3xl border border-white/10 bg-slate-950/70 p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg text-white">{company.name}</h3>
                      <p className="text-sm text-slate-400">{company.slug}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentCompanyId(company.id)}
                      className="rounded-2xl border border-cyan-400/30 px-4 py-2 text-sm text-cyan-300 transition hover:bg-cyan-400/10"
                    >
                      {company.id === currentCompanyId ? 'Actief' : 'Activeren'}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-slate-950/70 p-6">
          <h2 className="text-lg font-semibold text-white">Nieuw bedrijf</h2>
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
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
            />
            <input
              value={slug}
              onChange={(event) => {
                setSlug(toSlug(event.target.value));
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              placeholder="Slug"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
            />
            <p className="text-xs text-slate-500">
              Gebruik een korte slug zoals <span className="text-slate-300">demo-logistics</span>.
            </p>
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
              disabled={isCreating}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950"
            >
              <Plus className="h-4 w-4" />
              {isCreating ? 'Bedrijf wordt aangemaakt...' : 'Bedrijf toevoegen'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
