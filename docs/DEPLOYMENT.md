# Deployment — Udyog

Both frontend and backend are deployed on Vercel. MongoDB on Atlas. Redis on Upstash (serverless-compatible).

---

## Architecture on Vercel

```
udyog-live.vercel.app          → Vite static build (frontend)
udyog-backend-live.vercel.app  → Express serverless functions (backend)
```

Vercel treats the Express app as a single serverless function.
Each request cold-starts the function if idle — keep startup fast (no heavy sync operations on import).

---

## Backend Deployment

### 1. `vercel.json` — required in `server/`
```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

### 2. Environment Variables on Vercel (backend project)
Add these in Vercel → backend project → Settings → Environment Variables:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Random string, min 32 chars |
| `JWT_EXPIRES_IN` | `30d` |
| `CLIENT_ORIGIN` | `https://udyog-live.vercel.app` |
| `RESEND_API_KEY` | From resend.com/api-keys |
| `APP_URL` | `https://udyog-live.vercel.app` |
| `REDIS_PROD_URL` | Upstash Redis URL (optional) |

**Critical:** After adding/changing env vars, you MUST redeploy manually.
Vercel does NOT auto-redeploy on env var changes.

### 3. Deploy
```bash
cd server
vercel --prod
```

Or push to `main` branch if GitHub integration is connected.

---

## Frontend Deployment

### 1. Environment Variables on Vercel (frontend project)
| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://udyog-backend-live.vercel.app/api` |

**Critical:** Vite bakes env vars at build time. Wrong env var = wrong URL in every user's browser until next deploy.

### 2. Deploy
```bash
cd client
vercel --prod
```

Or push to `main` branch.

---

## Local Development

### Server
```bash
cd server
npm install
npm run dev    # nodemon, port 5000
```

### Client
```bash
cd client
npm install
npm run dev    # Vite, port 5173
```

Client `.env.development`:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

**After changing any `.env` file — restart the dev server. Vite does NOT hot-reload env changes.**

---

## MongoDB Atlas Setup

1. Create cluster on mongodb.com/atlas (free M0 tier works)
2. Add IP `0.0.0.0/0` to Network Access (Vercel uses dynamic IPs)
3. Create database user
4. Get connection string → paste as `MONGO_URI`

---

## Resend Email Setup

1. Create account on resend.com
2. For dev/testing: use `FROM = "onboarding@resend.dev"` — works without domain verification
3. For production: verify your domain in Resend dashboard
4. Get API key → set as `RESEND_API_KEY`

---

## Redis Setup (Optional)

App works without Redis — cache ops degrade to no-ops silently.

For production caching:
1. Create free account on upstash.com
2. Create Redis database → get connection URL
3. Set as `REDIS_PROD_URL`

---

## Common Issues

### CORS error in production
- Check `CLIENT_ORIGIN` is set correctly on backend Vercel project
- No trailing slash: `https://udyog-live.vercel.app` ✅ not `https://udyog-live.vercel.app/` ❌
- Redeploy backend after adding the env var

### Server crash (500 on all routes)
- Check Vercel function logs: Vercel → backend → Deployments → View Logs
- Usually caused by missing required env var (`MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`)
- `RESEND_API_KEY` missing causes crash at import — set it or it throws

### Login works locally but not in production
- Check `VITE_API_BASE_URL` in frontend Vercel env vars
- Redeploy frontend after changing

### WhatsApp pay link not clickable
- Only happens in dev (localhost URLs are not clickable in WhatsApp)
- Works correctly in production with real `https://` domain
- Test pay links only on production

### Rate limited (429)
- Auth routes: 10 requests per 15 min in prod (100 in dev)
- Wait for the window to expire or increase limits temporarily in `rateLimiter.middleware.js`

---

## Cron Job Setup

Delivery notification cron — triggers `POST /api/cron/notifications`.

Set up on cron-job.org or Vercel Cron:
- URL: `https://udyog-backend-live.vercel.app/api/cron/notifications`
- Method: POST
- Schedule: `0 8 * * *` (8 AM daily)