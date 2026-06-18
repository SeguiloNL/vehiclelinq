import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Building2,
  ChevronRight,
  LayoutDashboard,
  Gauge,
  LogOut,
  Menu,
  Package2,
  Radio,
  Settings,
  Truck,
  Users,
  X,
} from 'lucide-react';
import vehiclelinqLogo from '@/assets/vehiclelinq-logo.png';
import { CompanySelector } from '@/components/CompanySelector';
import { usePlatformContext } from '@/hooks/usePlatformContext';
import { useSessionStore } from '@/store/session';

const navItems = [
  { to: '/companies', label: 'Bedrijven', icon: Building2 },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/vehicles', label: 'Voertuigen', icon: Truck },
  { to: '/trackers', label: 'Trackers', icon: Radio },
  { to: '/history', label: 'Historie', icon: Gauge },
  { to: '/users', label: 'Gebruikers', icon: Users },
  { to: '/modules', label: 'Modules', icon: Package2 },
  { to: '/settings', label: 'Instellingen', icon: Settings },
];

export function AppShell() {
  const location = useLocation();
  const { clear, user } = useSessionStore();
  const { companies, currentCompanyId, loading, setCurrentCompanyId } = usePlatformContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const currentNavItem = useMemo(
    () => navItems.find((item) => location.pathname.startsWith(item.to)) ?? navItems[1],
    [location.pathname],
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Navigatie sluiten"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
        />
      ) : null}

      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-slate-200 bg-slate-900 px-5 py-6 text-slate-200 transition-transform duration-200 lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <Link to="/dashboard" className="flex min-w-0 items-center">
              <img
                src={vehiclelinqLogo}
                alt="VehicleLinQ"
                className="h-auto w-full max-w-[220px] object-contain"
              />
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-300 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-800/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Ingelogd als
            </p>
            <p className="mt-2 text-base font-semibold text-white">
              {user?.displayName ?? 'Onbekende gebruiker'}
            </p>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>

          <nav className="mt-8 space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </span>
                <ChevronRight className="h-4 w-4 opacity-60" />
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-800/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Sessie
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Beheer bedrijven, voertuigen, trackers en modules vanuit een centrale admin-omgeving.
            </p>
            <button type="button" onClick={clear} className="btn-secondary mt-4 w-full border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800">
              <LogOut className="h-4 w-4" />
              Uitloggen
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Admin overzicht
                  </p>
                  <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                    {currentNavItem.label}
                  </h1>
                </div>
              </div>

              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <CompanySelector
                  companies={companies}
                  value={currentCompanyId}
                  onChange={setCurrentCompanyId}
                  disabled={loading}
                />
                <div className="hidden rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right text-sm shadow-sm sm:block">
                  <p className="font-semibold text-slate-900">{user?.displayName ?? 'Gebruiker'}</p>
                  <p className="text-slate-500">{user?.role ?? 'Geen rol'}</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1440px]">
              <Outlet />
            </div>
          </main>

          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <span>VehicleLinQ admin interface</span>
              <span>AdminKit-geinspireerde Tailwind layout</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
