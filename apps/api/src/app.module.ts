import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { CompaniesController } from './companies/companies.controller';
import { CompaniesService } from './companies/companies.service';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { DatabaseService } from './database/database.service';
import { HealthController } from './health/health.controller';
import { HistoryController } from './history/history.controller';
import { HistoryService } from './history/history.service';
import { ModulesController } from './modules/modules.controller';
import { ModulesService } from './modules/modules.service';
import { PlatformSettingsController } from './platform-settings/platform-settings.controller';
import { PlatformSettingsService } from './platform-settings/platform-settings.service';
import { TrackersController } from './trackers/trackers.controller';
import { TrackersService } from './trackers/trackers.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { VehiclesController } from './vehicles/vehicles.controller';
import { VehiclesService } from './vehicles/vehicles.service';

@Module({
  controllers: [
    AuthController,
    CompaniesController,
    VehiclesController,
    TrackersController,
    HistoryController,
    ModulesController,
    PlatformSettingsController,
    UsersController,
    HealthController,
  ],
  providers: [
    DatabaseService,
    AuthService,
    AuthGuard,
    RolesGuard,
    CompaniesService,
    VehiclesService,
    TrackersService,
    HistoryService,
    ModulesService,
    PlatformSettingsService,
    UsersService,
  ],
})
export class AppModule {}
