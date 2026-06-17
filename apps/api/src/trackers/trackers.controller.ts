import { Body, Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import type { Tracker } from '@vehiclelinq/shared';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TrackersService } from './trackers.service';

@Controller('api/v1')
@UseGuards(AuthGuard, RolesGuard)
export class TrackersController {
  constructor(@Inject(TrackersService) private readonly trackersService: TrackersService) {}

  @Get('companies/:companyId/trackers')
  list(
    @CurrentUser() user: AuthUser,
    @Param('companyId') companyId: string,
  ): Promise<Tracker[]> {
    return this.trackersService.list(user, companyId);
  }

  @Post('companies/:companyId/trackers')
  create(
    @CurrentUser() user: AuthUser,
    @Param('companyId') companyId: string,
    @Body() body: { vehicleId?: string | null; imei: string; model: Tracker['model'] },
  ): Promise<Tracker> {
    return this.trackersService.create(user, companyId, body);
  }
}
