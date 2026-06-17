import { Body, Controller, Get, Inject, Param, Patch, UseGuards } from '@nestjs/common';
import type { CompanyModuleState, ModuleDefinition, ModuleKey } from '@vehiclelinq/shared';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ModulesService } from './modules.service';

@Controller('api/v1')
@UseGuards(AuthGuard, RolesGuard)
export class ModulesController {
  constructor(@Inject(ModulesService) private readonly modulesService: ModulesService) {}

  @Get('platform/modules')
  listCatalog(): ModuleDefinition[] {
    return this.modulesService.listCatalog();
  }

  @Get('companies/:companyId/modules')
  listCompanyModules(
    @CurrentUser() user: AuthUser,
    @Param('companyId') companyId: string,
  ): Promise<CompanyModuleState[]> {
    return this.modulesService.listCompanyModules(user, companyId);
  }

  @Patch('companies/:companyId/modules/:moduleKey')
  toggle(
    @CurrentUser() user: AuthUser,
    @Param('companyId') companyId: string,
    @Param('moduleKey') moduleKey: ModuleKey,
    @Body() body: { enabled: boolean },
  ): Promise<CompanyModuleState> {
    return this.modulesService.toggle(user, companyId, moduleKey, body.enabled);
  }
}
