# Plan: Multi-company voertuigvolgsysteem met Teltonika-integratie

## Samenvatting

Dit plan beschrijft een greenfield webplatform waarmee meerdere bedrijven hun voertuigen live op een kaart kunnen volgen, rit- en locatiehistorie kunnen terugkijken en modules per bedrijf kunnen in- of uitschakelen. Het systeem wordt self-hosted uitgerold via `setup.sh`, ondersteunt directe ingestie van Teltonika-trackers (`FMC130`, `FMC150`, `FMC650`) via het Teltonika AVL/Codec-protocol en wordt ontworpen als multi-user / multi-company platform met een centrale superadmin en bedrijfsspecifieke beheerders.

Gekozen uitgangspunten:
- Live tracking + historie in fase 1
- Multi-company met `superadmin` + `company admin` + `viewer`
- Directe ingestie van Teltonika-apparaten
- Self-hosting via Docker Compose aangestuurd door `setup.sh`
- Modulesysteem als feature flags per bedrijf, voorbereid op latere uitbreidbare modules
- Bewaartermijn telemetrie: standaard 12 maanden

## Huidige Situatie Analyse

Gebaseerd op verkenning van de repository:
- De projectroot `/Users/bas/Documents/trae_projects/vehiclelinq` bevat nog geen applicatiecode.
- Er was nog geen `.trae/documents/` map aanwezig.
- Er is geen bestaande README, applicatiestructuur, databaseconfiguratie of deploymentconfig aanwezig.
- Dit is dus een greenfield implementatie; alle hieronder genoemde paden zijn nieuwe bestanden en mappen die in de uitvoeringsfase aangemaakt worden.

Belangrijkste implicatie:
- De architectuur moet volledig worden vastgelegd, inclusief stackkeuze, mappenstructuur, rollenmodel, device-inname, databaseontwerp, beheerinterface en installatieflow.

## Aannames En Beslissingen

### Product- en scopebeslissingen
- Fase 1 bevat: live kaart, voertuigenlijst, voertuigdetail, huidige status, rit-/locatiehistorie, trackerbeheer, gebruikersbeheer, bedrijvenbeheer, modulebeheer per bedrijf, audit logging en basisrapportage op voertuigniveau.
- Buiten scope voor fase 1: facturatie, route-optimalisatie, geavanceerde onderhoudsmodules, driver behavior scoring, CAN-bus decoding buiten standaard AVL-velden, mobiele app en een generiek plugin-runtime systeem.
- Modules worden in fase 1 zichtbaar en configureerbaar per bedrijf, maar technisch geïmplementeerd als een interne registry + database feature flags, niet als dynamisch laadbare externe plugins.

### Technische hoofdkeuzes
- Monorepo met `pnpm` workspaces om frontend, backend en ingest-service in één codebase te beheren.
- Frontend: `React 18` + `Vite` + `TypeScript` + `Tailwind CSS` + `MapLibre GL JS`.
- Backend API: `NestJS` + `TypeScript` voor beheer-API, auth, RBAC, configuratie en querylogica.
- Tracker-ingest: aparte Node/Nest microservice met ruwe `TCP` en `UDP` listeners voor Teltonika AVL/Codec-berichten.
- Database: `PostgreSQL 16` met `TimescaleDB` extensie voor efficiënte opslag en querying van tijdreeksdata.
- Queue/cache: `Redis` voor achtergrondtaken, sessieondersteuning en buffering van device-events.
- Reverse proxy: `Caddy` voor TLS en routing, omdat deze eenvoudig met self-hosting en automatische certificaten werkt.
- Containerorchestratie: `Docker Compose` voor lokale en serverinstallatie.

### Security en tenancy
- Multi-tenancy wordt logisch afgedwongen op applicatie- en datalaag met verplichte `company_id` scoping op alle bedrijfsdata.
- Centrale tabellen zoals platformgebruikers, audit events en modules krijgen expliciete scheiding tussen platformscope en companyscope.
- Rollen in fase 1:
  - `superadmin`: beheert platforminstellingen, alle bedrijven, globale modules, retention en initiële bootstrap
  - `company_admin`: beheert gebruikers, voertuigen, trackers, bedrijfsinstellingen en moduletoegang binnen één bedrijf
  - `viewer`: read-only kaart, voertuigen en historie binnen één bedrijf
- Auth in fase 1: e-mail + wachtwoord + JWT access/refresh tokens; SSO/MFA wordt voorbereid maar niet uitgevoerd.

