# Plan: productieklare kilometerregistratie-roadmap voor VehicleLinQ

## Samenvatting

Doel is om `VehicleLinQ` door te ontwikkelen van een self-hosted fleet-tracking MVP naar een pilot-ready platform dat door echte gebruikers dagelijks gebruikt kan worden voor kilometerregistratie.

De gekozen richting voor de komende fase is:

- niveau: `pilot-ready`
- doelgroep: `beheerders en bestuurders`
- eerste prioriteiten:
  - automatische ritdetectie en dagtotalen
  - zakelijk/privé workflow
  - exports en rapportage
  - voldoende security en beheer voor dagelijks gebruik

Succescriteria voor deze fase:

- een bedrijf kan voertuigen en bestuurders in het systeem beheren
- ritten worden automatisch opgebouwd uit telemetrie en per dag inzichtelijk gemaakt
- bestuurders kunnen ritten beoordelen, classificeren en aanvullen
- beheerders kunnen controles uitvoeren, uitzonderingen beheren en exporteren
- de stack is stabiel genoeg voor een eerste echte pilot met monitoring, validatie en basis operationele hardening

## Huidige situatie

Op basis van de verkenning van codebase en documentatie:

### Wat er al is

- multi-tenant basis met `superadmin`, `company_admin` en `viewer`
- voertuigenbeheer, trackerbeheer, gebruikersbeheer en feature flags
- live kaart en actuele voertuigstatus
- historische routepunten en replay per voertuig
- Teltonika ingest voor TCP en basale ingest infrastructuur
- installatie via Docker Compose met documentatie en health endpoints
- voorbereid datamodel voor `trip_summaries`

Belangrijke bestanden:

- `apps/api/src/auth/*`
- `apps/api/src/vehicles/*`
- `apps/api/src/history/*`
- `apps/api/src/trackers/*`
- `apps/api/src/users/*`
- `apps/api/src/database/migrations/001_initial.sql`
- `apps/ingest/src/pipeline/position-writer.service.ts`
- `apps/web/src/features/*`
- `README.md`
- `docs/installatie-handleiding.md`
- `docker-compose.yml`

### Wat nog ontbreekt voor dagelijkse kilometerregistratie

- automatische ritopbouw op basis van telemetrie
- dagelijkse kilometeroverzichten per voertuig en bestuurder
- zakelijk/privé classificatie
- ritopmerkingen, correcties en uitzonderingsafhandeling
- bestuurdergerichte interface
- exporteerbare rapporten
- audit logging die daadwerkelijk gebruikt wordt
- betere input-validatie en security hardening
- observability en pilot-operaties voor issues, support en controle

### Belangrijke technische observaties

- `trip_summaries` bestaat al in `001_initial.sql`, maar wordt nog niet gevuld of uitgelezen
- historie levert nu vooral ruwe GPS-punten, nog geen ritten
- frontend is vooral een admininterface; er is nog geen echte bestuurderflow
- auth werkt, maar refresh tokens worden niet server-side beheerd of ingetrokken
- frontend gebruikt `localStorage` voor tokens
- Vite/Caddy/Docker setup is bruikbaar voor pilot, maar nog niet hard genoeg voor langdurig productiegebruik
- audit log tabel bestaat, maar wordt nog niet actief beschreven

## Aannames en beslissingen

- Deze roadmap richt zich op de eerstvolgende productfase, niet op een volledige enterprise-SaaS herbouw.
- `Pilot-ready` betekent:
  - geschikt voor eerste echte klanten of interne teams
  - voldoende betrouwbaar voor dagelijks gebruik
  - nog niet maximaal geoptimaliseerd voor grote schaal of zware compliance-certificering
- De eerste bruikbare kilometerregistratie moet werken voor zowel:
  - `company_admin` als controlerende rol
  - eindgebruikers/bestuurders met een eigen ritbeoordelingsflow
- De bestaande architectuur met `apps/api`, `apps/ingest`, `apps/web` en `packages/shared` blijft leidend.
- De al aanwezige tabel `trip_summaries` wordt hergebruikt of uitgebreid, niet genegeerd.
- Scope is breder dan alleen UX: ook datamodel, API, ingest-logica en operationele hardening horen bij deze fase.

## Voorgestelde wijzigingen

