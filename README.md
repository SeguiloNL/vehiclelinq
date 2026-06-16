# VehicleLinq

Self-hosted multi-company voertuigvolgsysteem met live kaartweergave, Teltonika ingest, ritgeschiedenis en voorbereide module-activatie per bedrijf.

## Kernfuncties

- Multi-company tenantmodel met `superadmin`, `company_admin` en `viewer`
- Live voertuigkaart met actuele trackerstatus
- Historie/replay per voertuig
- Directe Teltonika ingest voor `FMC130`, `FMC150` en `FMC650`
- Module-activering per bedrijf via feature flags
- Configuratie via webinterface na installatie

## Minimale systeemeisen

- OS: `Ubuntu Server 24.04 LTS` aanbevolen
- CPU: minimaal `4 vCPU`
- RAM: minimaal `8 GB`
- Opslag: minimaal `100 GB SSD`
- Netwerk:
  - HTTP `80`
  - HTTPS `443`
  - Teltonika TCP `5027`
  - Teltonika UDP `5027`

Voor productie met grotere vloot is `8 vCPU`, `16 GB RAM` en NVMe-opslag aan te raden.

## Benodigde poorten

- `80/tcp` voor HTTP
- `443/tcp` voor HTTPS
- `5027/tcp` voor Teltonika TCP ingest
- `5027/udp` voor Teltonika UDP ingest

## Snelle installatie

1. Clone de repository:

```bash
git clone <REPOSITORY_URL> vehiclelinq
cd vehiclelinq
```

2. Maak een `.env` bestand:

```bash
cp .env.example .env
```

3. Controleer minimaal deze waarden in `.env`:

- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `BOOTSTRAP_SUPERADMIN_EMAIL`
- `BOOTSTRAP_SUPERADMIN_PASSWORD`

4. Maak het installatiescript uitvoerbaar en voer het uit:

```bash
chmod +x setup.sh
./setup.sh
```

5. Controleer of de services draaien:

```bash
docker compose ps
```

6. Open daarna [http://localhost](http://localhost) en log in met de bootstrap-admin.

## Uitgebreide stap-voor-stap handleiding

Voor de volledige serverinstallatie, verificatie, troubleshooting, updates en back-ups zie:

- [docs/installatie-handleiding.md](file:///Users/bas/Documents/trae_projects/vehiclelinq/docs/installatie-handleiding.md)

## Bootstrap login

- E-mail: `admin@example.com`
- Wachtwoord: `ChangeMe123!`

Wijzig deze direct na de eerste login.

## Runtime-configuratie via webinterface

Na installatie beheer je via de webinterface:

- bedrijven
- gebruikers en rollen
- voertuigen
- trackers en IMEI-koppelingen
- kaartprovider en tile-URL
- retentie-instellingen
- modules per bedrijf

## Verificatie na installatie

Controleer minimaal:

```bash
docker compose ps
curl http://localhost/health
curl http://localhost:3000/health
curl http://localhost:3002/health
```

## Ontwikkelcommando's

```bash
pnpm install
pnpm dev:web
pnpm dev:api
pnpm dev:ingest
pnpm test
pnpm check
```

## Backups

Maak periodiek back-ups van:

- PostgreSQL data
- `.env`
- `infra/caddy/data`
- `infra/caddy/config`

## Upgradepad

1. Haal de nieuwste code op.
2. Update `.env` indien nieuwe variabelen zijn toegevoegd.
3. Voer `docker compose up -d --build` opnieuw uit.
4. Draai indien nodig de SQL-migraties opnieuw met `setup.sh`.

## Operationeel runbook

Voor operationele checks en incidentrespons zie:

- [docs/architecture/operational-runbook.md](file:///Users/bas/Documents/trae_projects/vehiclelinq/docs/architecture/operational-runbook.md)