### Kaart en configuratie
- Kaartlaag wordt configureerbaar via de admininterface met een databasegedreven `map_provider` configuratie.
- Standaard wordt gestart met OpenStreetMap-compatibele tiles; productiegebruik kan via de webinterface worden omgezet naar een eigen tile-URL/provider.
- Alle functionele applicatie-instellingen behalve infrastructuur/bootstrap lopen via de webinterface en database.

### Dataretentie
- Ruwe telemetrie, posities en ritdata worden standaard 12 maanden bewaard.
- Retentiebeleid wordt als platforminstelling opgeslagen zodat dit later per bedrijf uitbreidbaar is zonder het datamodel te breken.

## Voorgestelde Wijzigingen

### 1. Repository- en workspace-opzet

Nieuwe bestanden en mappen:
- `package.json`
- `pnpm-workspace.yaml`
- `.gitignore`
- `.editorconfig`
- `.env.example`
- `README.md`
- `docker-compose.yml`
- `setup.sh`
- `infra/caddy/Caddyfile`
- `infra/postgres/init/`
- `apps/web/`
- `apps/api/`
- `apps/ingest/`
- `packages/shared/`
- `docs/architecture/`

Wat:
- Een monorepo met drie apps en een gedeeld package.

Waarom:
- Eén taal en type-systeem over frontend/backend/ingest heen verlaagt complexiteit.
- Teltonika-ingest vereist een aparte runtime met andere lifecycle dan de beheer-API.

Hoe:
- `apps/web`: beheerdersinterface en kaartdashboard
- `apps/api`: REST API, auth, RBAC, configuratie, query’s, auditlogica
- `apps/ingest`: device listener, protocol parsing, device session handling, event persistency
- `packages/shared`: gedeelde DTO’s, enums, rollen, modulesleutels, API-contracten

### 2. Frontend webapp