## 1. Domeinmodel uitbreiden voor echte kilometerregistratie

Bestanden:

- `apps/api/src/database/migrations/001_initial.sql`
- nieuwe migraties onder `apps/api/src/database/migrations/`
- `packages/shared/src/types/domain.ts`
- `packages/shared/src/types/api.ts`

Wat:

- ontwerp een expliciet kilometerregistratie-domein bovenop de bestaande telemetrie
- breid `trip_summaries` uit of vervang deze door een rijker ritmodel met minimaal:
  - `vehicle_id`
  - optioneel `driver_user_id`
  - `started_at`, `ended_at`
  - start- en eindlocatie
  - `distance_km`
  - `duration_seconds`
  - `classification` zoals `business`, `private`, `commute`, `unknown`
  - `status` zoals `draft`, `reviewed`, `approved`
  - `comment`
  - `source` zoals `automatic` of `manual_adjustment`
  - auditvelden zoals `reviewed_by`, `reviewed_at`
- voeg een dagelijkse aggregatielaag toe voor dagtotalen per voertuig en/of bestuurder
- voeg eventueel ondersteuning toe voor handmatige correcties of uitzonderingen

Waarom:

- zonder expliciet rit- en registratiemodel blijven historie en live tracking te ruw voor dagelijks gebruik en administratie

Hoe:

- maak nieuwe SQL-migraties in plaats van bestaande migraties te herschrijven
- stem gedeelde types af met API-responses en frontend-schermen
- zorg dat de gekozen status- en classificatievelden aansluiten op beheer- en bestuurderflows

## 2. Ritdetectie en verwerking vanuit telemetrie bouwen

Bestanden:

- `apps/ingest/src/pipeline/position-writer.service.ts`
- mogelijk nieuwe services onder `apps/ingest/src/pipeline/`
- mogelijk nieuwe services in `apps/api/src/history/` of nieuwe module voor trips

Wat:

- implementeer automatische ritdetectie op basis van telemetrie
- bepaal logica voor:
  - begin van rit
  - einde van rit
  - stationair gedrag
  - ontbrekende GPS-punten
  - dubbele ingest
  - grensgevallen zoals korte bewegingen of slechte trackerkwaliteit
- vul ritrecords en dagtotalen automatisch vanuit nieuwe positie-events

Waarom:

- kilometerregistratie staat of valt met stabiele ritsegmentatie

Hoe:

- gebruik de bestaande opslag in `telemetry_positions` als bron
- houd de eerste versie pragmatisch:
  - rit start bij beweging/ignition combinatie
  - rit eindigt na ingestelde idle-periode
  - korte verplaatsingen onder drempel markeren als uitzonderingskandidaat
- documenteer aannames expliciet zodat deze later verfijnd kunnen worden

## 3. Nieuwe API-laag voor ritten, dagoverzichten en beoordelingen toevoegen

Bestanden:

- nieuwe module zoals `apps/api/src/trips/*` of uitbreiding van `history/*`
- `apps/api/src/app.module.ts`
- `packages/shared/src/types/api.ts`
- `apps/web/src/lib/api.ts`

Wat:

- voeg endpoints toe voor:
  - ritten per dag/per voertuig/per bestuurder
  - detailweergave van een rit
  - classificatie en commentaar aanpassen
  - uitzonderingen of incomplete ritten opvragen
  - dagtotalen opvragen
  - exports starten of ophalen
- definieer duidelijke rolregels:
  - bestuurders zien alleen hun eigen ritten
  - admins zien ritten van hun bedrijf
  - superadmin kan tenant-overschrijdend support of diagnostiek doen

Waarom:

- de huidige API levert vooral live state en ruwe historie; voor kilometerregistratie is een aparte applicatielaag nodig

Hoe:

- bouw de rit-API expliciet en houd historie-endpoints backward compatible
- gebruik consistente response-types in `packages/shared`
- voeg filtering toe op datumrange, voertuig, bestuurder, status en classificatie

## 4. Bestuurders- en beheerflows in de web-app toevoegen

Bestanden:

- `apps/web/src/app/router.tsx`
- `apps/web/src/components/AppShell.tsx`
- nieuwe features onder `apps/web/src/features/`
- mogelijk aanvullingen in `apps/web/src/store/`
- `apps/web/src/lib/api.ts`

