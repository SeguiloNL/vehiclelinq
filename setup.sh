#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

if [[ ! -f ".env" ]]; then
  cp .env.example .env
  echo ".env aangemaakt vanuit .env.example"
fi

get_env_value() {
  local key="$1"
  local value

  value="$(grep -E "^${key}=" .env | head -n 1 | cut -d '=' -f2- || true)"
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"

  printf '%s' "$value"
}

POSTGRES_DB="${POSTGRES_DB:-$(get_env_value POSTGRES_DB)}"
POSTGRES_USER="${POSTGRES_USER:-$(get_env_value POSTGRES_USER)}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-$(get_env_value POSTGRES_PASSWORD)}"
API_PORT="${API_PORT:-$(get_env_value API_PORT)}"
INGEST_HEALTH_PORT="${INGEST_HEALTH_PORT:-$(get_env_value INGEST_HEALTH_PORT)}"
TELTONIKA_TCP_PORT="${TELTONIKA_TCP_PORT:-$(get_env_value TELTONIKA_TCP_PORT)}"
TELTONIKA_UDP_PORT="${TELTONIKA_UDP_PORT:-$(get_env_value TELTONIKA_UDP_PORT)}"
BOOTSTRAP_SUPERADMIN_EMAIL="${BOOTSTRAP_SUPERADMIN_EMAIL:-$(get_env_value BOOTSTRAP_SUPERADMIN_EMAIL)}"
BOOTSTRAP_SUPERADMIN_PASSWORD="${BOOTSTRAP_SUPERADMIN_PASSWORD:-$(get_env_value BOOTSTRAP_SUPERADMIN_PASSWORD)}"

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

POSTGRES_CONTAINER_ID="$(docker compose ps -q postgres)"

if [[ -z "$POSTGRES_CONTAINER_ID" ]]; then
  echo "Kon de PostgreSQL container niet vinden na het opstarten."
  exit 1
fi

echo "Wachten op PostgreSQL..."
until [[ "$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' "$POSTGRES_CONTAINER_ID")" == "healthy" ]]; do
  sleep 2
done

echo "Database migraties uitvoeren..."
docker compose exec -T postgres psql -U "${POSTGRES_USER:-vehiclelinq}" -d "${POSTGRES_DB:-vehiclelinq}" -f /dev/stdin < apps/api/src/database/migrations/001_initial.sql
docker compose exec -T postgres psql -U "${POSTGRES_USER:-vehiclelinq}" -d "${POSTGRES_DB:-vehiclelinq}" -f /dev/stdin < apps/api/src/database/migrations/002_timeseries.sql
docker compose exec -T postgres psql -U "${POSTGRES_USER:-vehiclelinq}" -d "${POSTGRES_DB:-vehiclelinq}" -f /dev/stdin < apps/api/src/database/migrations/003_retention_jobs.sql
docker compose exec -T postgres psql -U "${POSTGRES_USER:-vehiclelinq}" -d "${POSTGRES_DB:-vehiclelinq}" -f /dev/stdin < apps/api/src/database/migrations/004_trip_management.sql

echo "Applicaties bouwen en starten..."
docker compose up -d --build api ingest web

echo "Reverse proxy opnieuw opbouwen zodat upstream IP-adressen ververst worden..."
docker compose up -d --force-recreate caddy

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