Nieuwe bestanden en mappen:
- `apps/web/package.json`
- `apps/web/vite.config.ts`
- `apps/web/tailwind.config.ts`
- `apps/web/src/main.tsx`
- `apps/web/src/app/router.tsx`
- `apps/web/src/app/providers/`
- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/auth.ts`
- `apps/web/src/lib/maps/`
- `apps/web/src/features/auth/`
- `apps/web/src/features/dashboard/`
- `apps/web/src/features/companies/`
- `apps/web/src/features/vehicles/`
- `apps/web/src/features/trackers/`
- `apps/web/src/features/history/`
- `apps/web/src/features/modules/`
- `apps/web/src/features/users/`
- `apps/web/src/features/settings/`

Wat:
- Desktop-first beheerinterface met responsive aanpassingen voor tablets en mobiel.

Waarom:
- De gebruiker wil dat beheer en configuratie via de webinterface gebeuren.
- Een duidelijke scheiding per domein maakt de latere module-uitbreiding beheersbaar.

Hoe:
- Routes:
  - `/login`
  - `/platform/companies`
  - `/platform/modules`
  - `/company/:companyId/dashboard`
  - `/company/:companyId/vehicles`
  - `/company/:companyId/vehicles/:vehicleId`
  - `/company/:companyId/history`
  - `/company/:companyId/trackers`
  - `/company/:companyId/users`
  - `/company/:companyId/settings`
- Dashboard toont:
  - live kaart met voertuigmarkers en statuskleur
  - filter op bedrijf, voertuiggroep, trackerstatus en online/offline
  - zijpaneel met laatste snelheid, contactstatus, ignition, laatste ping
- Historiepagina toont:
  - tijdsselectie
  - routepolyline
  - event markers (start, stop, overspeed indien beschikbaar)
  - samenvatting per rit
- Modulespagina toont:
  - beschikbare modules uit registry
  - status per bedrijf
  - afhankelijkheden / vereisten voor toekomstige modules

### 3. Backend API

Nieuwe bestanden en mappen:
- `apps/api/package.json`
- `apps/api/src/main.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/config/`
- `apps/api/src/auth/`
- `apps/api/src/users/`
- `apps/api/src/companies/`
- `apps/api/src/vehicles/`
- `apps/api/src/trackers/`
- `apps/api/src/history/`
- `apps/api/src/modules/`
- `apps/api/src/platform-settings/`
- `apps/api/src/audit/`
- `apps/api/src/health/`
- `apps/api/src/common/guards/`
- `apps/api/src/common/interceptors/`
- `apps/api/src/common/decorators/`

Wat:
- Centrale beheer- en query-API voor alle webinteracties.

Waarom:
- Multi-company autorisatie, configuratie, auditlogging en aggregatie horen niet in de ingest-service thuis.

Hoe:
- REST API met versieprefix `/api/v1`
- JWT auth met refresh token rotatie
- Guards voor:
  - authenticated
  - role-based access
  - company scope enforcement
- Belangrijkste endpoints:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `GET /api/v1/me`
  - `GET /api/v1/platform/companies`
  - `POST /api/v1/platform/companies`
  - `GET /api/v1/companies/:companyId/vehicles`
  - `POST /api/v1/companies/:companyId/vehicles`
  - `GET /api/v1/companies/:companyId/vehicles/:vehicleId/live`
  - `GET /api/v1/companies/:companyId/vehicles/:vehicleId/history`
  - `GET /api/v1/companies/:companyId/trackers`
  - `POST /api/v1/companies/:companyId/trackers`
  - `PATCH /api/v1/companies/:companyId/modules/:moduleKey`
  - `GET /api/v1/platform/settings`
  - `PATCH /api/v1/platform/settings`
- API levert alleen bedrijfsdata terug binnen de scope van de ingelogde gebruiker; `superadmin` kan expliciet tussen bedrijven schakelen.

### 4. Teltonika ingest-service

Nieuwe bestanden en mappen:
- `apps/ingest/package.json`
- `apps/ingest/src/main.ts`
- `apps/ingest/src/server/tcp-server.ts`
- `apps/ingest/src/server/udp-server.ts`
- `apps/ingest/src/teltonika/codec8e-parser.ts`
- `apps/ingest/src/teltonika/imei-handshake.ts`
- `apps/ingest/src/teltonika/io-element-mapper.ts`
- `apps/ingest/src/pipeline/device-session.service.ts`
- `apps/ingest/src/pipeline/telemetry-normalizer.service.ts`
- `apps/ingest/src/pipeline/position-writer.service.ts`
- `apps/ingest/src/pipeline/event-publisher.service.ts`
- `apps/ingest/src/config/`

Wat:
- Aparte service voor directe trackerconnecties van Teltonika-apparaten.

Waarom:
- TCP/UDP state handling, binary parsing en protocol acknowledgements hebben andere stabiliteits- en schaalvereisten dan de web-API.

Hoe:
- Ondersteunt fase 1 direct de Teltonika handshake op IMEI-niveau en AVL record verwerking.
- Parser normaliseert berichten naar een intern `TelemetryEnvelope`.
- Device lookup koppelt IMEI aan een geregistreerde tracker en voertuig.
- Ingestflow:
  - tracker maakt TCP/UDP verbinding
  - service valideert IMEI
  - service parseert AVL payload
  - records worden genormaliseerd
  - actuele voertuigstatus wordt geüpdatet
  - tijdreeksposities en events worden opgeslagen
  - acknowledgements worden teruggestuurd naar tracker
- Onbekende IMEI’s worden gelogd als quarantined devices en niet aan een bedrijf gekoppeld totdat een admin ze registreert.

### 5. Database- en datamodel

Nieuwe bestanden en mappen:
- `apps/api/prisma/schema.prisma` of `apps/api/src/database/migrations/` (keuze vastgelegd hieronder)
- `apps/api/src/database/`
- `apps/api/src/database/migrations/001_initial.sql`
- `apps/api/src/database/migrations/002_timeseries.sql`
- `apps/api/src/database/migrations/003_retention_jobs.sql`

Gekozen implementatiebeslissing:
- Gebruik SQL-migraties met `node-pg-migrate` in plaats van Prisma ORM.

Waarom:
- TimescaleDB, hypertables, retention policies en performance-indexen zijn eenvoudiger en explicieter te beheren met handmatige SQL-migraties.

Hoe:
- Kernentiteiten:
  - `users`
  - `companies`
  - `company_memberships`
  - `vehicles`
  - `trackers`
  - `vehicle_last_state`
  - `telemetry_positions`
  - `trip_summaries`
  - `device_events`
  - `module_registry`
  - `company_modules`
  - `platform_settings`
  - `audit_logs`
- Datamodelprincipes:
  - `companies.id` is verplichte foreign key op alle bedrijfsdomeintabellen
  - `trackers.imei` is uniek
  - `vehicles` en `trackers` zijn los gekoppeld zodat vervanging van hardware mogelijk blijft
  - `vehicle_last_state` bevat de actuele snapshot voor snelle kaartweergave
  - `telemetry_positions` wordt Timescale hypertable op `recorded_at`
  - `trip_summaries` wordt opgebouwd via achtergrondtaak uit ruwe posities
- Indexen:
  - `(company_id, vehicle_id, recorded_at desc)` op tijdreeksdata
  - `(imei)` uniek op trackers
  - `(company_id, status)` op voertuigen
  - `(company_id, module_key)` uniek op `company_modules`

### 6. Modulesysteem

Nieuwe bestanden en mappen:
- `packages/shared/src/modules/module-keys.ts`
- `packages/shared/src/modules/module-definition.ts`
- `apps/api/src/modules/module-registry.ts`
- `apps/web/src/features/modules/moduleCatalog.ts`

Wat:
- Feature-flag-gedreven modulesysteem per bedrijf.

Waarom:
- De gebruiker wil voorbereid zijn op toekomstige uitbreidingen, maar nog geen volledige plugin-architectuur bouwen.

Hoe:
- Elke module krijgt:
  - stabiele `module_key`
  - naam, omschrijving en categorie
  - status `active`, `inactive`, `hidden`
  - lijst met vereiste permissies en optionele feature dependencies
- In fase 1 worden minimaal voorbereid:
  - `core_tracking`
  - `history_replay`
  - `maintenance_placeholder`
  - `compliance_placeholder`
- Frontend gebruikt module flags om navigatie en schermen conditioneel te tonen.
- Backend gebruikt module guards om endpoints per bedrijf te blokkeren of toe te staan.

### 7. Configuratie via webinterface

Nieuwe bestanden en mappen:
- `apps/api/src/platform-settings/`
- `apps/web/src/features/settings/`

Wat:
- Bijna alle runtime-configuratie wordt beheerd via de webinterface.

Waarom:
- Dit is expliciet gevraagd; de serverbeheerder moet na installatie zo min mogelijk handmatig in configbestanden wijzigen.

Hoe:
- Via webinterface configureerbaar:
  - bedrijven
  - gebruikers en rollen
  - voertuigen
  - trackers en IMEI-koppelingen
  - kaartprovider / tile URL / default center / zoom
  - retentiebeleid
  - module-activatie per bedrijf
  - platform branding basisinstellingen
- Niet via webinterface maar via infra/bootstrap:
  - database wachtwoorden
  - domeinnaam / TLS
  - poorten
  - container resources
  - eerste superadmin bootstrap-token of tijdelijke credentials

### 8. Setup- en deploymentflow

Nieuwe bestanden en mappen:
- `setup.sh`
- `.env.example`
- `docker-compose.yml`
- `infra/caddy/Caddyfile`
- `README.md`

Wat:
- Eén installatie-entrypoint voor self-hosting op eigen server.

Waarom:
- De gebruiker wil een systeem dat eenvoudig op een eigen server te installeren is, met de rest van de configuratie via de webinterface.

Hoe:
- `setup.sh` voert uit:
  - controle op ondersteund OS
  - installatie of validatie van Docker Engine + Compose plugin
  - aanmaak van `.env`
  - build/pull van images
  - opstarten van `postgres`, `redis`, `api`, `ingest`, `web`, `caddy`
  - uitvoeren van database-migraties
  - seeden van module registry
  - bootstrap van eerste `superadmin`
  - healthcheck en eindrapport met URL en tijdelijke logininstructies
- `README.md` documenteert:
  - installatie
  - upgradepad
  - backup/herstel
  - poorten
  - probleemoplossing

### 9. Minimale systeemeisen

Worden expliciet opgenomen in `README.md`:
- Aanbevolen OS: `Ubuntu Server 24.04 LTS`
- CPU: minimaal `4 vCPU`
- RAM: minimaal `8 GB`
- Opslag: minimaal `100 GB SSD`
- Netwerk: publiek bereikbaar domein of reverse proxy, open poorten `80`, `443`, plus devicepoort(en) voor Teltonika ingest zoals `5027/TCP` en optioneel `5027/UDP`
- Voor productie met grotere vloot:
  - `8 vCPU`
  - `16 GB RAM`
  - snellere SSD/NVMe
  - aparte databasevolume-backups

### 10. Observability, auditing en operaties

Nieuwe bestanden en mappen:
- `apps/api/src/health/`
- `apps/api/src/audit/`
- `apps/ingest/src/health/`
- `docs/architecture/operational-runbook.md`

Wat:
- Basisbeheer voor uptime, foutdiagnostiek en wijzigingssporen.

Waarom:
- Self-hosting en multi-company vereisen inzicht in storingen en beheerdersacties.

Hoe:
- Health endpoints voor web/API/ingest
- Auditlog voor:
  - login
  - gebruikersbeheer
  - trackerkoppelingen
  - modulewijzigingen
  - platforminstellingen
- Structured logging met correlatie-id’s
- Backupscope:
  - PostgreSQL dumps
  - `.env`
  - Caddy/TLS-data

## Implementatievolgorde

1. Basis monorepo, package management en Docker Compose inrichten.
2. PostgreSQL/TimescaleDB, Redis en Caddy infrastructuur neerzetten.
3. SQL-migraties schrijven voor tenancy, auth, voertuigen, trackers, telemetrie en modules.
4. Backend API opzetten met auth, RBAC, company scoping en instellingen.
5. Ingest-service bouwen voor Teltonika handshake, parsing, normalisatie en opslag.
6. Webapp bouwen voor login, dashboard, voertuigen, trackers, historie, bedrijven en instellingen.
7. Modulesysteem en conditionele navigatie activeren.
8. `setup.sh`, documentatie, seedlogica en bootstrapflow afronden.
9. Testen, hardenen en deploy/upgrade handleiding completeren.

## Acceptatiecriteria

- Een `superadmin` kan bedrijven aanmaken en beheren.
- Een `company_admin` kan binnen zijn eigen bedrijf voertuigen, trackers, gebruikers en module-instellingen beheren.
- Een Teltonika tracker kan direct met het platform verbinden via het ingest-endpoint en posities opslaan.
- Live voertuiglocaties zijn zichtbaar op een kaart binnen de juiste bedrijfsscope.
- Historie van ritten/locaties is opvraagbaar voor minimaal 12 maanden.
- Onbekende IMEI’s worden niet aan data van andere bedrijven gekoppeld.
- Modules zijn per bedrijf aan/uit te zetten en beïnvloeden zichtbare functionaliteit.
- Het systeem is te installeren via `setup.sh` op een schone ondersteunde server.
- De meeste functionele instellingen zijn na installatie via de webinterface te beheren.

## Verificatiestappen

Tijdens uitvoering moeten minimaal de volgende controles worden gedaan:

### Technische verificatie
- `pnpm install` draait succesvol op de workspace.
- `docker compose up -d` start alle services zonder fout.
- Database-migraties draaien schoon op een lege database.
- Health endpoints van `web`, `api` en `ingest` reageren positief.

### API en security
- Auth flow test: login, refresh, logout/intrekking.
- Autorisatietest: `company_admin` ziet geen data van andere bedrijven.
- `viewer` kan geen schrijfoperaties uitvoeren.
- `superadmin` kan bedrijven wisselen zonder dat company scoping breekt.

### Trackingflow
- Test met voorbeeld Teltonika payloads voor handshake en AVL records.
- Verificatie dat posities correct in `vehicle_last_state` en `telemetry_positions` terechtkomen.
- Verificatie dat tracker acknowledgements correct worden teruggestuurd.
- Verificatie dat onbekende IMEI’s als quarantine/event gelogd worden.

### Frontend
- Dashboard toont live voertuigen op de kaart.
- Filters en voertuigdetail werken op basis van bedrijfscontext.
- Historiepagina toont route en samenvatting over een geselecteerd tijdvenster.
- Module-activering wijzigt zichtbaar de navigatie en endpointtoegang.

### Installatie en documentatie
- `setup.sh` werkt op een schone Ubuntu 24.04 testserver.
- `README.md` bevat reproduceerbare installatie- en update-instructies.
- Documentatie bevat minimale systeemeisen, poorten, backup- en restorestappen.

## Open Uitvoeringsnotities

Deze keuzes liggen vast voor uitvoering en vereisen geen extra productbeslissingen:
- Node/TypeScript monorepo met `pnpm`
- `NestJS` voor API en ingest-service
- `PostgreSQL + TimescaleDB + Redis + Caddy`
- `React + Vite + Tailwind + MapLibre`
- Docker Compose self-hosting via `setup.sh`
- Multi-company met `superadmin`, `company_admin`, `viewer`
- Teltonika direct protocol ingest
- Modules als feature flags per bedrijf

Als tijdens uitvoering een Teltonika-model afwijkende AVL-velden aanlevert, wordt dit opgelost via uitbreidbare IO-element mapping, zonder wijziging van het kerncontract van `TelemetryEnvelope`.
