# syntax=docker/dockerfile:1

# The base image and npm registry are configurable so the image can be built
# where Docker Hub / npm are slow or blocked (e.g. through a local mirror):
#   docker build --build-arg NODE_IMAGE=<mirror>/library/node:24-bookworm-slim \
#                --build-arg NPM_REGISTRY=<npm mirror> .
ARG NODE_IMAGE=node:24-bookworm-slim

# ---- Build stage -----------------------------------------------------------
FROM ${NODE_IMAGE} AS builder
WORKDIR /app

ARG NPM_REGISTRY=https://registry.npmjs.org/
ENV NEXT_TELEMETRY_DISABLED=1 \
    npm_config_registry=${NPM_REGISTRY} \
    # Only needed so prisma.config.ts resolves during `prisma generate`.
    DATABASE_URL=file:/tmp/build.db

# Toolchain in case better-sqlite3 has no prebuilt binary and must compile.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm@11.24.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.ts ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build \
    && pnpm prune --prod

# ---- Runtime stage ---------------------------------------------------------
FROM ${NODE_IMAGE} AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URL=file:/app/data/app.db \
    PATH=/app/node_modules/.bin:$PATH

COPY --from=builder /app/package.json /app/next.config.ts /app/prisma.config.ts ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/lib/generated ./lib/generated

# SQLite lives here; mount a persistent volume at /app/data in production.
# The container runs as root so it can always write to platform-mounted volumes.
RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 3000

# Apply pending migrations, seed users (idempotent), then start the server.
CMD ["sh", "-c", "prisma migrate deploy && prisma db seed && next start"]
