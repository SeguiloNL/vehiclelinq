# Plan: stap-voor-stap installatie-instructie voor VehicleLinq

## Samenvatting

Dit plan beschrijft hoe de installatiehandleiding van `VehicleLinq` wordt uitgebreid naar een complete, servergerichte stap-voor-stap instructie voor self-hosting. De uitvoering richt zich primair op documentatie, zodat een beheerder het systeem reproduceerbaar kan installeren op een eigen server. Daarnaast wordt een kleine afstemming voorzien tussen de documentatie en `setup.sh`, zodat aangepaste `.env`-waarden niet alleen worden beschreven maar ook correct door het script worden gebruikt.

Doel van de uitvoering:
- Een duidelijke installatiehandleiding schrijven voor een schone server
- Voorwaarden, poorten, configuratie, verificatie en eerste login expliciet maken
- Veelvoorkomende fouten en controlepunten documenteren
- Documentatie en installatiegedrag inhoudelijk op elkaar laten aansluiten

## Huidige Situatie Analyse

Gebaseerd op de huidige codebase:

- `README.md` bevat al een korte installatiesectie, maar die is nu te beknopt voor een echte serverinstallatie.
- `setup.sh` is het centrale installatiescript en voert momenteel deze hoofstappen uit:
  - `.env` aanmaken uit `.env.example`
  - Docker/Docker Compose controleren
  - `postgres` en `redis` starten
  - SQL-migraties uitvoeren
  - `api`, `ingest`, `web` en `caddy` bouwen en starten
  - bootstrap-login tonen
- `.env.example` bevat alle relevante runtime-variabelen voor poorten, database, JWT, kaartinstellingen en bootstrap-admin.
- `docker-compose.yml` bevestigt de actieve services, exposed poorten en self-hosting-aanpak via Docker Compose.
- `docs/architecture/operational-runbook.md` bevat al operationele checks en incidentrespons, maar geen installatiepad vanaf een lege server.

Belangrijkste huidige hiaten:
- Geen volledige server-voorbereiding in de documentatie
- Geen expliciete volgorde voor clone, `.env`-controle, scriptuitvoering en verificatie
- Geen duidelijke uitleg welke poorten/open firewall nodig zijn in de installatiestappen
- Geen onderscheid tussen snelle lokale installatie en productie/self-hosted installatie
- Mogelijke mismatch: `setup.sh` gebruikt voor `pg_isready` en `psql` shell-defaults (`${POSTGRES_USER:-vehiclelinq}` enz.) en leest de waarden uit `.env` niet expliciet in de shell in; aangepaste `.env`-waarden kunnen daardoor niet volledig overeenkomen met wat de documentatie zou adviseren

## Aannames En Beslissingen

- De gebruiker wil een praktisch uitvoerbare installatiehandleiding, niet alleen een samenvatting.
- De uitvoeringsfase blijft binnen scope van installatie/documentatie en raakt geen niet-gerelateerde productfunctionaliteit.
- De primaire doelgroep is een systeembeheerder of technisch verantwoordelijke die `VehicleLinq` op een eigen Linux-server installeert.
- De handleiding wordt in het Nederlands geschreven, consistent met het verzoek.
- De aanbevolen primaire doelgroep/omgeving blijft `Ubuntu Server 24.04 LTS`, omdat dit al als aanbevolen OS in `README.md` staat.
- De installatie-instructie wordt opgesplitst in:
  - een compacte overzichtssectie in `README.md`
  - een volledige stapsgewijze handleiding in een apart document
- De uitvoering corrigeert `setup.sh` zodanig dat documentatie over aangepaste `.env`-waarden betrouwbaar is.

## Voorgestelde Wijzigingen

### 1. `README.md` uitbreiden en herstructureren

Bestand:
- `README.md`

Wat:
- De huidige installatiesectie herschrijven tot een kort, scanbaar overzicht met verwijzing naar de uitgebreide installatiehandleiding.
- De secties voor systeemeisen, poorten, bootstrap-login en runtime-configuratie behouden, maar beter structureren.

Waarom:
- `README.md` moet een snel startpunt blijven, maar hoeft niet alle detailstappen zelf te bevatten.
- Een uitgebreid stappenplan in alleen `README.md` maakt het document onnodig lang en minder scanbaar.

Hoe:
- `README.md` krijgt:
  - korte introductie
  - systeemeisen
  - benodigde poorten
  - snelle installatie in 4-6 stappen
  - link/verwijzing naar de uitgebreide handleiding
  - bootstrap-login
  - korte sectie voor verificatie en troubleshooting-verwijzing

### 2. Nieuwe uitgebreide installatiehandleiding toevoegen

Nieuw bestand:
- `docs/installatie-handleiding.md`

Wat:
- Een volledige stap-voor-stap installatiehandleiding vanaf een schone server toevoegen.

Waarom:
- De gebruiker vraagt expliciet om stap-voor-stap installatie-instructie.
- Dit hoort thuis in een dedicated document dat zowel voorbereiding als nazorg kan bevatten.

Hoe:
- De handleiding bevat minimaal deze onderdelen:
  - doel en doelgroep
  - aanbevolen serverconfiguratie
  - vereisten vooraf
  - benodigde open poorten
  - server voorbereiden
  - repository clonen
  - `.env` controleren en minimale verplichte waarden nalopen
  - `setup.sh` uitvoerbaar maken
  - `setup.sh` draaien
  - controleren of containers correct draaien
  - health endpoints controleren
  - eerste login uitvoeren
  - eerste beheeracties na login
  - basis troubleshooting
  - update/upgrade instructie
  - back-up aandachtspunten

