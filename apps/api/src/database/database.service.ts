import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, type QueryResult, type QueryResultRow } from 'pg';
import { hashSync } from 'bcryptjs';
import { getConfig } from '../config/env';

interface Queryable {
  query<T extends QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<T>>;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool = new Pool({
    connectionString: getConfig().databaseUrl,
  });

  async onModuleInit(): Promise<void> {
    await this.pool.query('SELECT 1');
    await this.ensureBootstrapData();
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async query<T extends QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, values);
  }

  async transaction<T>(handler: (db: Queryable) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await handler(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async ensureBootstrapData(): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO platform_settings (id, map_tile_url, map_attribution, default_map_lat, default_map_lng, default_map_zoom)
        VALUES (TRUE, $1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `,
      [
        getConfig().mapTileUrl,
        getConfig().mapAttribution,
        getConfig().defaultMapLat,
        getConfig().defaultMapLng,
        getConfig().defaultMapZoom,
      ],
    );

    await this.pool.query(
      `
        INSERT INTO module_registry (key, name, description, category, default_enabled)
        VALUES
          ('core_tracking', 'Core Tracking', 'Live voertuigtracking en actuele status.', 'core', TRUE),
          ('history_replay', 'History Replay', 'Historische posities en ritten terugkijken.', 'core', TRUE),
          ('maintenance_placeholder', 'Maintenance', 'Gereserveerd voor onderhoudsmodule.', 'operations', FALSE),
          ('compliance_placeholder', 'Compliance', 'Gereserveerd voor compliance en tachograaf.', 'compliance', FALSE)
        ON CONFLICT (key) DO NOTHING
      `,
    );

    const companyResult = await this.pool.query<{ id: string }>(
      `
        INSERT INTO companies (name, slug)
        VALUES ('Demo Logistics', 'demo-logistics')
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `,
    );
    const companyId = companyResult.rows[0]?.id;

    if (!companyId) {
      this.logger.warn('Kon demo company niet bootstrapen.');
      return;
    }

    const passwordHash = hashSync(getConfig().bootstrapSuperadminPassword, 10);

    await this.pool.query(
      `
        INSERT INTO users (email, password_hash, display_name, role, company_id)
        VALUES ($1, $2, 'Platform Administrator', 'superadmin', NULL)
        ON CONFLICT (email) DO NOTHING
      `,
      [getConfig().bootstrapSuperadminEmail, passwordHash],
    );

    await this.pool.query(
      `
        INSERT INTO users (email, password_hash, display_name, role, company_id)
        VALUES
          ('planner@demo-logistics.local', $1, 'Demo Planner', 'company_admin', $2),
          ('viewer@demo-logistics.local', $1, 'Demo Viewer', 'viewer', $2)
        ON CONFLICT (email) DO NOTHING
      `,
      [hashSync('DemoPass123!', 10), companyId],
    );

    await this.pool.query(
      `
        INSERT INTO company_modules (company_id, module_key, enabled)
        VALUES
          ($1, 'core_tracking', TRUE),
          ($1, 'history_replay', TRUE),
          ($1, 'maintenance_placeholder', FALSE),
          ($1, 'compliance_placeholder', FALSE)
        ON CONFLICT (company_id, module_key) DO NOTHING
      `,
      [companyId],
    );

    const vehicleResult = await this.pool.query<{ id: string }>(
      `
        INSERT INTO vehicles (company_id, name, plate_number, status)
        VALUES ($1, 'Service Van 01', 'VLQ-001', 'online')
        ON CONFLICT DO NOTHING
        RETURNING id
      `,
      [companyId],
    );

    const vehicleId =
      vehicleResult.rows[0]?.id ??
      (
        await this.pool.query<{ id: string }>(
          `SELECT id FROM vehicles WHERE company_id = $1 ORDER BY created_at ASC LIMIT 1`,
          [companyId],
        )
      ).rows[0]?.id;

    if (!vehicleId) {
      return;
    }

    const trackerResult = await this.pool.query<{ id: string }>(
      `
        INSERT INTO trackers (company_id, vehicle_id, imei, model, status)
        VALUES ($1, $2, '356307042441013', 'FMC130', 'active')
        ON CONFLICT (imei) DO UPDATE SET vehicle_id = EXCLUDED.vehicle_id, status = EXCLUDED.status
        RETURNING id
      `,
      [companyId, vehicleId],
    );

    const trackerId = trackerResult.rows[0]?.id;
    const recordedAt = new Date();

    await this.pool.query(
      `
        INSERT INTO vehicle_last_state (
          vehicle_id, company_id, tracker_id, tracker_imei, lat, lng, speed_kph, heading, ignition, online, recorded_at
        )
        VALUES ($1, $2, $3, '356307042441013', 52.3702, 4.8952, 48, 90, TRUE, TRUE, $4)
        ON CONFLICT (vehicle_id) DO UPDATE SET
          tracker_id = EXCLUDED.tracker_id,
          tracker_imei = EXCLUDED.tracker_imei,
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          speed_kph = EXCLUDED.speed_kph,
          heading = EXCLUDED.heading,
          ignition = EXCLUDED.ignition,
          online = EXCLUDED.online,
          recorded_at = EXCLUDED.recorded_at
      `,
      [vehicleId, companyId, trackerId, recordedAt],
    );

    await this.pool.query(
      `
        INSERT INTO telemetry_positions (
          company_id, vehicle_id, tracker_id, tracker_imei, lat, lng, speed_kph, heading, ignition, recorded_at
        )
        SELECT $1, $2, $3, '356307042441013', position.lat, position.lng, position.speed_kph, position.heading, TRUE, position.recorded_at
        FROM (
          VALUES
            (52.3676::double precision, 4.9041::double precision, 32::double precision, 87::double precision, NOW() - INTERVAL '20 minutes'),
            (52.3683::double precision, 4.8991::double precision, 40::double precision, 90::double precision, NOW() - INTERVAL '10 minutes'),
            (52.3702::double precision, 4.8952::double precision, 48::double precision, 90::double precision, NOW())
        ) AS position(lat, lng, speed_kph, heading, recorded_at)
        WHERE NOT EXISTS (
          SELECT 1 FROM telemetry_positions WHERE tracker_imei = '356307042441013'
        )
      `,
      [companyId, vehicleId, trackerId],
    );
  }
}
