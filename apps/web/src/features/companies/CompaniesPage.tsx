import { useEffect, useState } from 'react';
import type { Company } from '@vehiclelinq/shared';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { usePlatformContext } from '@/hooks/usePlatformContext';

export function CompaniesPage() {
  const { accessToken, companies, setCurrentCompanyId } = usePlatformContext();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [items, setItems] = useState<Company[]>(companies);

  useEffect(() => {
    setItems(companies);
  }, [companies]);

  async function handleCreate() {
    if (!accessToken || !name || !slug) {
      return;
    }

    const company = await api.createCompany(accessToken, { name, slug });
    setItems((current) => [...current, company]);
    setCurrentCompanyId(company.id);
    setName('');
    setSlug('');
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
            {items.map((company) => (
              <article
                key={company.id}
                className="rounded-3xl border border-white/10 bg-slate-950/70 p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg text-white">{company.name}</h3>
                    <p className="text-sm text-slate-400">{company.slug}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentCompanyId(company.id)}
                    className="rounded-2xl border border-cyan-400/30 px-4 py-2 text-sm text-cyan-300 transition hover:bg-cyan-400/10"
                  >
                    Activeren
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-slate-950/70 p-6">
          <h2 className="text-lg font-semibold text-white">Nieuw bedrijf</h2>
          <div className="mt-4 space-y-4">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Bedrijfsnaam"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
            />
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="Slug"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
            />
            <button
              type="button"
              onClick={handleCreate}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950"
            >
              <Plus className="h-4 w-4" />
              Bedrijf toevoegen
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
