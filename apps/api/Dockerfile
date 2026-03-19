# Single-stage build for pnpm monorepo.
# Multi-stage optimization (pnpm deploy / pnpm prune) can be added
# once the project needs smaller images; correctness is the priority here.
FROM node:20-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apk add --no-cache openssl && \
    corepack enable && \
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

# --- Generate Prisma client before build (types required by tsc) ---
COPY apps/api/prisma/ apps/api/prisma/
RUN pnpm --filter @promanage/api exec prisma generate

# --- Source ---
COPY packages/ packages/
COPY apps/api/ apps/api/

# --- Build ---
RUN pnpm --filter @promanage/core build && \
    pnpm --filter @promanage/api-client build && \
    pnpm --filter @promanage/api build

USER nodeuser

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "apps/api/dist/server.js"]
