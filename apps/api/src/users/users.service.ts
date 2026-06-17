import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcryptjs';
import type { UserAccount } from '@vehiclelinq/shared';
import type { AuthUser } from '../auth/auth.types';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async list(user: AuthUser, companyId: string): Promise<UserAccount[]> {
    this.assertAccess(user, companyId);

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

  async create(
    user: AuthUser,
    companyId: string,
    body: {
      displayName: string;
      email: string;
      password: string;
      role: UserAccount['role'];
    },
  ): Promise<UserAccount> {
    this.assertAccess(user, companyId);

    if (user.role === 'viewer') {
      throw new ForbiddenException('Viewer-gebruikers mogen geen gebruikers aanmaken.');
    }

    if (user.role !== 'superadmin' && body.role === 'superadmin') {
      throw new ForbiddenException('Alleen superadmins mogen andere superadmins aanmaken.');
    }

    const companyResult = await this.database.query<{ id: string }>(
      `SELECT id FROM companies WHERE id = $1`,
      [companyId],
    );

    if (!companyResult.rows[0]) {
      throw new NotFoundException('Bedrijf niet gevonden.');
    }

    try {
      const passwordHash = await hash(body.password, 10);
      const result = await this.database.query<UserAccount>(
        `
          INSERT INTO users (email, password_hash, display_name, role, company_id)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, email, display_name AS "displayName", role, company_id AS "companyId"
        `,
        [body.email.toLowerCase(), passwordHash, body.displayName, body.role, companyId],
      );

      return result.rows[0];
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException('Er bestaat al een gebruiker met dit e-mailadres.');
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
