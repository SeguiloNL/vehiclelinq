ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('superadmin', 'company_admin', 'driver', 'viewer'));

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS default_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL;

ALTER TABLE trip_summaries
  ADD COLUMN IF NOT EXISTS driver_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS start_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS start_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS end_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS end_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS classification TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS comment TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'automatic',
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE trip_summaries
  DROP CONSTRAINT IF EXISTS trip_summaries_classification_check;

ALTER TABLE trip_summaries
  ADD CONSTRAINT trip_summaries_classification_check
  CHECK (classification IN ('business', 'private', 'commute', 'unknown'));

ALTER TABLE trip_summaries
  DROP CONSTRAINT IF EXISTS trip_summaries_status_check;

ALTER TABLE trip_summaries
  ADD CONSTRAINT trip_summaries_status_check
  CHECK (status IN ('draft', 'reviewed', 'approved'));

ALTER TABLE trip_summaries
  DROP CONSTRAINT IF EXISTS trip_summaries_source_check;

ALTER TABLE trip_summaries
  ADD CONSTRAINT trip_summaries_source_check
  CHECK (source IN ('automatic', 'manual_adjustment'));

CREATE TABLE IF NOT EXISTS trip_day_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  summary_date DATE NOT NULL,
  total_distance_km DOUBLE PRECISION NOT NULL DEFAULT 0,
  business_distance_km DOUBLE PRECISION NOT NULL DEFAULT 0,
  private_distance_km DOUBLE PRECISION NOT NULL DEFAULT 0,
  commute_distance_km DOUBLE PRECISION NOT NULL DEFAULT 0,
  trip_count INTEGER NOT NULL DEFAULT 0,
  open_trip_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT trip_day_summaries_scope_check CHECK (
    vehicle_id IS NOT NULL OR driver_user_id IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_trip_day_summaries_unique_vehicle
  ON trip_day_summaries (company_id, vehicle_id, summary_date)
  WHERE vehicle_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_trip_day_summaries_unique_driver
  ON trip_day_summaries (company_id, driver_user_id, summary_date)
  WHERE driver_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trip_summaries_company_vehicle_started_at
  ON trip_summaries (company_id, vehicle_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_trip_summaries_driver_started_at
  ON trip_summaries (driver_user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_default_vehicle_id
  ON users (default_vehicle_id);
