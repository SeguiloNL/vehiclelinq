FROM node:20-bookworm-slim

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/ingest/package.json apps/ingest/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --no-frozen-lockfile

COPY . .

CMD ["pnpm", "--filter", "@vehiclelinq/ingest", "start"]
