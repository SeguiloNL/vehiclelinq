import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import type { DashboardResponse, Vehicle, VehicleLiveState } from '@vehiclelinq/shared';
import type { AuthUser } from '../auth/auth.types';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class VehiclesService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async dashboard(user: AuthUser, companyId: string): Promise<DashboardResponse> {
    this.assertAccess(user, companyId);

    const [companyResult, vehiclesResult, liveStatesResult, trackersResult, modulesResult] =
      await Promise.all([
        this.database.query<DashboardResponse['company']>(
          `SELECT id, name, slug, is_active AS "isActive", timezone FROM companies WHERE id = $1`,
          [companyId],
        ),
        this.database.query<Vehicle>(
          `
            SELECT id, company_id AS "companyId", name, plate_number AS "plateNumber",
              (
                SELECT id FROM trackers t WHERE t.vehicle_id = vehicles.id LIMIT 1
              ) AS "trackerId",
              status
            FROM vehicles
            WHERE company_id = $1
            ORDER BY name ASC
          `,
          [companyId],
        ),
        this.database.query<VehicleLiveState>(
          `
            SELECT vehicle_id AS "vehicleId", company_id AS "companyId", lat, lng, speed_kph AS "speedKph",
              heading, ignition, online, recorded_at AS "recordedAt", tracker_imei AS "trackerImei"
            FROM vehicle_last_state
            WHERE company_id = $1
          `,
          [companyId],
        ),
        this.database.query<DashboardResponse['trackers'][number]>(
          `
            SELECT id, company_id AS "companyId", vehicle_id AS "vehicleId", imei, model, status
            FROM trackers
            WHERE company_id = $1
            ORDER BY created_at DESC
          `,
          [companyId],
        ),
        this.database.query<DashboardResponse['modules'][number]>(
          `
            SELECT company_id AS "companyId", module_key AS "moduleKey", enabled
            FROM company_modules
            WHERE company_id = $1
            ORDER BY module_key ASC
          `,
          [companyId],
        ),
      ]);

    return {
      company: companyResult.rows[0],
      vehicles: vehiclesResult.rows,
      liveStates: liveStatesResult.rows,
      trackers: trackersResult.rows,
      modules: modulesResult.rows,
    };
  }

  async list(user: AuthUser, companyId: string): Promise<Vehicle[]> {
    this.assertAccess(user, companyId);
    const result = await this.database.query<Vehicle>(
      `
        SELECT id, company_id AS "companyId", name, plate_number AS "plateNumber",
          (
            SELECT id FROM trackers t WHERE t.vehicle_id = vehicles.id LIMIT 1
          ) AS "trackerId",
          status
        FROM vehicles
        WHERE company_id = $1
        ORDER BY name ASC
      `,
      [companyId],
    );
    return result.rows;
  }

  async create(
    user: AuthUser,
    companyId: string,
    body: { name: string; plateNumber: string },
  ): Promise<Vehicle> {
    this.assertAccess(user, companyId);
    if (user.role === 'viewer') {
      throw new ForbiddenException('Viewer-gebruikers mogen geen voertuigen aanmaken.');
    }

    const result = await this.database.query<Vehicle>(
      `
        INSERT INTO vehicles (company_id, name, plate_number, status)
        VALUES ($1, $2, $3, 'offline')
        RETURNING id, company_id AS "companyId", name, plate_number AS "plateNumber", NULL::uuid AS "trackerId", status
      `,
      [companyId, body.name, body.plateNumber],
    );
    return result.rows[0];
  }

  async live(user: AuthUser, companyId: string, vehicleId: string): Promise<VehicleLiveState | null> {
    this.assertAccess(user, companyId);
    const result = await this.database.query<VehicleLiveState>(
      `
        SELECT vehicle_id AS "vehicleId", company_id AS "companyId", lat, lng, speed_kph AS "speedKph",
          heading, ignition, online, recorded_at AS "recordedAt", tracker_imei AS "trackerImei"
        FROM vehicle_last_state
        WHERE company_id = $1 AND vehicle_id = $2
      `,
      [companyId, vehicleId],
    );
    return result.rows[0] ?? null;
  }

  private assertAccess(user: AuthUser, companyId: string): void {
    if (user.role !== 'superadmin' && user.companyId !== companyId) {
      throw new ForbiddenException('Geen toegang tot dit bedrijf.');
    }
  }
}
