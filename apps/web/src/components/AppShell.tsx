import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  Building2,
  Gauge,
  LogOut,
  Map,
  Package2,
  Radio,
  Settings,
  Shield,
  Truck,
  Users,
} from 'lucide-react';
import { useSessionStore } from '@/store/session';

const navItems = [
  { to: '/companies', label: 'Bedrijven', icon: Building2 },
  { to: '/dashboard', label: 'Dashboard', icon: Map },
  { to: '/vehicles', label: 'Voertuigen', icon: Truck },
  { to: '/trackers', label: 'Trackers', icon: Radio },
  { to: '/history', label: 'Historie', icon: Gauge },
  { to: '/users', label: 'Gebruikers', icon: Users },
  { to: '/modules', label: 'Modules', icon: Package2 },
  { to: '/settings', label: 'Instellingen', icon: Settings },
];

export function AppShell() {
  const { clear, user } = useSessionStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-6 py-6">
        <aside className="flex w-72 flex-col rounded-[32px] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="font-serif text-2xl tracking-wide text-white">VehicleLinq</p>
              <p className="text-sm text-slate-400">Fleet visibility platform</p>
            </div>
          </Link>

          <div className="mt-8 space-y-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>

          <div className="mt-auto rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Actieve sessie</p>
            <p className="mt-2 text-lg font-semibold text-white">{user?.displayName ?? 'Onbekend'}</p>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <button
              type="button"
              onClick={clear}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-400 hover:text-cyan-300"
            >
              <LogOut className="h-4 w-4" />
              Uitloggen
            </button>
          </div>
        </aside>

        <main className="flex-1 rounded-[36px] border border-white/10 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
