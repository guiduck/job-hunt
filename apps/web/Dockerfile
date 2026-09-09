FROM node:22-bookworm-slim AS base

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/apps/web

FROM base AS dependencies

COPY package.json package-lock.json ./
RUN npm ci --include=dev --no-audit --no-fund

FROM base AS production-dependencies

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

FROM dependencies AS build

COPY . ./
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
RUN npx prisma generate && npm run build

FROM base AS web-runtime

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./.next/static

FROM production-dependencies AS worker-runtime

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY prisma ./prisma
COPY scripts ./scripts
COPY lib ./lib
COPY worker ./worker
COPY realtime ./realtime
COPY tsconfig.json ./

RUN npx prisma generate
