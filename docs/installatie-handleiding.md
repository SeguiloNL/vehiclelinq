# Installatiehandleiding VehicleLinq

## Doel

Deze handleiding beschrijft hoe je `VehicleLinq` stap voor stap installeert op een eigen server. De instructie is bedoeld voor een beheerder die het platform self-hosted wil draaien met Docker Compose.

## Doelgroep

Deze handleiding is bedoeld voor:

- systeembeheerders
- DevOps engineers
- technische beheerders die een eigen fleet-tracking platform willen hosten

## Aanbevolen omgeving

Gebruik bij voorkeur:

- `Ubuntu Server 24.04 LTS`
- minimaal `4 vCPU`
- minimaal `8 GB RAM`
- minimaal `100 GB SSD`

Voor grotere omgevingen of meer voertuigen is aanbevolen:

- `8 vCPU`
- `16 GB RAM`
- NVMe-opslag

## Vereisten vooraf

Zorg dat de server aan de volgende voorwaarden voldoet:

- Docker Engine is geinstalleerd
- Docker Compose plugin is beschikbaar via `docker compose`
- Git is geinstalleerd
- De server heeft internettoegang om images en dependencies op te halen
- De firewall staat de benodigde poorten toe

Controleer dit met:

```bash
docker --version
docker compose version
git --version
```

## Benodigde poorten

Zorg dat minimaal deze poorten open staan:

- `80/tcp` voor HTTP via Caddy
- `443/tcp` voor HTTPS via Caddy
- `5027/tcp` voor Teltonika TCP ingest
- `5027/udp` voor Teltonika UDP ingest

Intern of voor beheer zijn ook relevant:

- `3000/tcp` API direct
- `3002/tcp` ingest health endpoint
- `5173/tcp` webapp direct
- `5432/tcp` PostgreSQL
- `6379/tcp` Redis

Als je alleen via Caddy wilt werken, hoef je `3000`, `3002` en `5173` niet publiek te exposen buiten je beheeromgeving.

## Stap 1: Server voorbereiden

Log in op de server en werk het systeem bij:

```bash
sudo apt update
sudo apt upgrade -y
```

Installeer Git als dat nog niet aanwezig is:

```bash
sudo apt install -y git
```

Installeer Docker Engine en Docker Compose plugin als deze nog ontbreken. Gebruik hiervoor de officiele Docker-installatie-instructie voor Ubuntu.

Controleer daarna:

```bash
docker --version
docker compose version
```

## Stap 2: Repository clonen

Clone de repository naar de server:

```bash
git clone <REPOSITORY_URL> vehiclelinq
cd vehiclelinq
```

Vervang `<REPOSITORY_URL>` door de URL van jouw repository.

## Stap 3: Omgevingsconfiguratie voorbereiden

Maak een `.env` bestand op basis van `.env.example`:

```bash
cp .env.example .env
```

Open daarna `.env` in een editor:

```bash
nano .env
```

Controleer of pas minimaal deze waarden aan:

- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `BOOTSTRAP_SUPERADMIN_EMAIL`
- `BOOTSTRAP_SUPERADMIN_PASSWORD`

Controleer daarnaast of deze poorten passen bij jouw omgeving:

- `WEB_PORT`
- `API_PORT`
- `INGEST_HEALTH_PORT`
- `TELTONIKA_TCP_PORT`
- `TELTONIKA_UDP_PORT`
- `POSTGRES_PORT`
- `REDIS_PORT`

Als je een externe tile-provider of aangepaste kaartconfiguratie wilt gebruiken, controleer ook:

- `MAP_TILE_URL`
- `MAP_ATTRIBUTION`
- `DEFAULT_MAP_LAT`
- `DEFAULT_MAP_LNG`
- `DEFAULT_MAP_ZOOM`

## Stap 4: Installatiescript uitvoerbaar maken

Geef het installatiescript uitvoerrechten:

```bash
chmod +x setup.sh
```

## Stap 5: Installatie uitvoeren

Voer daarna het script uit:

```bash
./setup.sh
```

Het script voert automatisch deze stappen uit:

- `.env` aanmaken als het bestand nog niet bestaat
- Docker en Docker Compose controleren
- `postgres` en `redis` starten
- wachten tot PostgreSQL gereed is
- database-migraties uitvoeren
- `api`, `ingest`, `web` en `caddy` bouwen en starten
- bootstrap inloggegevens tonen

## Stap 6: Controleren of alle containers draaien

Controleer na afloop of de stack correct draait:

```bash
docker compose ps
```

Je verwacht minimaal deze services:

- `postgres`
- `redis`
- `api`
- `ingest`
- `web`
- `caddy`

Als een service niet draait, bekijk dan de logs:

```bash
docker compose logs api
docker compose logs ingest
docker compose logs web
docker compose logs caddy
```

## Stap 7: Health endpoints controleren

Controleer of de services reageren:

```bash
curl http://localhost/health
curl http://localhost:3000/health
curl http://localhost:3002/health
```

Verwachte uitkomsten:

- API via Caddy reageert op `http://localhost/health`
- API direct reageert op `http://localhost:3000/health`
- ingest health reageert op `http://localhost:3002/health`

## Stap 8: Eerste login uitvoeren

Open de webinterface in de browser:

- `http://localhost`

Log in met de bootstrap-gebruiker uit je `.env` bestand. Als je de defaults niet hebt aangepast, zijn dat:

- e-mail: `admin@example.com`
- wachtwoord: `ChangeMe123!`

## Stap 9: Eerste beheeracties na login

Voer na de eerste login minimaal deze acties uit:

1. wijzig het bootstrap-wachtwoord
2. controleer platforminstellingen
3. maak het eerste bedrijf aan
4. voeg gebruikers toe
5. voeg voertuigen toe
6. koppel trackers via IMEI
7. controleer kaartinstellingen en modules

## Stap 10: Teltonika trackers koppelen

Om trackers data te laten aanleveren, configureer je in het Teltonika device:

- het publieke IP-adres of domein van je server
- de juiste ingestpoort, standaard `5027`
- het juiste protocol conform je deviceconfiguratie

Zorg dat de firewall `5027/tcp` en indien nodig `5027/udp` toelaat.

## Stap 11: Basis troubleshooting

### Webinterface opent niet

Controleer:

```bash
docker compose ps
docker compose logs caddy
docker compose logs web
```

### API reageert niet

Controleer:

```bash
docker compose logs api
curl http://localhost:3000/health
```

### Ingest ontvangt geen trackerdata

Controleer:

```bash
docker compose logs ingest
```

Controleer daarnaast:

- of poort `5027` open staat
- of het device naar het juiste IP of domein wijst
- of de IMEI in VehicleLinq geregistreerd is

### Databaseproblemen

Controleer:

```bash
docker compose logs postgres
```

## Stap 12: Updates uitvoeren

Voor een update van de applicatie:

```bash
git pull
docker compose up -d --build
./setup.sh
```

Gebruik `./setup.sh` opnieuw als je zeker wilt zijn dat migraties opnieuw gecontroleerd en uitgevoerd worden.

## Stap 13: Back-ups

Maak periodiek back-ups van:

- PostgreSQL data
- `.env`
- `infra/caddy/data`
- `infra/caddy/config`

Bewaar back-ups buiten de server waarop de applicatie draait.

## Aanvullende operationele informatie

Voor vervolgdiagnostiek, incidentrespons en herstelprocedures zie:

- [operationeel runbook](./architecture/operational-runbook.md)
