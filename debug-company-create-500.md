# Debug Session: company-create-500

Status: OPEN

## Symptoom
- Bij het aanmaken van een bedrijf krijgt de gebruiker een `Internal server error`.

## Hypotheses
- H1: de database faalt op het aanmaken van `company_modules` voor het nieuwe bedrijf.
- H2: de `slug` veroorzaakt een databasefout die niet correct als conflict wordt teruggegeven.
- H3: de transactie in `CompaniesService.create()` faalt omdat het transaction-object of query-resultaat niet het verwachte gedrag heeft.
- H4: de backend-route voor bedrijven ontvangt ongeldige of lege payload-data vanuit de frontend.
- H5: de fout zit buiten de service, bijvoorbeeld in auth/guards of response-serialisatie na succesvolle insert.

## Plan
- Instrumentatie toevoegen op frontend request en backend create-flow.
- Reproduceren en runtime-bewijs verzamelen.
- Op basis van bewijs een minimale fix toepassen.

## Bewijs
- API-logs tonen geen fout in `CompaniesService.create()`.
- De request faalt eerder in `AuthGuard.canActivate()` met `TokenExpiredError: jwt expired`.
- Daardoor werd een verlopen sessie als ongehandelede exception zichtbaar en zag de gebruiker een generieke serverfout.

## Beslissing
- Fix 1: verlopen of ongeldige JWT in de guard expliciet omzetten naar `401 Unauthorized`.
- Fix 2: frontend laat bij `401` eerst een refresh-token poging doen en ruimt anders de sessie op met een begrijpelijke melding.
