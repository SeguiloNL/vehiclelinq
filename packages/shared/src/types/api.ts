import type {
  Company,
  CompanyModuleState,
  HistoryPoint,
  TripDaySummary,
  TripSummary,
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

export interface TripListResponse {
  trips: TripSummary[];
  days: TripDaySummary[];
}

export interface UpdateTripRequest {
  classification: TripSummary['classification'];
  comment?: string | null;
  status?: TripSummary['status'];
}
