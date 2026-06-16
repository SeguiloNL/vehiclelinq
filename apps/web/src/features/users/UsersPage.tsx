import { useEffect, useState } from 'react';
import type { UserAccount } from '@vehiclelinq/shared';
import { api } from '@/lib/api';
import { CompanySelector } from '@/components/CompanySelector';
import { usePlatformContext } from '@/hooks/usePlatformContext';

export function UsersPage() {
  const { accessToken, companies, currentCompanyId, setCurrentCompanyId } = usePlatformContext();
  const [users, setUsers] = useState<UserAccount[]>([]);

  useEffect(() => {
    if (!accessToken || !currentCompanyId) {
      return;
    }

    api.users(accessToken, currentCompanyId).then(setUsers);
  }, [accessToken, currentCompanyId]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Gebruikers</p>
          <h1 className="mt-2 font-serif text-4xl text-white">Toegang en rollen</h1>
        </div>
        <CompanySelector
          companies={companies}
          value={currentCompanyId}
          onChange={setCurrentCompanyId}
        />
      </header>

      <div className="space-y-3">
        {users.map((user) => (
          <article key={user.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">{user.displayName}</h2>
                <p className="text-sm text-slate-400">{user.email}</p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                {user.role}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
