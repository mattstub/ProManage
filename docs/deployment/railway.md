# Deploying ProManage to Railway

Railway is the recommended hosting target for ProManage staging and small production deployments. It runs the same Docker images built by CI — no separate build configuration needed.

**Estimated cost**: $10–20/month for the full stack (API + web + Postgres + MinIO or Cloudflare R2).

---

## Architecture on Railway

```
GitHub repo (main branch)
    │
    ├── CI (ci.yml) — lint + type-check + test on every PR
    │
    └── Release (release.yml) — on merge to main:
            ├── Build API image → ghcr.io/mattstub/promanage-api:latest
            ├── Build web image → ghcr.io/mattstub/promanage-web:latest
            └── POST Railway deploy webhooks → Railway redeploys both services
```

Railway services:
- **api** — Fastify API, port 3001
- **web** — Next.js, port 3000
- **postgres** — Railway-managed PostgreSQL plugin
- **minio** *(optional)* — self-hosted MinIO, or use Cloudflare R2 instead

---

## Prerequisites

- Railway account at [railway.app](https://railway.app) (free to start, Hobby plan $5/month)
- GitHub repo access (public or private — both work)
- For file storage: Cloudflare R2 account (free tier) **or** budget for a Railway MinIO service

---

## Step 1 — Create a Railway Project

1. Log in to Railway → **New Project**
2. Choose **Empty project**
3. Name it `ProManage` (or whatever you prefer)

---

## Step 2 — Add PostgreSQL

1. In your Railway project → **New** → **Database** → **PostgreSQL**
2. Railway creates a managed Postgres instance and auto-provides `DATABASE_URL`
3. Note the connection string from the **Variables** tab — you'll reference it as `${{Postgres.DATABASE_URL}}` when configuring the API service

---

## Step 3 — Set Up File Storage

Choose **one** option:

### Option A — Cloudflare R2 (recommended)

R2 is S3-compatible, has a generous free tier (10 GB / 1M operations/month), and zero egress fees. The MinIO SDK in ProManage connects to it without code changes.

1. Create a [Cloudflare](https://cloudflare.com) account → **R2 Object Storage** → **Create bucket** named `promanage`
2. Go to **R2 → Manage API Tokens** → **Create API Token** with **Object Read & Write** on your bucket
3. Note your **Account ID**, **Access Key ID**, and **Secret Access Key**
4. You will set these in the API service environment:
   ```
   MINIO_ENDPOINT=<account-id>.r2.cloudflarestorage.com
   MINIO_PORT=443
   MINIO_USE_SSL=true
   MINIO_ACCESS_KEY=<access-key-id>
   MINIO_SECRET_KEY=<secret-access-key>
   ```

### Option B — MinIO on Railway

Useful if you want a fully self-contained Railway deployment without third-party storage.

1. In your project → **New** → **Docker Image** → `minio/minio`
2. Set the **Start Command**: `minio server /data --console-address :9001`
3. Add a **Volume** mounted at `/data` for persistence
4. Set **Environment Variables**:
   ```
   MINIO_ROOT_USER=<choose-a-username>
   MINIO_ROOT_PASSWORD=<choose-a-strong-password>
   ```
5. After it deploys, note the internal Railway hostname (something like `minio.railway.internal`)
6. In the API service environment, set:
   ```
   MINIO_ENDPOINT=minio.railway.internal
   MINIO_PORT=9000
   MINIO_USE_SSL=false
   MINIO_ACCESS_KEY=<same as MINIO_ROOT_USER>
   MINIO_SECRET_KEY=<same as MINIO_ROOT_PASSWORD>
   ```

---

## Step 4 — Deploy the API Service

1. In your project → **New** → **GitHub Repo** → select `mattstub/ProManage`
2. **Root Directory**: leave blank (uses repo root as Docker build context)
3. **Build**: select **Dockerfile**
4. **Dockerfile Path**: `apps/api/Dockerfile`
5. **Branch**: `main`
6. **Auto-deploy**: enabled

### API Environment Variables

Add these in the service **Variables** tab:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Railway reference syntax) |
| `JWT_SECRET` | Generate with: `openssl rand -base64 48` |
| `NODE_ENV` | `production` |
| `CORS_ORIGINS` | `https://your-web-service.up.railway.app` (update after web deploys) |
| `LOG_LEVEL` | `info` |
| `MINIO_ENDPOINT` | See Step 3 |
| `MINIO_PORT` | See Step 3 |
| `MINIO_USE_SSL` | See Step 3 |
| `MINIO_ACCESS_KEY` | See Step 3 |
| `MINIO_SECRET_KEY` | See Step 3 |

Optional:
| Variable | Value |
|---|---|
| `SENTRY_DSN` | Your Sentry project DSN (leave unset to disable) |
| `RATE_LIMIT_MAX` | `1000` (tighten for production) |

### API Health Check

Railway can verify the service is up before routing traffic:
- **Health Check Path**: `/health`
- **Timeout**: 300s

---

## Step 5 — Deploy the Web Service

1. In your project → **New** → **GitHub Repo** → select `mattstub/ProManage` again (second service)
2. **Root Directory**: leave blank
3. **Build**: **Dockerfile**
4. **Dockerfile Path**: `apps/web/Dockerfile`
5. **Branch**: `main`

### Web Build Arguments

The API URL is baked into the Next.js client bundle at build time. Set it as a **Build Argument** (not a runtime env var):

| Build Arg | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://your-api-service.up.railway.app` |

Get the API URL from the API service's **Settings → Public Networking** tab after it deploys.

### Web Environment Variables

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |

---

## Step 6 — Seed the Database

After the API service is healthy, seed the database from your local machine:

```bash
# From your local terminal
DATABASE_URL="<your Railway Postgres connection string>" \
  npx ts-node apps/api/prisma/seed.ts
```

Or using the Railway CLI:
```bash
npm install -g @railway/cli
railway login
railway run --service api npx ts-node apps/api/prisma/seed.ts
```

Default seed credentials:
| Email | Password | Role |
|---|---|---|
| `admin@demo.com` | `password123` | Admin |
| `pm@demo.com` | `password123` | ProjectManager |
| `field@demo.com` | `password123` | FieldUser |

**Change these passwords immediately in production.**

---

## Step 7 — Configure Auto-deploy Webhooks

This connects Railway to the CI/CD pipeline so Railway redeploys automatically when new images land in GHCR.

### Get Railway Deploy Webhook URLs

1. API service → **Settings** → **Deploy Hooks** → **Add Deploy Hook** → copy URL
2. Web service → **Settings** → **Deploy Hooks** → **Add Deploy Hook** → copy URL

### Add to GitHub Secrets

In your GitHub repo → **Settings** → **Secrets and variables** → **Actions**:

| Secret Name | Value |
|---|---|
| `RAILWAY_WEBHOOK_API` | Railway API service webhook URL |
| `RAILWAY_WEBHOOK_WEB` | Railway web service webhook URL |

Also add as a **Variable** (not secret — it's baked into the web build):

| Variable Name | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://your-api-service.up.railway.app` |

### How it flows after setup

```
PR merged to main
    → release.yml builds Docker images → pushes to GHCR
    → POST RAILWAY_WEBHOOK_API → Railway pulls new API image → redeploys
    → POST RAILWAY_WEBHOOK_WEB → Railway pulls new web image → redeploys
```

---

## Step 8 — Update CORS

Once you know both service URLs, update the API's `CORS_ORIGINS` variable:

```
CORS_ORIGINS=https://your-web-service.up.railway.app
```

If you add a custom domain later, add it to this list (comma-separated).

---

## Custom Domains (optional)

Railway provides auto-generated `.up.railway.app` subdomains for free. To use a custom domain:

1. Service → **Settings** → **Custom Domains** → **Add Domain**
2. Add a CNAME record in your DNS provider pointing to Railway's hostname
3. Railway handles SSL/TLS automatically

---

## Monitoring

- **Logs**: Railway dashboard → service → **Logs** tab (real-time streaming)
- **Metrics**: Railway dashboard → **Metrics** tab (CPU, memory, requests)
- **Health**: Railway shows service health status on the project board
- **Alerts**: Railway can send notifications via email or Slack on service failures

---

## Self-Hosted Alternative

If you prefer to run on your own server (VPS, dedicated machine, home server with port forwarding):

1. Install Docker + Docker Compose on the host
2. Copy `docker-compose.yml` to the server
3. Create `apps/api/.env` with production values
4. Set `JWT_SECRET` as a shell export before running `docker compose up`
5. Pull pre-built images from GHCR instead of building locally:
   - Edit `docker-compose.yml` to replace `build:` blocks with `image:` pointing to GHCR

```yaml
# Replace the build block for api service:
api:
  image: ghcr.io/mattstub/promanage-api:latest
  # ... rest of config unchanged

web:
  image: ghcr.io/mattstub/promanage-web:latest
  # ... rest of config unchanged
```

Then pull and start:
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u mattstub --password-stdin
docker compose pull
JWT_SECRET="your-secret-here" docker compose up -d
```