De stappen worden concreet geformuleerd met voorbeeldcommando’s zoals:
- `git clone ...`
- `cd vehiclelinq`
- `cp .env.example .env`
- `chmod +x setup.sh`
- `./setup.sh`
- `docker compose ps`
- `docker compose logs api`

### 3. Installatie-instructie afstemmen op bestaand operationeel runbook

Bestand:
- `docs/architecture/operational-runbook.md`

Wat:
- Alleen waar nodig een verwijzing toevoegen vanuit de installatiehandleiding en/of een kleine afstemming aanbrengen op terminologie en healthcheck-routes.

Waarom:
- Installatie en operations moeten logisch op elkaar aansluiten.
- Een beheerder moet na installatie direct weten waar vervolgdiagnostiek staat.

Hoe:
- De nieuwe installatiehandleiding verwijst voor storingsopvolging naar het runbook.
- Indien nodig wordt de healthcheck-terminologie in beide documenten gelijkgetrokken.

### 4. `setup.sh` corrigeren voor `.env`-consistente uitvoering

Bestand:
- `setup.sh`

Wat:
- Het script aanpassen zodat waarden uit `.env` ook in het shell-proces beschikbaar zijn wanneer `pg_isready` en `psql` worden aangeroepen.

Waarom:
- De documentatie zal de gebruiker instrueren om `.env` te controleren of aan te passen.
- Zonder expliciet inlezen van `.env` gebruikt `setup.sh` voor sommige commando’s alleen fallback-defaults, wat verwarrend of foutgevoelig is bij aangepaste waarden.

Hoe:
- Na het aanmaken/controleren van `.env` wordt het bestand veilig ingelezen in de shellomgeving, bijvoorbeeld via een gecontroleerde `set -a` / `source .env` aanpak.
- Daarna gebruiken alle shellcommando’s dezelfde waarden als Docker Compose.
- De wijziging blijft beperkt tot installatiebetrouwbaarheid en verandert geen functionele productscope.

### 5. Verificatiestappen expliciet opnemen in documentatie

Bestanden:
- `README.md`
- `docs/installatie-handleiding.md`

Wat:
- Duidelijke post-install controlepunten toevoegen.

Waarom:
- Een installatiehandleiding is pas bruikbaar als de gebruiker ook kan bevestigen dat de installatie geslaagd is.

Hoe:
- Minimaal opnemen:
  - `docker compose ps`
  - webinterface bereikbaar op `http://localhost` of eigen domein
  - API health bereikbaar
  - ingest health bereikbaar
  - bootstrap-login werkt
  - eerste aanbevolen adminacties na login

## Uitvoeringsvolgorde

1. `README.md`, `setup.sh`, `.env.example`, `docker-compose.yml` en `operational-runbook.md` nogmaals naast elkaar lezen om terminologie en stappen exact te alignen.
2. `docs/installatie-handleiding.md` schrijven met volledige stap-voor-stap installatieflow.
3. `README.md` herschrijven naar compacte overzichtsversie met verwijzing naar de uitgebreide handleiding.
4. `setup.sh` aanpassen zodat `.env`-waarden consistent worden gebruikt tijdens migratie- en health-gerelateerde shellcommando’s.
5. Indien nodig kleine tekstuele afstemming in `docs/architecture/operational-runbook.md` doorvoeren.
6. Documentatie nalopen op consistentie in poorten, URL’s, bootstrap-login en vereisten.

## Acceptatiecriteria

- Er is een duidelijke Nederlandstalige stap-voor-stap installatiehandleiding aanwezig voor self-hosting.
- De handleiding beschrijft voorbereiding, uitvoering, verificatie en eerste login.
- `README.md` verwijst helder naar de uitgebreide handleiding en blijft overzichtelijk.
- De documentatie noemt expliciet systeemeisen en benodigde poorten.
- De documentatie en `setup.sh` spreken elkaar niet tegen over `.env`-gebruik.
- Een beheerder kan op basis van de documentatie het systeem op een schone server installeren zonder extra aannames te hoeven maken.

## Verificatiestappen

Tijdens uitvoering moeten minimaal de volgende controles worden gedaan:

- Documentatiecontrole:
  - verifieer dat alle genoemde bestanden en commando’s echt bestaan
  - verifieer dat genoemde poorten overeenkomen met `docker-compose.yml`
  - verifieer dat bootstrap-inloggegevens overeenkomen met `.env.example`
- Scriptcontrole:
  - controleer dat `setup.sh` qua logica klopt met de beschreven installatiestappen
  - controleer dat `.env`-waarden ook gebruikt worden voor scriptcommando’s buiten Docker Compose
- Kwaliteitscontrole:
  - leesbaarheid van het stappenplan
  - logische volgorde zonder verborgen aannames
  - duidelijke foutopvolging of verificatiepunten

## Buiten Scope

- Nieuwe productfunctionaliteit
- Wijzigingen aan multi-company logica, trackingfeatures of frontendgedrag
- Uitgebreide deploymentvarianten buiten de huidige Docker Compose self-hosting aanpak
- CI/CD of automatische cloud deployment
