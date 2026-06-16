CREATE EXTENSION IF NOT EXISTS timescaledb;

SELECT create_hypertable('telemetry_positions', 'recorded_at', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_positions_recorded_at_desc
  ON telemetry_positions (recorded_at DESC);
