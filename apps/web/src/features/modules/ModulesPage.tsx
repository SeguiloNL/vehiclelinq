import { useEffect, useState } from 'react';
import type { CompanyModuleState, ModuleDefinition } from '@vehiclelinq/shared';
import { api } from '@/lib/api';
import { usePlatformContext } from '@/hooks/usePlatformContext';
import { CompanySelector } from '@/components/CompanySelector';

export function ModulesPage() {
  const { accessToken, companies, currentCompanyId, setCurrentCompanyId } = usePlatformContext();
  const [catalog, setCatalog] = useState<ModuleDefinition[]>([]);
  const [companyModules, setCompanyModules] = useState<CompanyModuleState[]>([]);

  useEffect(() => {
    if (!accessToken || !currentCompanyId) {
      return;
    }

    api.moduleCatalog(accessToken).then((items) => setCatalog(items as ModuleDefinition[]));
    api.companyModules(accessToken, currentCompanyId).then(setCompanyModules);
  }, [accessToken, currentCompanyId]);

  async function handleToggle(moduleKey: string, enabled: boolean) {
    if (!accessToken || !currentCompanyId) {
      return;
    }

    const updated = await api.toggleModule(accessToken, currentCompanyId, moduleKey, enabled);
    setCompanyModules((current) => {
      const next = current.filter((item) => item.moduleKey !== updated.moduleKey);
      return [...next, updated];
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Modules</p>
          <h1 className="mt-2 font-serif text-4xl text-white">Feature flags per bedrijf</h1>
        </div>
        <CompanySelector
          companies={companies}
          value={currentCompanyId}
          onChange={setCurrentCompanyId}
        />
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {catalog.map((module) => {
          const companyState = companyModules.find((item) => item.moduleKey === module.key);
          const enabled = companyState?.enabled ?? module.defaultEnabled;

          return (
            <article key={module.key} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{module.category}</p>
              <h2 className="mt-3 text-lg font-semibold text-white">{module.name}</h2>
              <p className="mt-2 text-sm text-slate-400">{module.description}</p>
              <button
                type="button"
                onClick={() => handleToggle(module.key, !enabled)}
                className={`mt-5 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  enabled
                    ? 'bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20'
                    : 'bg-slate-950 text-slate-200 hover:bg-slate-800'
                }`}
              >
                {enabled ? 'Ingeschakeld' : 'Uitschakeld'}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
