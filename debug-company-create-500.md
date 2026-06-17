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
