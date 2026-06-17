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
    // #region debug-point A:company-create-entry
    fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'company-create-500',runId:'pre-fix',hypothesisId:'A',location:'apps/api/src/companies/companies.service.ts:40',msg:'[DEBUG] CompaniesService.create entered',data:{userRole:user.role,userCompanyId:user.companyId,body},ts:Date.now()})}).catch(()=>{});
    // #endregion
    if (user.role !== 'superadmin') {
      throw new ForbiddenException('Alleen superadmins mogen bedrijven aanmaken.');
    }

    try {
      return await this.database.transaction(async (db) => {
        // #region debug-point B:before-company-insert
        fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'company-create-500',runId:'pre-fix',hypothesisId:'B',location:'apps/api/src/companies/companies.service.ts:48',msg:'[DEBUG] About to insert company',data:{name:body.name,slug:body.slug,timezone:body.timezone ?? 'Europe/Amsterdam'},ts:Date.now()})}).catch(()=>{});
        // #endregion
        const result = await db.query<Company>(
          `
            INSERT INTO companies (name, slug, timezone)
            VALUES ($1, $2, $3)
            RETURNING id, name, slug, is_active AS "isActive", timezone
          `,
          [body.name, body.slug, body.timezone ?? 'Europe/Amsterdam'],
        );

        const company = result.rows[0];
        // #region debug-point B:after-company-insert
        fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'company-create-500',runId:'pre-fix',hypothesisId:'B',location:'apps/api/src/companies/companies.service.ts:59',msg:'[DEBUG] Company insert finished',data:{rowCount:result.rows.length,company},ts:Date.now()})}).catch(()=>{});
        // #endregion
        if (!company) {
          throw new NotFoundException('Bedrijf kon niet worden aangemaakt.');
        }

        // #region debug-point C:before-module-seed
        fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'company-create-500',runId:'pre-fix',hypothesisId:'C',location:'apps/api/src/companies/companies.service.ts:66',msg:'[DEBUG] About to seed company modules',data:{companyId:company.id},ts:Date.now()})}).catch(()=>{});
        // #endregion
        await db.query(
          `
            INSERT INTO company_modules (company_id, module_key, enabled)
            SELECT $1, key, default_enabled
            FROM module_registry
            ON CONFLICT (company_id, module_key) DO NOTHING
          `,
          [company.id],
        );
        // #region debug-point C:after-module-seed
        fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'company-create-500',runId:'pre-fix',hypothesisId:'C',location:'apps/api/src/companies/companies.service.ts:76',msg:'[DEBUG] Company modules seeded',data:{companyId:company.id},ts:Date.now()})}).catch(()=>{});
        // #endregion

        return company;
      });
    } catch (error) {
      // #region debug-point E:company-create-error
      fetch('http://127.0.0.1:7777/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'company-create-500',runId:'pre-fix',hypothesisId:'E',location:'apps/api/src/companies/companies.service.ts:82',msg:'[DEBUG] CompaniesService.create threw',data:{code:(error as {code?:string}).code,name:(error as {name?:string}).name,message:(error as {message?:string}).message},ts:Date.now()})}).catch(()=>{});
      // #endregion
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException('Er bestaat al een bedrijf met deze slug.');
      }

      throw error;
    }
  }
}
