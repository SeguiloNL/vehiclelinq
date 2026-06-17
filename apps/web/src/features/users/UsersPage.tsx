import { type FormEvent, useEffect, useState } from 'react';
import { PLATFORM_ROLES, type UserAccount } from '@vehiclelinq/shared';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { CompanySelector } from '@/components/CompanySelector';
import { usePlatformContext } from '@/hooks/usePlatformContext';
import { useSessionStore } from '@/store/session';

export function UsersPage() {
  const { accessToken, companies, currentCompanyId, setCurrentCompanyId } = usePlatformContext();
  const currentUser = useSessionStore((state) => state.user);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserAccount['role']>('company_admin');
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const availableRoles =
    currentUser?.role === 'superadmin'
      ? PLATFORM_ROLES
      : PLATFORM_ROLES.filter((candidateRole) => candidateRole !== 'superadmin');

  useEffect(() => {
    if (!accessToken || !currentCompanyId) {
      setUsers([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setErrorMessage(null);

    api
      .users(accessToken, currentCompanyId)
      .then((nextUsers) => {
        if (!cancelled) {
          setUsers(nextUsers);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Gebruikers laden mislukt.');
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

  useEffect(() => {
    if (!availableRoles.includes(role)) {
      setRole(availableRoles[0] ?? 'viewer');
    }
  }, [availableRoles, role]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken || !currentCompanyId) {
      setErrorMessage('Selecteer eerst een bedrijf.');
      return;
    }

    const trimmedDisplayName = displayName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedDisplayName || !trimmedEmail || !password.trim()) {
      setErrorMessage('Vul naam, e-mailadres en wachtwoord in.');
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const user = await api.createUser(accessToken, currentCompanyId, {
        displayName: trimmedDisplayName,
        email: trimmedEmail,
        password,
        role,
      });

      setUsers((current) =>
        [...current, user].sort((left, right) => left.displayName.localeCompare(right.displayName)),
      );
      setDisplayName('');
      setEmail('');
      setPassword('');
      setRole(availableRoles[0] ?? 'viewer');
      setSuccessMessage(`Gebruiker "${user.displayName}" is toegevoegd.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Gebruiker aanmaken mislukt.');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
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

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[32px] border border-white/10 bg-slate-950/70 p-6">
          <h2 className="text-lg font-semibold text-white">Nieuwe gebruiker</h2>
          <form className="mt-4 space-y-4" onSubmit={handleCreate}>
            <input
              value={displayName}
              onChange={(event) => {
                setDisplayName(event.target.value);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              placeholder="Volledige naam"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
            />
            <input
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              placeholder="E-mailadres"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              placeholder="Tijdelijk wachtwoord"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
            />
            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value as UserAccount['role']);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
            >
              {availableRoles.map((candidateRole) => (
                <option key={candidateRole} value={candidateRole}>
                  {candidateRole}
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
              {isCreating ? 'Gebruiker wordt toegevoegd...' : 'Gebruiker toevoegen'}
            </button>
          </form>
        </div>

        <div className="space-y-3">
          {loading ? (
            <p className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-slate-400">
              Gebruikers worden geladen...
            </p>
          ) : users.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-slate-400">
              Er zijn nog geen gebruikers voor dit bedrijf.
            </p>
          ) : (
            users.map((user) => (
              <article key={user.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{user.displayName}</h2>
                    <p className="text-sm text-slate-400">{user.email}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                    {user.role}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
