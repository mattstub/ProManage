# Single-stage build for pnpm monorepo.
# Multi-stage optimization (pnpm deploy / pnpm prune) can be added
# once the project needs smaller images; correctness is the priority here.
FROM node:20-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nodeuser

WORKDIR /app

# --- Manifests only (layer-cache friendly) ---
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json ./
COPY packages/core/package.json packages/core/
COPY packages/api-client/package.json packages/api-client/
COPY packages/ui-components/package.json packages/ui-components/
COPY apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile

# --- Source ---
COPY packages/ packages/
COPY apps/api/ apps/api/

# --- Build ---
RUN pnpm --filter @promanage/core build && \
    pnpm --filter @promanage/api-client build && \
    pnpm --filter @promanage/api build

# Generate Prisma client (must run after source is present)
WORKDIR /app/apps/api
RUN npx prisma generate

USER nodeuser

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/server.js"]
