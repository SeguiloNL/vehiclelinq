import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Tracker } from '@vehiclelinq/shared';
import type { AuthUser } from '../auth/auth.types';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TrackersService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async list(user: AuthUser, companyId: string): Promise<Tracker[]> {
    this.assertAccess(user, companyId);
    const result = await this.database.query<Tracker>(
      `
        SELECT id, company_id AS "companyId", vehicle_id AS "vehicleId", imei, model, status
        FROM trackers
        WHERE company_id = $1
        ORDER BY created_at DESC
      `,
      [companyId],
    );
    return result.rows;
  }

  async create(
    user: AuthUser,
    companyId: string,
    body: { vehicleId?: string | null; imei: string; model: Tracker['model'] },
  ): Promise<Tracker> {
    this.assertAccess(user, companyId);
    if (user.role === 'viewer') {
      throw new ForbiddenException('Viewer-gebruikers mogen geen trackers toevoegen.');
    }

    if (body.vehicleId) {
      const vehicleResult = await this.database.query<{ id: string }>(
        `SELECT id FROM vehicles WHERE id = $1 AND company_id = $2`,
        [body.vehicleId, companyId],
      );

      if (!vehicleResult.rows[0]) {
        throw new NotFoundException('Het gekozen voertuig bestaat niet binnen dit bedrijf.');
      }
    }

    try {
      const result = await this.database.query<Tracker>(
        `
          INSERT INTO trackers (company_id, vehicle_id, imei, model, status)
          VALUES ($1, $2, $3, $4, 'active')
          RETURNING id, company_id AS "companyId", vehicle_id AS "vehicleId", imei, model, status
        `,
        [companyId, body.vehicleId ?? null, body.imei, body.model],
      );
      return result.rows[0];
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException('Er bestaat al een tracker met deze IMEI.');
      }

      throw error;
    }
  }

  private assertAccess(user: AuthUser, companyId: string): void {
    if (user.role !== 'superadmin' && user.companyId !== companyId) {
      throw new ForbiddenException('Geen toegang tot dit bedrijf.');
    }
  }
}
