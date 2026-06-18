# Plan: AdminKit-layout voor de web-app

## Samenvatting

Doel is om de huidige `apps/web` interface visueel en structureel om te zetten naar een AdminKit-geinspireerde layout, zonder Bootstrap of AdminKit runtime-afhankelijkheden toe te voegen. De implementatie blijft binnen de bestaande React + Tailwind-stack en omvat zowel de ingelogde app-shell als de loginpagina.

Succescriteria:

- De ingelogde app krijgt een AdminKit-achtige shell met linker sidebar, bovenste topbar, lichtere content-achtergrond en consistente cards/forms.
- De loginpagina sluit visueel aan op dezelfde stijlrichting.
- De bestaande routes, dataflows en API-koppelingen blijven functioneel ongewijzigd.
- De layout werkt bruikbaar op desktop en mobiel.

## Huidige situatie

Op basis van de verkenning:

- `apps/web/src/components/AppShell.tsx` bevat nu een custom donkere shell met vaste linker navigatie en zonder aparte topbar.
- `apps/web/src/index.css` zet nu een donkere globale achtergrond en een fontmix met `Fraunces` + `Manrope`.
- `apps/web/src/features/auth/LoginPage.tsx` gebruikt een eigen marketing-achtige dark hero layout die visueel losstaat van de rest van de app.
- De meeste featurepagina's volgen hetzelfde patroon:
  - paginaheader met accentkleur
  - losse Tailwind-cards
  - formulieren direct inline gestyled
  - herhaalde status-, lijst- en empty-state patronen
- `apps/web/src/components/CompanySelector.tsx` is nu donker gestyled en past niet bij een lichte AdminKit-shell.
- `apps/web/src/hooks/useTheme.ts` bestaat, maar wordt momenteel nergens gebruikt; theme-switching is dus geen bestaand functioneel onderdeel.
- `apps/web/package.json` bevat geen `bootstrap` of `@adminkit/core`; de app draait volledig op Tailwind.

Gelezen referentie voor de doelrichting:

- AdminKit is een Bootstrap 5 admin template met vooral nadruk op:
  - lichte dashboard-achtergrond
  - compacte sidebar + topbar
  - witte cards met subtiele borders/shadows
  - tabel/form/dashboard patronen
  - responsieve admin layout

## Aannames en beslissingen

- Gekozen aanpak: AdminKit visueel porten naar Tailwind, niet de originele Bootstrap/AdminKit CSS of JS integreren.
- Scope: ingelogde shell, belangrijkste pagina-opmaak en loginpagina.
- Geen backend-, router- of API-contractwijzigingen.
- Geen dark-mode of theme-toggle in deze wijziging; de layout wordt ontworpen rond een AdminKit-achtige lichte standaardweergave.
- De bestaande navigatiestructuur en routepaden blijven behouden.
- De pagina-inhoud wordt niet functioneel herschikt buiten wat nodig is om cards, headers, forms en lijsten visueel in het nieuwe layoutpatroon te krijgen.

## Voorgestelde wijzigingen

### 1. Globale stijlbasis vernieuwen

Bestanden:

- `apps/web/src/index.css`
- optioneel nieuw: `apps/web/src/components/ui/*` voor herbruikbare layout-primitieven

Wat:

- Vervang de huidige donkere globale skin door een lichte AdminKit-geinspireerde basis:
  - `body`/`#root` met lichtgrijze achtergrond
  - neutrale tekstkleur
  - subtiele card-schaduwen en borders
  - consistente spacing- en radius-tokens
- Maak een kleine set herbruikbare utility-achtige componenten of class-patronen voor:
  - page container
  - card/panel
  - section title
  - form input/select
  - primary/secondary action button
  - status badge

Waarom:

- De huidige pagina's herhalen veel styling inline; zonder gedeelde basis wordt de AdminKit-port inconsistent en duur om te onderhouden.

Hoe:

- Leg de algemene visuele tokens centraal vast in `index.css`.
- Houd componentextracties beperkt en gericht; alleen patronen die op meerdere pagina's terugkomen worden geabstraheerd.

### 2. App-shell ombouwen naar AdminKit-structuur

Bestanden:

- `apps/web/src/components/AppShell.tsx`
- `apps/web/src/components/CompanySelector.tsx`
- optioneel nieuw: `apps/web/src/components/PageHeader.tsx`

Wat:

- Bouw de shell om naar een typische admin-layout:
  - vaste linker sidebar met merkblok en verticale navigatie
  - contentgebied met topbar boven de `Outlet`
  - topbar met paginacontext, company selector en sessie-acties
  - subtiele footer of onderste metadatazone in de contentwrapper
- Voeg responsief gedrag toe:
  - sidebar standaard zichtbaar op desktop
  - mobiele toggle/overlay voor kleinere schermen

Waarom:

- Dit is het kernverschil tussen de huidige custom shell en de gewenste AdminKit uitstraling.

Hoe:

- Behoud `react-router-dom` structuur uit `apps/web/src/app/router.tsx`; alleen de presentatie van `AppShell` verandert.
- Houd de bestaande `navItems` aan, maar wijzig spacing, kleurgebruik en active state naar AdminKit-achtige patronen.
- Verplaats gebruikersinformatie uit de huidige onderste dark card naar de topbar of een compact profielblok.
- Restyle `CompanySelector` naar een lichte form-control zodat deze zowel in topbar als paginaheaders bruikbaar is.

