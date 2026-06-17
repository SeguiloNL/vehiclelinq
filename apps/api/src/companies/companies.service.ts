import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Company } from '@vehiclelinq/shared';
import type { AuthUser } from '../auth/auth.types';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CompaniesService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async list(user: AuthUser): Promise<Company[]> {
    if (user.role === 'superadmin') {
      const result = await this.database.query<Company>(
        `SELECT id, name, slug, is_active AS "isActive", timezone FROM companies ORDER BY name ASC`,
      );
      return result.rows;
    }

    if (!user.companyId) {
      return [];
    }

    const result = await this.database.query<Company>(
      `
        SELECT id, name, slug, is_active AS "isActive", timezone
        FROM companies
        WHERE id = $1
      `,
      [user.companyId],
    );
    return result.rows;
  }

  async create(user: AuthUser, body: { name: string; slug: string; timezone?: string }): Promise<Company> {
    if (user.role !== 'superadmin') {
      throw new ForbiddenException('Alleen superadmins mogen bedrijven aanmaken.');
    }

    try {
      return await this.database.transaction(async (db) => {
        const result = await db.query<Company>(
          `
            INSERT INTO companies (name, slug, timezone)
            VALUES ($1, $2, $3)
            RETURNING id, name, slug, is_active AS "isActive", timezone
          `,
          [body.name, body.slug, body.timezone ?? 'Europe/Amsterdam'],
        );

        const company = result.rows[0];
        if (!company) {
          throw new NotFoundException('Bedrijf kon niet worden aangemaakt.');
        }

        await db.query(
          `
            INSERT INTO company_modules (company_id, module_key, enabled)
            SELECT $1, key, default_enabled
            FROM module_registry
            ON CONFLICT (company_id, module_key) DO NOTHING
          `,
          [company.id],
        );

        return company;
      });
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException('Er bestaat al een bedrijf met deze slug.');
      }

      throw error;
    }
  }
}
