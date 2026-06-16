export interface IngestConfig {
  healthPort: number;
  tcpPort: number;
  udpPort: number;
  databaseUrl: string;
}

export function getConfig(): IngestConfig {
  return {
    healthPort: Number(process.env.INGEST_HEALTH_PORT ?? 3002),
    tcpPort: Number(process.env.TELTONIKA_TCP_PORT ?? 5027),
    udpPort: Number(process.env.TELTONIKA_UDP_PORT ?? 5027),
    databaseUrl:
      process.env.DATABASE_URL ??
      'postgresql://vehiclelinq:change-me@localhost:5432/vehiclelinq',
  };
}
