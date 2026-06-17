import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import type { CompanyModuleState, ModuleDefinition, ModuleKey } from '@vehiclelinq/shared';
import type { AuthUser } from '../auth/auth.types';
import { DatabaseService } from '../database/database.service';
import { moduleRegistry } from './module-registry';

@Injectable()
export class ModulesService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  listCatalog(): ModuleDefinition[] {
    return moduleRegistry;
  }

  async listCompanyModules(user: AuthUser, companyId: string): Promise<CompanyModuleState[]> {
    this.assertAccess(user, companyId);
    const result = await this.database.query<CompanyModuleState>(
      `
        SELECT company_id AS "companyId", module_key AS "moduleKey", enabled
        FROM company_modules
        WHERE company_id = $1
        ORDER BY module_key ASC
      `,
      [companyId],
    );
    return result.rows;
  }

  async toggle(
    user: AuthUser,
    companyId: string,
    moduleKey: ModuleKey,
    enabled: boolean,
  ): Promise<CompanyModuleState> {
    this.assertAccess(user, companyId);
    if (user.role === 'viewer') {
      throw new ForbiddenException('Viewer-gebruikers mogen geen modules wijzigen.');
    }

    const result = await this.database.query<CompanyModuleState>(
      `
        INSERT INTO company_modules (company_id, module_key, enabled)
        VALUES ($1, $2, $3)
        ON CONFLICT (company_id, module_key)
        DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = NOW()
        RETURNING company_id AS "companyId", module_key AS "moduleKey", enabled
      `,
      [companyId, moduleKey, enabled],
    );
    return result.rows[0];
  }

  private assertAccess(user: AuthUser, companyId: string): void {
    if (user.role !== 'superadmin' && user.companyId !== companyId) {
      throw new ForbiddenException('Geen toegang tot dit bedrijf.');
    }
  }
}
