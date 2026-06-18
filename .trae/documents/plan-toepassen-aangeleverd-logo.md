# Plan: aangeleverd logo toepassen

## Samenvatting

Doel is om het huidige nagemaakte VehicleLinQ-logo in de webapp te vervangen door het door de gebruiker aangeleverde bronbestand, en die branding consequent door te voeren op alle logische merkplekken in `apps/web`. De implementatie gaat uit van een echt bronbestand (`.svg` of `.png`, bij voorkeur met transparante achtergrond) dat later wordt aangeleverd.

## Current State Analysis

- In `apps/web/src/assets/vehiclelinq-logo.svg` staat momenteel een handmatig nagemaakte SVG van het logo.
- Die asset wordt nu rechtstreeks gebruikt in:
  - `apps/web/src/features/auth/LoginPage.tsx`
  - `apps/web/src/components/AppShell.tsx`
- In `apps/web/public/favicon.svg` staat een losse, eveneens zelf opgebouwde merk/favicon-illustratie.
- In `apps/web/index.html` wordt de favicon geladen via `/favicon.svg`.
- In `apps/web/src/components/AppShell.tsx` staat onder het logo ook nog losse tagline-tekst: `Connecting your fleet`.
- Het aangeleverde logo bevat visueel al de merknaam plus tagline, dus de huidige losse tagline in de sidebar kan dubbel worden zodra het echte logo wordt toegepast.

## Assumptions & Decisions

- De gebruiker levert voor uitvoering een echt logo-bronbestand aan als `SVG` of `PNG`; voorkeur is `SVG`, anders `PNG` met transparante achtergrond.
- Reikwijdte is `alles merkgerelateerd` binnen de bestaande webapp, niet documentatie of backend-services.
- De merknaam `VehicleLinQ` als tekstuele productnaam blijft staan waar die functioneel is, tenzij zij visueel botst met het nieuwe beeldmerk.
- Het nieuwe logo wordt centraal als asset beheerd zodat bestaande imports intact of minimaal aangepast blijven.
- Als het aangeleverde bestand een andere extensie krijgt dan de huidige SVG, worden imports en eventueel favicon-verwijzing daarop aangepast.

## Proposed Changes

### 1. Centrale logo-asset vervangen

Bestanden:
- `apps/web/src/assets/vehiclelinq-logo.svg` of nieuw equivalent zoals `apps/web/src/assets/vehiclelinq-logo.png`

Werkzaamheden:
- Het huidige nagemaakte logo verwijderen uit de centrale assetlaag.
- Het aangeleverde bronbestand toevoegen onder een stabiele, logische bestandsnaam.
- Waar mogelijk dezelfde asset-naam behouden om componentwijzigingen minimaal te houden; als de extensie verandert, imports daarop aanpassen.

Waarom:
- Alle zichtbare plekken gebruiken nu dezelfde logo-asset; centraliseren houdt toekomstige branding-wijzigingen simpel.

### 2. Loginpagina afstemmen op nieuw logoformaat

Bestand:
- `apps/web/src/features/auth/LoginPage.tsx`

Werkzaamheden:
- Import laten verwijzen naar het nieuwe bronbestand.
- De `<img>`-weergave controleren en zo nodig hoogte/breedte/max-width aanpassen voor het nieuwe aspect ratio.
- Extra aandacht geven aan leesbaarheid op donkere achtergrond (`bg-slate-900`), omdat het aangeleverde logo visueel meer details en tagline bevat dan het huidige logo.

Waarom:
- Het nieuwe logo is breder en informatiever dan het huidige vereenvoudigde SVG-logo; de huidige `h-14 max-w-[320px]` kan te krap worden.

### 3. Sidebar-branding corrigeren en dubbele tagline voorkomen

Bestand:
- `apps/web/src/components/AppShell.tsx`

Werkzaamheden:
- Import laten verwijzen naar het nieuwe bronbestand.
- De logo-afmetingen in de sidebar herijken zodat het logo scherp en volledig zichtbaar blijft.
- De losse tagline-regel `Connecting your fleet` verwijderen of conditioneel vervangen als die dubbelop wordt met het aangeleverde logo.
- De link/header-regio rond het logo toetsen op spacing, vooral omdat de sidebar nu `h-12 max-w-[180px]` gebruikt.

Waarom:
- De sidebar heeft de strakste ruimtebeperking; hier is de kans het grootst op afsnijden, vervorming of dubbele merkboodschap.

### 4. Favicon en browser-branding aligneren

Bestanden:
- `apps/web/public/favicon.svg` of alternatief favicon-bestand
- `apps/web/index.html`

Werkzaamheden:
- De huidige zelfgemaakte favicon vervangen door een favicon die is afgeleid van het aangeleverde logo.
- Bij een SVG-favicon: bestaande verwijzing in `index.html` behouden of alleen het bestand vervangen.
- Bij een PNG/ICO-favicon: `index.html` aanpassen naar het juiste bestandstype en pad.
- Bij voorkeur een vereenvoudigde faviconvariant gebruiken (bijvoorbeeld alleen het pictogramdeel) als het volledige logo met tekst op kleine schaal onleesbaar is.

Waarom:
- De gebruiker wil alle merkgerelateerde plekken laten aansluiten op het echte logo; de huidige favicon gebruikt nog de oude zelf opgebouwde beeldtaal.

### 5. Merkconsistentie quick pass

Bestanden:
- `apps/web/src/components/AppShell.tsx`
- `apps/web/index.html`
- eventueel andere bestanden met zichtbare merkpresentatie indien tijdens uitvoering nog één-op-één gekoppelde assets opduiken

Werkzaamheden:
- Controleren of er zichtbare merkpresentatie is die nog expliciet verwijst naar de oude beeldopbouw.
- Tekstuele merknaam `VehicleLinQ` en producttitel alleen aanpassen als dat nodig blijkt door het nieuwe assetgebruik.

Waarom:
- De codebase gebruikt weinig expliciete merk-assets, maar een korte consistentiecheck voorkomt half omgezette branding.

## Implementatiestappen

1. Ontvang en valideer het echte logo-bronbestand (`SVG` of transparante `PNG`).
2. Vervang of voeg de centrale logo-asset in `apps/web/src/assets/` toe.
3. Werk `LoginPage.tsx` bij voor het nieuwe bestand en juiste rendering.
4. Werk `AppShell.tsx` bij voor het nieuwe bestand, spacing en verwijdering van dubbele tagline.
5. Vervang of herleid de favicon in `public/` en pas indien nodig `index.html` aan.
6. Controleer alle merkverwijzingen in `apps/web` op visuele consistentie.

## Verification Steps

- Start de webapp lokaal en controleer:
  - loginpagina: logo is scherp, niet vervormd en volledig zichtbaar;
  - sidebar desktop: logo past binnen de beschikbare breedte zonder clipping;
  - sidebar mobiel: logo blijft bruikbaar na openen/sluiten van navigatie;
  - geen dubbele tagline meer zichtbaar als die al in het logo zelf zit;
  - browser-tab toont de bijgewerkte favicon.
- Controleer dat asset-imports nog correct compileren na eventuele extensiewijziging.
- Draai diagnostics/lint op de aangepaste frontendbestanden om import- of JSX-fouten direct te vangen.

## Open uitvoeringsvoorwaarde

Uitvoering kan direct starten zodra het definitieve logo-bronbestand beschikbaar is in de workspace of expliciet is aangeleverd voor gebruik.
