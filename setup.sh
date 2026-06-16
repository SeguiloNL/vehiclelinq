#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

if [[ ! -f ".env" ]]; then
  cp .env.example .env
  echo ".env aangemaakt vanuit .env.example"
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is niet geinstalleerd. Installeer Docker Engine en Docker Compose plugin eerst."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose plugin ontbreekt."
  exit 1
fi

echo "Start database en cache..."
docker compose up -d postgres redis

echo "Wachten op PostgreSQL..."
until docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-vehiclelinq}" -d "${POSTGRES_DB:-vehiclelinq}" >/dev/null 2>&1; do
  sleep 2
done

echo "Database migraties uitvoeren..."
docker compose exec -T postgres psql -U "${POSTGRES_USER:-vehiclelinq}" -d "${POSTGRES_DB:-vehiclelinq}" -f /dev/stdin < apps/api/src/database/migrations/001_initial.sql
docker compose exec -T postgres psql -U "${POSTGRES_USER:-vehiclelinq}" -d "${POSTGRES_DB:-vehiclelinq}" -f /dev/stdin < apps/api/src/database/migrations/002_timeseries.sql
docker compose exec -T postgres psql -U "${POSTGRES_USER:-vehiclelinq}" -d "${POSTGRES_DB:-vehiclelinq}" -f /dev/stdin < apps/api/src/database/migrations/003_retention_jobs.sql

echo "Applicatiestack bouwen en starten..."
docker compose up -d --build api ingest web caddy

cat <<EOF

VehicleLinq is gestart.

Webinterface: http://localhost
API health:    http://localhost/health
API direct:    http://localhost:${API_PORT:-3000}/health
Ingest health: http://localhost:${INGEST_HEALTH_PORT:-3002}/health
Teltonika TCP: ${TELTONIKA_TCP_PORT:-5027}
Teltonika UDP: ${TELTONIKA_UDP_PORT:-5027}

Bootstrap administrator:
- E-mail:    ${BOOTSTRAP_SUPERADMIN_EMAIL:-admin@example.com}
- Wachtwoord:${BOOTSTRAP_SUPERADMIN_PASSWORD:-ChangeMe123!}

Pas productie-instellingen aan via de webinterface zodra je kunt inloggen.
EOF
