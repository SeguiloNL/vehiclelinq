import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Company } from '@vehiclelinq/shared';
import type { AuthUser } from '../auth/auth.types';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CompaniesService {
  constructor(private readonly database: DatabaseService) {}

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

    const result = await this.database.query<Company>(
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

    return company;
  }
}