Wat:

- voeg nieuwe schermen toe voor kilometerregistratie, bijvoorbeeld:
  - `Mijn ritten`
  - `Dagoverzicht`
  - `Review wachtrij`
  - `Exports`
- voeg voor bestuurders een eenvoudige dagelijkse workflow toe:
  - open ritten zien
  - rit classificeren
  - opmerkingen toevoegen
  - dag afronden
- voeg voor admins een controleflow toe:
  - alle ritten binnen het bedrijf
  - filteren op uitzonderingen
  - ontbrekende classificaties opsporen
  - exporteren

Waarom:

- het systeem moet bruikbaar zijn voor dagelijkse handelingen, niet alleen voor beheer en technische configuratie

Hoe:

- breid de bestaande AdminKit-geinspireerde shell uit met kilometerregistratie-items
- houd bestuurderpagina's eenvoudiger en taakgericht
- laat admins meer filter- en controle-informatie zien
- gebruik bestaande layoutpatronen zodat de UX consistent blijft

## 5. Rollen en gebruikersmodel geschikt maken voor bestuurders

Bestanden:

- `packages/shared/src/auth/roles.ts`
- `apps/api/src/users/*`
- `apps/api/src/auth/*`
- `apps/web/src/features/users/*`
- database-migraties indien nodig

Wat:

- bepaal of een aparte bestuurderrol nodig is, bijvoorbeeld `driver`
- voeg koppeling toe tussen gebruiker en voertuig of voertuigtoegang
- maak onderscheid tussen:
  - beheergebruikers
  - bestuurders/eindgebruikers

Waarom:

- zonder bestuurdercontext kunnen gebruikers niet veilig en logisch alleen hun eigen ritten beheren

Hoe:

- kies een minimaal model voor pilot:
  - een bestuurder kan aan een bedrijf hangen
  - eventueel een primaire voertuigkoppeling of toegewezen voertuigset
- vermijd in deze fase overcomplexe fleet planning of roosterlogica

## 6. Export en rapportage voor administratie toevoegen

Bestanden:

- nieuwe API-module voor export of uitbreiding van trips-module
- `apps/web/src/features/` voor exportscherm
- `packages/shared/src/types/api.ts`

Wat:

- voeg exportfuncties toe voor:
  - CSV voor ritten
  - CSV voor dagtotalen
  - filter op periode, voertuig, bestuurder en classificatie
- definieer minimaal één rapport dat direct bruikbaar is voor administratie en kilometercontrole

Waarom:

- zonder export blijft het systeem vooral een operationele viewer en geen bruikbaar registratie-instrument

Hoe:

- start met CSV als eerste pilot-formaat
- stel export samen vanuit het nieuwe ritmodel, niet uit ruwe GPS-punten
- markeer openstaande of onvolledige ritten duidelijk in rapportages

## 7. Audit logging en wijzigingshistorie echt activeren

Bestanden:

- `apps/api/src/database/migrations/001_initial.sql` of nieuwe migraties
- relevante services in `apps/api/src/*`
- mogelijk nieuwe helper/module voor audit logging

Wat:

- gebruik de al bestaande audit-logstructuur voor belangrijke acties:
  - login-events
  - gebruikersbeheer
  - ritclassificatie
  - ritcorrecties
  - exports
  - instellingenwijzigingen

Waarom:

- dagelijkse kilometerregistratie vraagt traceerbaarheid, zeker zodra gebruikers ritten aanpassen

Hoe:

- voeg een centrale audit-helper of service toe
- log actor, tenant, entiteit, actie en essentiele metadata
- gebruik auditlogs in eerste instantie intern; UI-weergave is optioneel voor een latere fase

## 8. Security en input-validatie verharden voor pilotgebruik

Bestanden:

- `apps/api/src/main.ts`
- controllers/services onder `apps/api/src/`
- eventueel nieuwe DTO's onder API-modules
- `apps/web/src/store/session.ts`
- `apps/web/src/lib/api.ts`

Wat:

- voeg request-validatie toe voor belangrijke write-endpoints
- beperk CORS tot bekende origins
- voeg security headers toe
- voeg rate limiting toe op login en gevoelige endpoints
- verbeter wachtwoordbeleid en bootstrap-security
- beoordeel tokenstrategie voor pilotgebruik

