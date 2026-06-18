import { useEffect, useState } from 'react';
import type { CompanyModuleState, ModuleDefinition } from '@vehiclelinq/shared';
import { PageHeader } from '@/components/PageHeader';
import { api } from '@/lib/api';
import { usePlatformContext } from '@/hooks/usePlatformContext';

export function ModulesPage() {
  const { accessToken, currentCompanyId } = usePlatformContext();
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
    <div className="page-shell">
      <PageHeader
        eyebrow="Modules"
        title="Feature flags per bedrijf"
        description="Activeer of deactiveer tenantmodules vanuit een uniforme beheerweergave."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {catalog.map((module) => {
          const companyState = companyModules.find((item) => item.moduleKey === module.key);
          const enabled = companyState?.enabled ?? module.defaultEnabled;

          return (
            <article key={module.key} className="list-card">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{module.category}</p>
              <h2 className="mt-3 text-lg font-semibold text-slate-900">{module.name}</h2>
              <p className="mt-2 text-sm text-slate-500">{module.description}</p>
              <button
                type="button"
                onClick={() => handleToggle(module.key, !enabled)}
                className={`mt-5 ${enabled ? 'btn-soft' : 'btn-primary'} px-4 py-2`}
              >
                {enabled ? 'Ingeschakeld' : 'Uitgeschakeld'}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
