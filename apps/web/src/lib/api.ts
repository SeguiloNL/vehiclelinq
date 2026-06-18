import type {
  AuthResponse,
  Company,
  CompanyModuleState,
  DashboardResponse,
  LoginRequest,
  Tracker,
  UserAccount,
  Vehicle,
  VehicleHistoryResponse,
} from '@vehiclelinq/shared';
import type { PlatformSettingsView } from '@/features/settings/types';
import { useSessionStore } from '@/store/session';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

function syncRefreshedSession(session: AuthResponse) {
  const persistedCompanyId = localStorage.getItem('vehiclelinq.companyId');

  localStorage.setItem('vehiclelinq.accessToken', session.accessToken);
  localStorage.setItem('vehiclelinq.refreshToken', session.refreshToken);
  localStorage.setItem('vehiclelinq.user', JSON.stringify(session.user));

  if (session.user.companyId) {
    localStorage.setItem('vehiclelinq.companyId', session.user.companyId);
  } else if (persistedCompanyId) {
    localStorage.setItem('vehiclelinq.companyId', persistedCompanyId);
  }

  useSessionStore.setState((state) => ({
    ...state,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: session.user,
    currentCompanyId: session.user.companyId ?? state.currentCompanyId ?? persistedCompanyId ?? null,
  }));
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null,
  refreshToken?: string | null,
  retryOnUnauthorized = true,
): Promise<T> {
  const session = useSessionStore.getState();
  const resolvedAccessToken = accessToken ?? session.accessToken;
  const resolvedRefreshToken = refreshToken ?? session.refreshToken;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(resolvedAccessToken ? { Authorization: `Bearer ${resolvedAccessToken}` } : {}),
      ...(resolvedRefreshToken ? { 'x-refresh-token': resolvedRefreshToken } : {}),
      ...options.headers,
    },
  });

  if (
    response.status === 401 &&
    retryOnUnauthorized &&
    path !== '/auth/login' &&
    path !== '/auth/refresh' &&
    resolvedRefreshToken
  ) {
    try {
      const nextSession = await request<AuthResponse>(
        '/auth/refresh',
        { method: 'POST' },
        null,
        resolvedRefreshToken,
        false,
      );
      syncRefreshedSession(nextSession);

      return request<T>(path, options, nextSession.accessToken, nextSession.refreshToken, false);
    } catch {
      useSessionStore.getState().clear();
      throw new Error('Sessie verlopen. Log opnieuw in.');
    }
  }

  if (!response.ok) {
    const raw = await response.text();
    let message = raw || 'API request mislukt';

    try {
      const parsed = JSON.parse(raw) as { message?: string | string[] };
      if (Array.isArray(parsed.message)) {
        message = parsed.message.join(', ');
      } else if (parsed.message) {
        message = parsed.message;
      }
    } catch {
      // Gebruik de tekstresponse als deze geen JSON is.
    }

    if (response.status === 401) {
      useSessionStore.getState().clear();
      message = 'Sessie verlopen. Log opnieuw in.';
    }

    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export const api = {
  login: (body: LoginRequest) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  refresh: (refreshToken: string) => request<AuthResponse>('/auth/refresh', { method: 'POST' }, null, refreshToken),
  me: (accessToken: string) => request<AuthResponse['user']>('/me', {}, accessToken),
  companies: (accessToken: string) => request<Company[]>('/platform/companies', {}, accessToken),
  createCompany: (accessToken: string, body: { name: string; slug: string; timezone?: string }) =>
    request<Company>('/platform/companies', { method: 'POST', body: JSON.stringify(body) }, accessToken),
  dashboard: (accessToken: string, companyId: string) =>
    request<DashboardResponse>(`/companies/${companyId}/dashboard`, {}, accessToken),
  vehicles: (accessToken: string, companyId: string) =>
    request<Vehicle[]>(`/companies/${companyId}/vehicles`, {}, accessToken),
  createVehicle: (accessToken: string, companyId: string, body: { name: string; plateNumber: string }) =>
    request<Vehicle>(
      `/companies/${companyId}/vehicles`,
      { method: 'POST', body: JSON.stringify(body) },
      accessToken,
    ),
  trackers: (accessToken: string, companyId: string) =>
    request<Tracker[]>(`/companies/${companyId}/trackers`, {}, accessToken),
  createTracker: (
    accessToken: string,
    companyId: string,
    body: { vehicleId?: string | null; imei: string; model: Tracker['model'] },
  ) =>
    request<Tracker>(
      `/companies/${companyId}/trackers`,
      { method: 'POST', body: JSON.stringify(body) },
      accessToken,
    ),
  users: (accessToken: string, companyId: string) =>
    request<UserAccount[]>(`/companies/${companyId}/users`, {}, accessToken),
  createUser: (
    accessToken: string,
    companyId: string,
    body: {
      displayName: string;
      email: string;
      password: string;
      role: UserAccount['role'];
    },
  ) =>
    request<UserAccount>(
      `/companies/${companyId}/users`,
      { method: 'POST', body: JSON.stringify(body) },
      accessToken,
    ),
  vehicleHistory: (
    accessToken: string,
    companyId: string,
    vehicleId: string,
    from?: string,
    to?: string,
  ) =>
    request<VehicleHistoryResponse>(
      `/companies/${companyId}/vehicles/${vehicleId}/history?from=${encodeURIComponent(
        from ?? '',
      )}&to=${encodeURIComponent(to ?? '')}`,
      {},
      accessToken,
    ),
  moduleCatalog: (accessToken: string) =>
    request('/platform/modules', {}, accessToken) as Promise<
      {
        key: string;
        name: string;
        description: string;
        category: string;
        defaultEnabled: boolean;
      }[]
    >,
  companyModules: (accessToken: string, companyId: string) =>
    request<CompanyModuleState[]>(`/companies/${companyId}/modules`, {}, accessToken),
  toggleModule: (accessToken: string, companyId: string, moduleKey: string, enabled: boolean) =>
    request<CompanyModuleState>(
      `/companies/${companyId}/modules/${moduleKey}`,
      { method: 'PATCH', body: JSON.stringify({ enabled }) },
      accessToken,
    ),
  platformSettings: (accessToken: string) =>
    request<PlatformSettingsView>('/platform/settings', {}, accessToken),
  updatePlatformSettings: (accessToken: string, body: Partial<PlatformSettingsView>) =>
    request<PlatformSettingsView>(
      '/platform/settings',
      { method: 'PATCH', body: JSON.stringify(body) },
      accessToken,
    ),
};
