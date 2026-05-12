# Architecture — Udyog

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (Vite + React)             │
│  React Router → Pages → Services (axios) → API      │
│  AuthContext (global user state)                     │
│  ToastContext (global notifications)                 │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS + httpOnly Cookie
                       │
┌──────────────────────▼──────────────────────────────┐
│                 SERVER (Express)                     │
│  CORS → Helmet → Rate Limiter → Auth Middleware      │
│  → Module Routes → Controllers → MongoDB             │
│                                                      │
│  Modules: auth, orders, payments, business,          │
│  clients, products, analytics, dashboard,            │
│  notifications, pay                                  │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
   ┌──────▼──────┐          ┌───────▼──────┐
   │  MongoDB     │          │  Redis        │
   │  (primary)   │          │  (cache)      │
   │              │          │  optional     │
   └─────────────┘          └──────────────┘
```

---

## Frontend Architecture

### Routing — `App.jsx`
- Public routes: `/login`, `/register`, `/forgot-password`, `/reset-password`
- Protected routes: wrapped in `<Layout>` — requires `user` in AuthContext
- Route guard: if `loading` → show spinner. If `user` → dashboard. If not → login.
- Fallback `*` route redirects based on auth state.

### Auth Flow
1. App loads → `AuthContext` calls `GET /api/auth/me`
2. If cookie valid → sets `user` state → protected routes accessible
3. If 401 → `user = null` → public routes only
4. Axios interceptor catches 401 on any request → redirects to `/login` (skips public paths to avoid redirect loops)

### State Management
- No Redux. Context only for global state (auth, toasts).
- Page-level state with `useState` + `useEffect`.
- No global data fetching library — each page fetches its own data.

### Services Layer — `src/services/`
Each file maps to one backend module:
```
api.js           — axios instance with baseURL + interceptors
auth.api.js      — login, logout, register, getMe, forgot/reset password
order.api.js     — fetchOrders, fetchOrderById, createOrder, updateStatus
business.api.js  — getBusinessProfile, updateBusinessProfile
payment.api.js   — recordPayment
client.api.js    — fetchClients, fetchClientById
product.api.js   — fetchProducts
dashboard.api.js — fetchDashboardSummary
analytics.api.js — fetchAnalytics
notification.api.js — fetchNotifications, markRead
```

### Design System — `index.css`
CSS variables only — no Tailwind, no component library.
```css
--color-bg, --color-surface         /* backgrounds */
--color-accent                      /* #6366F1 indigo — focus/links only */
--color-cta                         /* #0F1117 charcoal — primary buttons */
--color-text-primary/secondary/tertiary
--color-danger, --color-success, --color-warning
--radius-sm/md/lg/xl/full
--shadow-xs/sm/md/lg
--font-sans: Inter
--font-mono: DM Mono
```

Key CSS classes: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-sm`, `.input`, `.card`, `.page`, `.badge`, `.skeleton`, `.animate-in`, `.stagger`

---

## Backend Architecture

### Request Lifecycle
```
Request
  → CORS check (allowedOrigins from CLIENT_ORIGIN env var)
  → Helmet (security headers)
  → Rate limiter (apiLimiter 200/min, authLimiter 10/15min in prod)
  → Body parser + Cookie parser
  → Route match
  → Auth middleware (verifies JWT from httpOnly cookie)
  → Controller
  → asyncHandler (wraps async, catches errors)
  → globalErrorHandler (formats error response)
  → Response
```

### Module Structure
Each feature is self-contained:
```
modules/orders/
  order.routes.js      — express router, applies auth middleware
  order.controller.js  — business logic, DB queries
```

### Auth Middleware — `auth.middleware.js`
- Reads `token` from `req.cookies`
- Verifies JWT with `JWT_SECRET`
- Attaches `req.user = { userId, businessId, role }` to request
- All protected routes use this middleware

### Multi-tenancy
Every document in MongoDB has a `businessId` field.
Every controller filters by `req.user.businessId` — data is completely isolated per business.
This is the foundation for scaling to multiple businesses.

### Error Handling
- `ApiError` class — `ApiError.badRequest()`, `ApiError.unauthorized()`, `ApiError.notFound()` etc.
- `asyncHandler` — wraps every controller, catches async errors, passes to next()
- `globalErrorHandler` middleware — formats all errors into standard response:
```json
{ "success": false, "message": "...", "code": "ERROR_CODE" }
```

### Standard Response Format
```json
{ "success": true, "message": "...", "data": { ... } }
```
All responses use `sendSuccess(res, data, message, statusCode)` from `ApiResponse.js`

---

## WhatsApp + UPI Pay Flow

```
Business owner clicks "Bill" on OrderDetails page
  → getBillUrl() builds message lines array
  → buildUpiLink() creates https://udyog-backend-live.vercel.app/api/pay?pa=...&am=...
  → openWhatsApp() encodes lines with %0A (real line breaks in WhatsApp)
  → WhatsApp opens with formatted message + clickable pay link

Customer receives WhatsApp message
  → Taps pay link (https:// — WhatsApp makes it clickable)
  → Browser opens backend /api/pay route
  → Backend 302 redirects to upi://pay?pa=...&am=...
  → UPI app (PhonePe/GPay/Paytm) opens with amount prefilled
```

Why this works: WhatsApp only makes `https://` links clickable.
Raw `upi://` links appear as plain text. The backend acts as an HTTPS→UPI bridge.

---

## Redis Caching Strategy
- Redis is **optional** — if URL missing or connection fails, all cache ops are no-ops
- `getCache(key)` → returns null on miss or failure
- `setCache(key, value, ttl)` → silent fail if Redis down
- Used for dashboard summaries and analytics to reduce DB load
- Cache is invalidated on order/payment updates via `delCache(pattern)`

---

## Rate Limiting
```
authLimiter   — 100 req/15min dev, 10 req/15min prod (login, register)
apiLimiter    — 1000 req/min dev, 200 req/min prod (all /api routes)
cronLimiter   — 5 req/min (cron webhook only)
```
`skipSuccessfulRequests: true` on authLimiter — only failed attempts count toward limit.

---

## Deployment Architecture
Both frontend and backend deploy to Vercel.
- Frontend: static Vite build, served from CDN
- Backend: Vercel Serverless Functions (each request spins up a function)
- `vercel.json` on backend routes all requests to Express app
- MongoDB: Atlas (cloud)
- Redis: Upstash or Redis Cloud (serverless-compatible)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full setup.