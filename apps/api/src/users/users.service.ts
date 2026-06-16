import { ForbiddenException, Injectable } from '@nestjs/common';
import type { UserAccount } from '@vehiclelinq/shared';
import type { AuthUser } from '../auth/auth.types';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  async list(user: AuthUser, companyId: string): Promise<UserAccount[]> {
    if (user.role !== 'superadmin' && user.companyId !== companyId) {
      throw new ForbiddenException('Geen toegang tot dit bedrijf.');
    }

    const result = await this.database.query<UserAccount>(
      `
        SELECT id, email, display_name AS "displayName", role, company_id AS "companyId"
        FROM users
        WHERE company_id = $1
        ORDER BY display_name ASC
      `,
      [companyId],
    );
    return result.rows;
  }
}