### 3. Loginpagina visueel aansluiten op de nieuwe shell

Bestand:

- `apps/web/src/features/auth/LoginPage.tsx`

Wat:

- Vervang de huidige dark hero + glassmorphism login door een schonere AdminKit-geinspireerde sign-in pagina.
- Gebruik een eenvoudiger compositie:
  - gecentreerde card of twee-koloms auth-layout
  - heldere titel, korte ondersteunende tekst
  - nette form-controls en duidelijke submitknop
  - optioneel een secundair informatiepaneel met platformwaardepropositie

Waarom:

- De loginpagina moet niet visueel losstaan van de rest van de applicatie als de app-shell naar AdminKit wordt vertaald.

Hoe:

- Behoud alle huidige loginlogica, foutmeldingen, loading state en demo-credentials.
- Pas alleen structuur, spacing, typografie en kleurgebruik aan.

### 4. Dashboard omzetten naar AdminKit dashboard-patroon

Bestand:

- `apps/web/src/features/dashboard/DashboardPage.tsx`

Wat:

- Herstructureer de pagina naar een klassiek dashboard:
  - header met titel/subtitel en selector in een nette toolbar
  - KPI cards in uniforme witte panels
  - grote kaart-card als hoofdcontent
  - lijst/rechterkolom met voertuigstatus in compacte dashboard cards

Waarom:

- Het dashboard is de pagina waar de AdminKit stijl het duidelijkst zichtbaar moet zijn.

Hoe:

- Behoud bestaande datapunten, maplogica en API-calls.
- Pas alleen layout-hiërarchie, card-opbouw en typografie aan.

### 5. CRUD- en beheerpagina's harmoniseren

Bestanden:

- `apps/web/src/features/companies/CompaniesPage.tsx`
- `apps/web/src/features/vehicles/VehiclesPage.tsx`
- `apps/web/src/features/trackers/TrackersPage.tsx`
- `apps/web/src/features/users/UsersPage.tsx`
- `apps/web/src/features/modules/ModulesPage.tsx`
- `apps/web/src/features/history/HistoryPage.tsx`
- `apps/web/src/features/settings/SettingsPage.tsx`

Wat:

- Breng de pagina's onder in een consistent AdminKit-geinspireerd patroon:
  - uniforme paginaheaders
  - cards voor formulieren
  - cards of eenvoudige tabelachtige lijsten voor records
  - consistente empty-, success- en error-states
  - consistente badges en actieknoppen

Waarom:

- Deze pagina's delen nu veel hetzelfde werk, maar ogen als losse maatwerksecties. De layoutwijziging slaagt pas echt als dit overal coherent wordt.

Hoe:

- `CompaniesPage`: split tussen tenantoverzicht en aanmaakformulier behouden, maar visueel omzetten naar beheer-dashboard cards.
- `VehiclesPage`, `TrackersPage`, `UsersPage`: linker beheerkaart + rechter lijst behouden, maar forms en itemcards naar AdminKit-stijl brengen.
- `ModulesPage`: modulekaarten omzetten naar strakkere feature cards met duidelijke toggle state.
- `HistoryPage`: filterkaart links en kaartweergave rechts behouden, maar wrapper/cards en filters laten aansluiten op de nieuwe stijl.
- `SettingsPage`: ruwe inputs omzetten naar nette settings-card met consistente labels, spacing en action area.

### 6. Kaartcontainers en ondersteunende componenten nalopen

Bestanden:

- `apps/web/src/lib/maps/MapPanel.tsx`
- eventuele nieuwe layoutcomponenten onder `apps/web/src/components/`

Wat:

- Controleer of de kaartcontainer visueel en qua hoogte goed werkt binnen lichtere cards.
- Voeg alleen ondersteunende componenten toe waar dat hergebruik echt oplevert.

Waarom:

- De map is een dominante UI-sectie op dashboard en historie; die moet binnen de nieuwe shell niet "losgeplakt" ogen.

Hoe:

- Beperk wijzigingen tot container-, border- en sizing-aanpassingen tenzij er tijdens implementatie een concrete layoutbreuk zichtbaar wordt.

## Uitvoeringsvolgorde

1. Nieuwe globale style basis en eventuele kleine UI-primitieven opzetten.
2. `AppShell` en `CompanySelector` ombouwen.
3. `LoginPage` restylen.
4. `DashboardPage` als referentiepagina omzetten.
5. Overige featurepagina's per patroon harmoniseren.
6. `MapPanel` alleen aanpassen indien de nieuwe card-layout dat nodig maakt.

## Verificatie

Technisch:

- `pnpm --filter web check`
- `pnpm --filter web lint`
- `pnpm --filter web test`

Functioneel handmatig:

- Loginflow controleren op `/login`.
- Navigatie en actieve states controleren in de shell.
- Responsief gedrag testen voor sidebar/topbar op smalle viewport.
- Pagina's visueel nalopen op minimaal:
  - `/dashboard`
  - `/companies`
  - `/vehicles`
  - `/trackers`
  - `/users`
  - `/history`
  - `/modules`
  - `/settings`
- Controleren dat formulieren, meldingen, selectors en kaartweergaven nog correct renderen.

## Buiten scope

- Migraties, backendwijzigingen of API-aanpassingen.
- Volledige adoptie van Bootstrap of `@adminkit/core`.
- Nieuwe functionele features buiten layout- en presentatiewerk.
- Theme switching of meerdere kleurenschema's.
