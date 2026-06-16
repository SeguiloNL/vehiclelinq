CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  timezone TEXT NOT NULL DEFAULT 'Europe/Amsterdam',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'company_admin', 'viewer')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE module_registry (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  default_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE company_modules (
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL REFERENCES module_registry(key) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (company_id, module_key)
);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  plate_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'idle')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE trackers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  imei TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL CHECK (model IN ('FMC130', 'FMC150', 'FMC650')),
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'quarantine')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vehicle_last_state (
  vehicle_id UUID PRIMARY KEY REFERENCES vehicles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  tracker_id UUID REFERENCES trackers(id) ON DELETE SET NULL,
  tracker_imei TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  speed_kph DOUBLE PRECISION NOT NULL DEFAULT 0,
  heading DOUBLE PRECISION NOT NULL DEFAULT 0,
  ignition BOOLEAN NOT NULL DEFAULT FALSE,
  online BOOLEAN NOT NULL DEFAULT FALSE,
  recorded_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE telemetry_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  tracker_id UUID REFERENCES trackers(id) ON DELETE SET NULL,
  tracker_imei TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  speed_kph DOUBLE PRECISION NOT NULL DEFAULT 0,
  heading DOUBLE PRECISION NOT NULL DEFAULT 0,
  ignition BOOLEAN NOT NULL DEFAULT FALSE,
  recorded_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE trip_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  distance_km DOUBLE PRECISION NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE device_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  tracker_id UUID REFERENCES trackers(id) ON DELETE SET NULL,
  tracker_imei TEXT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE platform_settings (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  map_tile_url TEXT NOT NULL,
  map_attribution TEXT NOT NULL,
  default_map_lat DOUBLE PRECISION NOT NULL DEFAULT 52.3676,
  default_map_lng DOUBLE PRECISION NOT NULL DEFAULT 4.9041,
  default_map_zoom INTEGER NOT NULL DEFAULT 7,
  telemetry_retention_months INTEGER NOT NULL DEFAULT 12,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT platform_settings_singleton CHECK (id = TRUE)
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_vehicles_company_id ON vehicles(company_id);
CREATE INDEX idx_trackers_company_id ON trackers(company_id);
CREATE INDEX idx_trackers_vehicle_id ON trackers(vehicle_id);
CREATE INDEX idx_vehicle_last_state_company_id ON vehicle_last_state(company_id);
CREATE INDEX idx_positions_company_vehicle_recorded_at ON telemetry_positions(company_id, vehicle_id, recorded_at DESC);
CREATE INDEX idx_device_events_tracker_imei ON device_events(tracker_imei, created_at DESC);