Waarom:

- een pilot met echte gebruikers moet minimaal bestand zijn tegen eenvoudige misconfiguratie, foutieve input en brute-force risico's

Hoe:

- introduceer DTO-validatie en globale validatiepipeline
- voeg `helmet` en basis rate limiting toe
- verwijder onnodige demo- of default-gedragingen uit productiepad
- behoud bestaande auth-flow als dat sneller is, maar documenteer wat later naar httpOnly cookies of token-rotatie moet

## 9. Observability en pilot-operations verbeteren

Bestanden:

- `apps/api/src/health/*`
- `apps/ingest/src/health/*`
- logging in `apps/api` en `apps/ingest`
- `docker-compose.yml`
- `docs/architecture/operational-runbook.md`
- `README.md`

Wat:

- maak health checks inhoudelijker:
  - DB beschikbaarheid
  - Redis beschikbaarheid
  - ingest basisstatus
- structureer logs beter
- definieer operationele checks voor:
  - ingest werkt
  - ritverwerking loopt
  - exports slagen
  - tenantdata blijft beschikbaar

Waarom:

- bij dagelijks gebruik moeten problemen sneller detecteerbaar zijn dan nu

Hoe:

- breid health endpoints uit van statische `ok` naar echte dependency checks
- voeg logrichtlijnen en runbook-stappen toe voor support van pilotklanten
- houd deze fase lichtgewicht; volledige metrics stack mag naar een latere fase

## 10. Teststrategie uitbreiden rond de nieuwe kernflow

Bestanden:

- `apps/api/package.json`
- `apps/ingest/package.json`
- `apps/web/package.json`
- nieuwe testbestanden in API, ingest en web

Wat:

- voeg gerichte tests toe voor de nieuwe productkern:
  - ritdetectie
  - tenantafscherming
  - ritclassificatie
  - dagtotalen
  - exportfilters
  - bestuurderrechten versus adminrechten

Waarom:

- kilometerregistratie vereist meer betrouwbaarheid dan een demo-dashboard

Hoe:

- focus op high-value tests:
  - unit/integratie voor ritopbouwlogica
  - API tests voor permissions en filters
  - web tests voor kritieke flows zoals rit labelen en overzicht openen

## Aanbevolen uitvoeringsfasering

### Fase 1: minimale pilotkern

Doel:

- van trackingplatform naar bruikbare kilometerregistratie-MVP

Inhoud:

- ritmodel en migraties
- automatische ritdetectie
- rit-API
- bestuurder- en adminschermen voor ritten
- dagtotalen
- CSV export basis

### Fase 2: controle en betrouwbaarheid

Doel:

- van MVP naar echte pilot-operatie

Inhoud:

- audit logging
- uitzonderingenwachtrij
- betere filters en exports
- input-validatie
- role refinement voor bestuurders
- uitgebreidere tests

### Fase 3: production hardening voor bredere uitrol

Doel:

- systeem geschikt maken voor meerdere bedrijven met hoger dagelijks gebruik

Inhoud:

- auth hardening
- observability uitbreiden
- deployment hardening
- backup/restore procedures aanscherpen
- security review en configuratiehardening

## Verificatie

Productmatig:

- een bestuurder kan eigen ritten van vandaag zien
- een bestuurder kan een rit classificeren en opslaan
- een admin kan ritten van het bedrijf controleren en filteren
- dagtotalen zijn zichtbaar en sluiten logisch aan op ritten
- een exportbestand kan over een periode worden gegenereerd

Technisch:

- migraties draaien clean op nieuwe en bestaande omgevingen
- ritdetectie produceert verwachte ritrecords uit testtelemetrie
- tenantafscherming blijft correct
- write-endpoints zijn gevalideerd
- health endpoints tonen echte service-status
- kritieke flows hebben geautomatiseerde tests

Operationeel:

- installatiedocumentatie bevat de nieuwe pilot-setup
- runbook beschrijft hoe support rit- en ingestproblemen controleert
- logs en health checks geven genoeg informatie voor eerste incidentafhandeling

## Buiten scope van deze fase

- volledige enterprise compliance-certificering
- geavanceerde salaris/declaratie-integraties
- native mobiele apps
- uitgebreide planning/dispatch functionaliteit
- volledige SaaS-multiregio architectuur

