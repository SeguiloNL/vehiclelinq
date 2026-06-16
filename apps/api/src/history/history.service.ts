import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { HistoryPoint, VehicleHistoryResponse } from '@vehiclelinq/shared';
import type { AuthUser } from '../auth/auth.types';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class HistoryService {
  constructor(private readonly database: DatabaseService) {}

  async getVehicleHistory(
    user: AuthUser,
    companyId: string,
    vehicleId: string,
    from?: string,
    to?: string,
  ): Promise<VehicleHistoryResponse> {
    this.assertAccess(user, companyId);

    const vehicleResult = await this.database.query<VehicleHistoryResponse['vehicle']>(
      `
        SELECT id, company_id AS "companyId", name, plate_number AS "plateNumber",
          (
            SELECT id FROM trackers t WHERE t.vehicle_id = vehicles.id LIMIT 1
          ) AS "trackerId",
          status
        FROM vehicles
        WHERE id = $1 AND company_id = $2
      `,
      [vehicleId, companyId],
    );

    const vehicle = vehicleResult.rows[0];
    if (!vehicle) {
      throw new NotFoundException('Voertuig niet gevonden.');
    }

    const params: unknown[] = [companyId, vehicleId];
    const filters = ['company_id = $1', 'vehicle_id = $2'];

    if (from) {
      params.push(from);
      filters.push(`recorded_at >= $${params.length}`);
    }

    if (to) {
      params.push(to);
      filters.push(`recorded_at <= $${params.length}`);
    }

    const pointsResult = await this.database.query<HistoryPoint>(
      `
        SELECT id, vehicle_id AS "vehicleId", lat, lng, speed_kph AS "speedKph",
          heading, recorded_at AS "recordedAt", ignition
        FROM telemetry_positions
        WHERE ${filters.join(' AND ')}
        ORDER BY recorded_at ASC
        LIMIT 5000
      `,
      params,
    );

    return {
      vehicle,
      points: pointsResult.rows,
    };
  }

  private assertAccess(user: AuthUser, companyId: string): void {
    if (user.role !== 'superadmin' && user.companyId !== companyId) {
      throw new ForbiddenException('Geen toegang tot dit bedrijf.');
    }
  }
}
