# Operationeel Runbook

## Gezondheidschecks

- API: `GET /health`
- Ingest: `GET http://localhost:3002/health`
- Web: controleer of de Vite-webapp via Caddy bereikbaar is

## Belangrijkste services

- `postgres`: tenantdata, telemetrie en auditlogs
- `redis`: cache en toekomstige queue-ondersteuning
- `api`: beheer-API en tenancy/auth
- `ingest`: Teltonika TCP/UDP ingest
- `web`: administratorinterface
- `caddy`: reverse proxy

## Incidentrespons

- Geen live updates:
  - controleer `ingest` logs
  - controleer of poort `5027` open staat
  - valideer IMEI-koppeling in trackerbeheer
- Loginproblemen:
  - controleer `api` logs
  - valideer `JWT_SECRET` en `JWT_REFRESH_SECRET`
- Kaart laadt niet:
  - controleer `MAP_TILE_URL`
  - valideer externe bereikbaarheid van de tile provider

## Back-up en herstel

- PostgreSQL dump dagelijks
- `.env` en Caddy data/versioned backups bewaren
- Herstel eerst database, daarna `.env`, daarna `docker compose up -d`
