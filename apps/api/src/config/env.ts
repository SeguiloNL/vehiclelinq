export interface AppConfig {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  mapTileUrl: string;
  mapAttribution: string;
  defaultMapLat: number;
  defaultMapLng: number;
  defaultMapZoom: number;
  bootstrapSuperadminEmail: string;
  bootstrapSuperadminPassword: string;
}

export function getConfig(): AppConfig {
  return {
    port: Number(process.env.API_PORT ?? 3000),
    databaseUrl:
      process.env.DATABASE_URL ??
      'postgresql://vehiclelinq:change-me@localhost:5432/vehiclelinq',
    jwtSecret: process.env.JWT_SECRET ?? 'change-me-super-secret',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh-secret',
    mapTileUrl:
      process.env.MAP_TILE_URL ??
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    mapAttribution:
      process.env.MAP_ATTRIBUTION ?? '&copy; OpenStreetMap contributors',
    defaultMapLat: Number(process.env.DEFAULT_MAP_LAT ?? 52.3676),
    defaultMapLng: Number(process.env.DEFAULT_MAP_LNG ?? 4.9041),
    defaultMapZoom: Number(process.env.DEFAULT_MAP_ZOOM ?? 7),
    bootstrapSuperadminEmail:
      process.env.BOOTSTRAP_SUPERADMIN_EMAIL ?? 'admin@example.com',
    bootstrapSuperadminPassword:
      process.env.BOOTSTRAP_SUPERADMIN_PASSWORD ?? 'ChangeMe123!',
  };
}
