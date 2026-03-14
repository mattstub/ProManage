# Stage 1: Build
FROM node:20-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

# --- Manifests only (layer-cache friendly) ---
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json ./
COPY packages/core/package.json packages/core/
COPY packages/api-client/package.json packages/api-client/
COPY packages/ui-components/package.json packages/ui-components/
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile

# --- Source ---
COPY packages/ packages/
COPY apps/web/ apps/web/

# Build workspace deps in order
RUN pnpm --filter @promanage/core build && \
    pnpm --filter @promanage/api-client build && \
    pnpm --filter @promanage/ui-components build

# NEXT_PUBLIC_API_URL is baked into the client bundle at build time
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm --filter @promanage/web build

# Stage 2: Minimal runtime using Next.js standalone output
FROM node:20-alpine AS runner

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

WORKDIR /app

# Public assets
COPY --from=builder /app/apps/web/public ./public

# Standalone bundle (server.js + all required node_modules, no devDeps)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

USER nextjs

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000
CMD ["node", "server.js"]
