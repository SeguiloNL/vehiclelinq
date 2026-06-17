import { Controller, Get, Inject, Param, Query, UseGuards } from '@nestjs/common';
import type { VehicleHistoryResponse } from '@vehiclelinq/shared';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { HistoryService } from './history.service';

@Controller('api/v1')
@UseGuards(AuthGuard, RolesGuard)
export class HistoryController {
  constructor(@Inject(HistoryService) private readonly historyService: HistoryService) {}

  @Get('companies/:companyId/vehicles/:vehicleId/history')
  getVehicleHistory(
    @CurrentUser() user: AuthUser,
    @Param('companyId') companyId: string,
    @Param('vehicleId') vehicleId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<VehicleHistoryResponse> {
    return this.historyService.getVehicleHistory(user, companyId, vehicleId, from, to);
  }
}
