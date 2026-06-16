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

## Installatie

1. Clone de repository.
2. Controleer `.env.example` en kopieer naar `.env` indien nodig.
3. Voer het installatiescript uit:

```bash
chmod +x setup.sh
./setup.sh
```

4. Open daarna [http://localhost](http://localhost).

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
