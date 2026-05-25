# Udyog : Business Operations Management

Udyog is a mobile-first SaaS application that helps Indian small businesses manage orders, track deliveries, record payments, and send WhatsApp invoices with UPI payment links.

Built to scale across multiple business types — nurseries, textile, retail, food, and any order-driven business.

**Production URL:** https://udyog-live.vercel.app  
**Backend API:** https://udyog-backend-live.vercel.app

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6 |
| Backend | Node.js, Express.js (ES Modules) |
| Database | MongoDB + Mongoose |
| Auth | JWT in httpOnly cookie |
| Email | Resend |
| Cache | Redis (ioredis) — optional, degrades gracefully |
| Deployment | Vercel (both frontend and backend) |
| Styling | Custom CSS variables — no UI library |
| Font | Inter |

---

## Project Structure

```
udyog/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── context/         # AuthContext, ToastContext
│       ├── pages/           # One file per route/page
│       ├── services/        # API call functions (per module)
│       └── utils/           # Formatting helpers, WhatsApp util
├── server/                  # Express backend
│   └── src/
│       ├── config/          # DB, Redis, Email, Env config
│       ├── middleware/       # Auth, error, rate limiter
│       ├── models/          # Mongoose models
│       ├── modules/         # Feature modules (routes + controller)
│       └── utils/           # ApiError, ApiResponse, helpers
└── docs/                    # This documentation
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (optional — app works without it)

### 1. Clone the repo

```bash
git clone https://github.com/yourname/udyog.git
cd udyog
```

### 2. Setup server

```bash
cd server
npm install
cp .env.example .env   # fill in your values
npm run dev
```

Server runs on `http://localhost:5000`

### 3. Setup client

```bash
cd client
npm install
cp .env.development.example .env.development  # fill in your values
npm run dev
```

Client runs on `http://localhost:5173`

---

## Environment Variables

### Server `.env`

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/udyog
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=30d
CLIENT_ORIGIN=http://localhost:5173
RESEND_API_KEY=re_xxxxxxxxxxxx
APP_URL=http://localhost:5173
REDIS_LOCAL_URL=redis://localhost:6379
REDIS_PROD_URL=redis://your-prod-redis-url
```

### Client `.env.development`

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Client `.env.production`

```env
VITE_API_BASE_URL=https://udyog-backend-live.vercel.app/api
```

---

## Key Scripts

```bash
# Server
npm run dev       # nodemon dev server
npm start         # production

# Client
npm run dev       # Vite dev server
npm run build     # production build
npm run preview   # preview production build...
```

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full Vercel deployment guide.
