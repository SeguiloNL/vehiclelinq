import type {
  Company,
  CompanyModuleState,
  HistoryPoint,
  Tracker,
  UserAccount,
  Vehicle,
  VehicleLiveState,
} from './domain';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserAccount;
}

export interface DashboardResponse {
  company: Company;
  vehicles: Vehicle[];
  liveStates: VehicleLiveState[];
  trackers: Tracker[];
  modules: CompanyModuleState[];
}

export interface VehicleHistoryResponse {
  vehicle: Vehicle;
  points: HistoryPoint[];
}
