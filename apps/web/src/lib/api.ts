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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

async function request<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null,
  refreshToken?: string | null,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(refreshToken ? { 'x-refresh-token': refreshToken } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'API request mislukt');
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
