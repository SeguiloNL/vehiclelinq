import { Body, Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import type { DashboardResponse, Vehicle, VehicleLiveState } from '@vehiclelinq/shared';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { VehiclesService } from './vehicles.service';

@Controller('api/v1')
@UseGuards(AuthGuard, RolesGuard)
export class VehiclesController {
  constructor(@Inject(VehiclesService) private readonly vehiclesService: VehiclesService) {}

  @Get('companies/:companyId/dashboard')
  dashboard(
    @CurrentUser() user: AuthUser,
    @Param('companyId') companyId: string,
  ): Promise<DashboardResponse> {
    return this.vehiclesService.dashboard(user, companyId);
  }

  @Get('companies/:companyId/vehicles')
  list(
    @CurrentUser() user: AuthUser,
    @Param('companyId') companyId: string,
  ): Promise<Vehicle[]> {
    return this.vehiclesService.list(user, companyId);
  }

  @Post('companies/:companyId/vehicles')
  create(
    @CurrentUser() user: AuthUser,
    @Param('companyId') companyId: string,
    @Body() body: { name: string; plateNumber: string },
  ): Promise<Vehicle> {
    return this.vehiclesService.create(user, companyId, body);
  }

  @Get('companies/:companyId/vehicles/:vehicleId/live')
  live(
    @CurrentUser() user: AuthUser,
    @Param('companyId') companyId: string,
    @Param('vehicleId') vehicleId: string,
  ): Promise<VehicleLiveState | null> {
    return this.vehiclesService.live(user, companyId, vehicleId);
  }
}
