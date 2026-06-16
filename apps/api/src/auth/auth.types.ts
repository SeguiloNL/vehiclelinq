import type { PlatformRole } from '@vehiclelinq/shared';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: PlatformRole;
  companyId: string | null;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  displayName: string;
  role: PlatformRole;
  companyId: string | null;
}
