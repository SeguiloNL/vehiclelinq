import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  PlatformSettingsService,
  type PlatformSettingsView,
} from './platform-settings.service';

@Controller('api/v1/platform/settings')
@UseGuards(AuthGuard, RolesGuard)
export class PlatformSettingsController {
  constructor(private readonly settingsService: PlatformSettingsService) {}

  @Get()
  get(@CurrentUser() user: AuthUser): Promise<PlatformSettingsView> {
    return this.settingsService.get(user);
  }

  @Patch()
  update(
    @CurrentUser() user: AuthUser,
    @Body() body: Partial<PlatformSettingsView>,
  ): Promise<PlatformSettingsView> {
    return this.settingsService.update(user, body);
  }
}
