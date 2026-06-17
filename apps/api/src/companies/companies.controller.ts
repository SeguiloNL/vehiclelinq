import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import type { Company } from '@vehiclelinq/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthUser } from '../auth/auth.types';
import { CompaniesService } from './companies.service';

@Controller('api/v1/platform/companies')
@UseGuards(AuthGuard, RolesGuard)
export class CompaniesController {
  constructor(@Inject(CompaniesService) private readonly companiesService: CompaniesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<Company[]> {
    return this.companiesService.list(user);
  }

  @Post()
  @Roles('superadmin')
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: { name: string; slug: string; timezone?: string },
  ): Promise<Company> {
    return this.companiesService.create(user, body);
  }
}
