# Debug Session: login-failed-fetch

- Status: OPEN
- Symptoom: inloggen geeft "Failed to fetch"
- Verwachting: login request bereikt de API en geeft een geldige response terug

## Hypotheses

1. De frontend gebruikt een onjuiste of onbereikbare `VITE_API_BASE_URL`.
2. Caddy proxyt de API-route niet correct door naar de API-service.
3. De API-service draait niet of luistert niet op de verwachte poort.
4. De browser blokkeert de request door CORS of mixed-content gedrag.
5. De login-request faalt op netwerkniveau doordat de webapp naar een absolute URL wijst die niet past bij de serverinstallatie.

## Bewijsverzameling

- Statische inspectie van `apps/web/src/lib/api.ts` toont dat de frontend standaard `http://localhost:3000/api/v1` gebruikt als `API_BASE_URL`.
- Dit veroorzaakt bij een echte serverinstallatie een browserrequest naar de localhost van de clientmachine in plaats van naar de server.
- Inspectie van `infra/caddy/Caddyfile` toont gebruik van `handle_path /api/*` en `handle_path /health*`.
- `handle_path` stript het gematchte padprefix, waardoor `/api/v1/auth/login` richting de API als `/v1/auth/login` wordt doorgestuurd; dat past niet bij de gedefinieerde API-routes onder `/api/v1`.

## Analyse

- Hypothese 1 bevestigd: de frontend gebruikt een ongeschikte absolute localhost-URL als default.
- Hypothese 2 bevestigd: Caddy proxystripping verbreekt de API-paden.
- Hypothese 3 nog niet nodig om te bevestigen voor root cause; zelfs met draaiende API zou login via de huidige routing/config mislukken.
- Hypothese 4 niet primair: het symptoom kan volledig verklaard worden door foutieve target URL en proxyconfiguratie.
- Hypothese 5 bevestigd: de loginrequest faalt op netwerkniveau door een onjuiste absolute URL in combinatie met een fout proxy-pad.

## Fix

- `apps/web/src/lib/api.ts`: default API-base aangepast naar relatieve `/api/v1`.
- `.env.example`: `VITE_API_BASE_URL` aangepast naar `/api/v1`.
- `infra/caddy/Caddyfile`: `handle_path` vervangen door `handle` voor `/api/*` en `/health*`, zodat de originele paden behouden blijven.

## Verificatie

- Nog niet gestart.
