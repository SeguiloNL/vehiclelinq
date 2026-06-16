import type { ModuleKey } from '../modules/module-keys';
import type { PlatformRole } from '../auth/roles';

export interface Company {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  timezone: string;
}

export interface UserAccount {
  id: string;
  email: string;
  displayName: string;
  role: PlatformRole;
  companyId: string | null;
}

export interface Vehicle {
  id: string;
  companyId: string;
  name: string;
  plateNumber: string;
  trackerId: string | null;
  status: 'online' | 'offline' | 'idle';
}

export interface Tracker {
  id: string;
  companyId: string;
  vehicleId: string | null;
  imei: string;
  model: 'FMC130' | 'FMC150' | 'FMC650';
  status: 'active' | 'inactive' | 'quarantine';
}

export interface VehicleLiveState {
  vehicleId: string;
  companyId: string;
  lat: number;
  lng: number;
  speedKph: number;
  heading: number;
  ignition: boolean;
  online: boolean;
  recordedAt: string;
  trackerImei: string;
}

export interface HistoryPoint {
  id: string;
  vehicleId: string;
  lat: number;
  lng: number;
  speedKph: number;
  heading: number;
  recordedAt: string;
  ignition: boolean;
}

export interface CompanyModuleState {
  companyId: string;
  moduleKey: ModuleKey;
  enabled: boolean;
}

export interface TelemetryEnvelope {
  trackerImei: string;
  timestamp: string;
  lat: number;
  lng: number;
  speedKph: number;
  heading: number;
  ignition: boolean;
  eventCode?: number;
  raw?: Record<string, number>;
}
