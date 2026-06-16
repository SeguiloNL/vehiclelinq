import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, RadioTower, Route as RouteIcon } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="relative overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950 p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.25),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.85),transparent_45%)]" />
          <div className="relative z-10">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">VehicleLinq</p>
            <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-tight text-white">
              Multi-company fleet visibility voor live tracking, historie en modulaire groei.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-300">
              Beheer bedrijven, voertuigen, Teltonika-trackers en kaartinstellingen vanuit een
              self-hosted platform dat klaar is voor extra modules.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: RadioTower,
                  title: 'Teltonika ingest',
                  copy: 'Directe TCP/UDP ingest voor FMC130, FMC150 en FMC650.',
                },
                {
                  icon: RouteIcon,
                  title: 'Historie & replay',
                  copy: 'Bekijk routes, events en status op bedrijfsniveau.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Tenant security',
                  copy: 'Superadmin, company admins en viewers met duidelijke scoping.',
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur"
                >
                  <item.icon className="h-6 w-6 text-cyan-300" />
                  <h2 className="mt-4 text-lg font-semibold text-white">{item.title}</h2>
                  <p className="mt-2 text-sm text-slate-400">{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[40px] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Inloggen</p>
          <h2 className="mt-4 font-serif text-4xl text-white">Administrator toegang</h2>
          <p className="mt-3 text-sm text-slate-400">
            Gebruik de bootstrap-account of een bedrijfsaccount om het platform te openen.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">E-mailadres</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Wachtwoord</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Bezig met inloggen...' : 'Platform openen'}
            </button>
          </form>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
            Demo admin: `admin@example.com` / `ChangeMe123!`
          </div>
        </section>
      </div>
    </div>
  );
}
