import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, RadioTower, Route as RouteIcon } from 'lucide-react';
import vehiclelinqLogo from '@/assets/vehiclelinq-logo.png';
import { api } from '@/lib/api';
import { useSessionStore } from '@/store/session';

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useSessionStore((state) => state.setSession);
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('ChangeMe123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const session = await api.login({ email, password });
      setSession(session);
      navigate('/dashboard');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Inloggen mislukt.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-10 text-slate-800">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="section-card flex flex-col justify-between overflow-hidden bg-slate-900 text-white">
          <div>
            <img
              src={vehiclelinqLogo}
              alt="VehicleLinQ"
              className="h-auto w-full max-w-[460px] object-contain"
            />
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white lg:text-5xl">
              Een centrale adminomgeving voor fleet visibility, historie en tenantbeheer.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-slate-300">
              Gebruik dezelfde beheerlaag voor bedrijven, voertuigen, Teltonika-trackers en
              platformmodules. De nieuwe interface volgt een heldere AdminKit-geinspireerde
              dashboardstructuur.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: RadioTower,
                title: 'Realtime ingest',
                copy: 'Beheer live tracking en trackerstatus vanuit een centrale werkruimte.',
              },
              {
                icon: RouteIcon,
                title: 'Historie',
                copy: 'Analyseer recente routes en kaartdata per bedrijf en voertuig.',
              },
              {
                icon: ShieldCheck,
                title: 'Toegang',
                copy: 'Stuur rollen, modules en tenantgrenzen vanuit een compacte adminshell.',
              },
            ].map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-800 bg-slate-800/80 p-5">
                <item.icon className="h-6 w-6 text-slate-200" />
                <h2 className="mt-4 text-lg font-semibold text-white">{item.title}</h2>
                <p className="mt-2 text-sm text-slate-400">{item.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-card flex items-center">
          <div className="mx-auto w-full max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Inloggen
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
              Administrator toegang
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              Gebruik de bootstrap-account of een bedrijfsaccount om het platform te openen.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-slate-600">
                <span className="mb-2 block">E-mailadres</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="form-control"
                />
              </label>
              <label className="block text-sm font-medium text-slate-600">
                <span className="mb-2 block">Wachtwoord</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="form-control"
                />
              </label>

              {error ? <div className="alert-error">{error}</div> : null}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Bezig met inloggen...' : 'Platform openen'}
              </button>
            </form>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Demo admin: `admin@example.com` / `ChangeMe123!`
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
