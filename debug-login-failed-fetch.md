# Debug Session: login-failed-fetch

- Status: OPEN
- Symptoom: eerst "Failed to fetch", daarna een JSON response `{"statusCode":500,"message":"Internal server error"}`
- Verwachting: login request bereikt de API en geeft een geldige response terug

## Hypotheses

1. De frontend gebruikt een onjuiste of onbereikbare `VITE_API_BASE_URL`.
2. Caddy proxyt de API-route niet correct door naar de API-service.
3. De API-service draait niet of luistert niet op de verwachte poort.
4. De browser blokkeert de request door CORS of mixed-content gedrag.
5. De login-request faalt op netwerkniveau doordat de webapp naar een absolute URL wijst die niet past bij de serverinstallatie.
6. Na herstel van de netwerklaag faalt de login intern in de API, waarschijnlijk tijdens database lookup, password compare of JWT-signing.

## Bewijsverzameling

- Statische inspectie van `apps/web/src/lib/api.ts` toont dat de frontend standaard `http://localhost:3000/api/v1` gebruikt als `API_BASE_URL`.
- Dit veroorzaakt bij een echte serverinstallatie een browserrequest naar de localhost van de clientmachine in plaats van naar de server.
- Inspectie van `infra/caddy/Caddyfile` toont gebruik van `handle_path /api/*` en `handle_path /health*`.
- `handle_path` stript het gematchte padprefix, waardoor `/api/v1/auth/login` richting de API als `/v1/auth/login` wordt doorgestuurd; dat past niet bij de gedefinieerde API-routes onder `/api/v1`.
- Runtime-logs van de gebruiker tonen `caddy` fouten `dial tcp 172.18.0.6:5173: connect: connection refused` voor `/` en `/login`.
- Runtime-logs tonen ook `dial tcp 172.18.0.4:3000: connect: connection refused` voor `/health`, terwijl `api` tegelijk rapporteert dat Nest succesvol gestart is.
- `docker compose ps` toont dat `caddy` ouder is dan de nieuw aangemaakte `web` en `api` containers; dit past bij een stale upstream-DNS/IP situatie in de reverse proxy.
- `web` logs tonen daarnaast een niet-fatale Vite/CSS fout: `@import must precede all other statements`.
- Gebruiker meldt nu een echte API-response: `{"statusCode":500,"message":"Internal server error"}`.
- Statische inspectie van `apps/api/src/auth/auth.service.ts` toont dat een `500` alleen plausibel is bij een onverwachte fout in de query, bcrypt-compare of JWT-creatie; ongeldige credentials zouden `401` moeten geven.

## Analyse

- Hypothese 1 bevestigd: de frontend gebruikt een ongeschikte absolute localhost-URL als default.
- Hypothese 2 bevestigd: Caddy proxystripping verbreekt de API-paden.
- Hypothese 3 nog niet nodig om te bevestigen voor root cause; zelfs met draaiende API zou login via de huidige routing/config mislukken.
- Hypothese 3 deels verworpen als primaire oorzaak: de API draait, maar `caddy` bereikt een verouderd upstream IP.
- Hypothese 4 niet primair: het symptoom kan volledig verklaard worden door foutieve target URL en proxyconfiguratie.
- Hypothese 5 bevestigd: de loginrequest faalt op netwerkniveau door een onjuiste absolute URL in combinatie met een fout proxy-pad.
- Extra runtime root cause bevestigd: na het opnieuw opbouwen van `web` en `api` blijft `caddy` oude container-IP's gebruiken totdat de proxy zelf herstart wordt.
- Nieuwe vervolganalyse: de netwerkfout is grotendeels opgelost; de resterende fout zit binnen de API-loginflow.
- Hypothese 6 is nu actief en vereist runtime-evidence uit API-logs.

## Fix

- `apps/web/src/lib/api.ts`: default API-base aangepast naar relatieve `/api/v1`.
- `.env.example`: `VITE_API_BASE_URL` aangepast naar `/api/v1`.
- `infra/caddy/Caddyfile`: `handle_path` vervangen door `handle` voor `/api/*` en `/health*`, zodat de originele paden behouden blijven.
- `setup.sh`: start `api`, `ingest` en `web` eerst, en force-recreate daarna `caddy` zodat upstream IP-adressen opnieuw worden opgelost.
- `apps/web/src/index.css`: Google Fonts `@import` naar boven verplaatst zodat Vite geen CSS parserfout meer geeft.
- `apps/api/src/auth/auth.service.ts`: gerichte diagnostische logging toegevoegd rond login-attempt, user lookup, password mismatch en onverwachte exceptions.

## Verificatie

- Lokale syntax/diagnostics controle nog uit te voeren.
- Lokale TypeScript-check voor de API slaagt.
- Gebruiker moet de API opnieuw deployen, opnieuw inloggen en daarna de verse `api` logs delen om de exacte `500`-oorzaak vast te leggen.
