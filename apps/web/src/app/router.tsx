import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { LoginPage } from '@/features/auth/LoginPage';
import { CompaniesPage } from '@/features/companies/CompaniesPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { HistoryPage } from '@/features/history/HistoryPage';
import { ModulesPage } from '@/features/modules/ModulesPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { TrackersPage } from '@/features/trackers/TrackersPage';
import { UsersPage } from '@/features/users/UsersPage';
import { VehiclesPage } from '@/features/vehicles/VehiclesPage';
import { useSessionStore } from '@/store/session';

function ProtectedRoutes() {
  const accessToken = useSessionStore((state) => state.accessToken);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/trackers" element={<TrackersPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/modules" element={<ModulesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export function AppRouter() {
  const accessToken = useSessionStore((state) => state.accessToken);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={accessToken ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
      </Routes>
      <ProtectedRoutes />
    </BrowserRouter>
  );
}
