import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types';
import { DatabaseService } from '../database/database.service';

export interface PlatformSettingsView {
  mapTileUrl: string;
  mapAttribution: string;
  defaultMapLat: number;
  defaultMapLng: number;
  defaultMapZoom: number;
  telemetryRetentionMonths: number;
}

@Injectable()
export class PlatformSettingsService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async get(user: AuthUser): Promise<PlatformSettingsView> {
    if (user.role !== 'superadmin') {
      throw new ForbiddenException('Alleen superadmins mogen platforminstellingen zien.');
    }

    const result = await this.database.query<PlatformSettingsView>(
      `
        SELECT map_tile_url AS "mapTileUrl", map_attribution AS "mapAttribution",
          default_map_lat AS "defaultMapLat", default_map_lng AS "defaultMapLng",
          default_map_zoom AS "defaultMapZoom", telemetry_retention_months AS "telemetryRetentionMonths"
        FROM platform_settings
        WHERE id = TRUE
      `,
    );
    return result.rows[0];
  }

  async update(
    user: AuthUser,
    body: Partial<PlatformSettingsView>,
  ): Promise<PlatformSettingsView> {
    if (user.role !== 'superadmin') {
      throw new ForbiddenException('Alleen superadmins mogen platforminstellingen wijzigen.');
    }

    const current = await this.get(user);
    const result = await this.database.query<PlatformSettingsView>(
      `
        UPDATE platform_settings
        SET map_tile_url = $1,
            map_attribution = $2,
            default_map_lat = $3,
            default_map_lng = $4,
            default_map_zoom = $5,
            telemetry_retention_months = $6,
            updated_at = NOW()
        WHERE id = TRUE
        RETURNING map_tile_url AS "mapTileUrl", map_attribution AS "mapAttribution",
          default_map_lat AS "defaultMapLat", default_map_lng AS "defaultMapLng",
          default_map_zoom AS "defaultMapZoom", telemetry_retention_months AS "telemetryRetentionMonths"
      `,
      [
        body.mapTileUrl ?? current.mapTileUrl,
        body.mapAttribution ?? current.mapAttribution,
        body.defaultMapLat ?? current.defaultMapLat,
        body.defaultMapLng ?? current.defaultMapLng,
        body.defaultMapZoom ?? current.defaultMapZoom,
        body.telemetryRetentionMonths ?? current.telemetryRetentionMonths,
      ],
    );
    return result.rows[0];
  }
}
