import { type FormEvent, useEffect, useState } from 'react';
import { PLATFORM_ROLES, type UserAccount } from '@vehiclelinq/shared';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { api } from '@/lib/api';
import { usePlatformContext } from '@/hooks/usePlatformContext';
import { useSessionStore } from '@/store/session';

export function UsersPage() {
  const { accessToken, currentCompanyId } = usePlatformContext();
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
    <div className="page-shell">
      <PageHeader
        eyebrow="Gebruikers"
        title="Toegang en rollen"
        description="Beheer gebruikers en wijs de juiste tenantrollen toe binnen de actieve context."
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="section-card">
          <h2 className="text-lg font-semibold text-slate-900">Nieuwe gebruiker</h2>
          <form className="mt-4 space-y-4" onSubmit={handleCreate}>
            <input
              value={displayName}
              onChange={(event) => {
                setDisplayName(event.target.value);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              placeholder="Volledige naam"
              className="form-control"
            />
            <input
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              placeholder="E-mailadres"
              className="form-control"
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
              className="form-control"
            />
            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value as UserAccount['role']);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="form-select"
            >
              {availableRoles.map((candidateRole) => (
                <option key={candidateRole} value={candidateRole}>
                  {candidateRole}
                </option>
              ))}
            </select>
            {errorMessage ? <p className="alert-error">{errorMessage}</p> : null}
            {successMessage ? <p className="alert-success">{successMessage}</p> : null}
            <button type="submit" disabled={!currentCompanyId || isCreating} className="btn-primary w-full">
              <Plus className="h-4 w-4" />
              {isCreating ? 'Gebruiker wordt toegevoegd...' : 'Gebruiker toevoegen'}
            </button>
          </form>
        </div>

        <div className="space-y-3">
          {loading ? (
            <p className="empty-state">
              Gebruikers worden geladen...
            </p>
          ) : users.length === 0 ? (
            <p className="empty-state">
              Er zijn nog geen gebruikers voor dit bedrijf.
            </p>
          ) : (
            users.map((user) => (
              <article key={user.id} className="list-card">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{user.displayName}</h2>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                  <span className="status-badge status-badge-neutral">
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
