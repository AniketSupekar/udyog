# API Reference — Udyog

Base URL: `https://udyog-backend-live.vercel.app/api`

All protected routes require a valid JWT cookie (`token`).
All responses follow: `{ success, message, data }`

---

## Auth — `/api/auth`

### POST `/auth/register`
Create a new business + admin user.
```json
Body: { "businessName": "string", "name": "string", "email": "string", "password": "string (min 8)" }
Response: { "userId", "email", "requiresVerification": true }
```

### POST `/auth/verify-email`
Verify OTP sent to email. Auto-logs in on success (sets cookie).
```json
Body: { "email": "string", "otp": "string (6 digits)" }
Response: { "userId", "businessId", "name", "email", "role", "onboardingCompleted" }
Cookie: token (httpOnly, 30d)
```

### POST `/auth/resend-otp`
Resend verification OTP.
```json
Body: { "email": "string" }
```

### POST `/auth/login`
```json
Body: { "email": "string", "password": "string" }
Response: { "userId", "businessId", "name", "email", "role", "isEmailVerified", "onboardingCompleted" }
Cookie: token (httpOnly, 30d)
```

### POST `/auth/logout`
Clears the token cookie.

### GET `/auth/me` 🔒
Returns current user from cookie.
```json
Response: { "_id", "name", "email", "businessId", "role", "isEmailVerified", "onboardingCompleted", "lastLoginAt" }
```

### POST `/auth/forgot-password`
Sends password reset email. Always returns 200 (security — don't reveal if email exists).
```json
Body: { "email": "string" }
```

### POST `/auth/reset-password`
```json
Body: { "token": "string", "password": "string (min 8)" }
```

### PATCH `/auth/complete-onboarding` 🔒
Marks user and business onboarding as complete.

---

## Orders — `/api/orders` 🔒

### GET `/orders`
```
Query: page, limit, search, status, filter (overdue|due-today|upcoming)
Response: { data: [...orders], pagination: { total, page, totalPages } }
```

### POST `/orders`
Create new order.
```json
Body: {
  "clientId": "string",
  "items": [{ "productId", "productName", "quantity", "unit", "unitPrice", "amount" }],
  "deliveryDate": "ISO date",
  "orderDate": "ISO date",
  "advancePaid": "number",
  "notes": "string",
  "financial": { "subtotal", "discountAmount", "taxRate", "taxAmount", "total" }
}
```

### GET `/orders/:id`
Full order details including items, payment history, financial summary.

### PATCH `/orders/:id/status`
```json
Body: { "status": "PENDING | DELIVERED | CANCELLED" }
```

### PATCH `/orders/:id`
Update order details (customer snapshot, dates, notes).

### DELETE `/orders/:id`
Soft delete — sets `isDeleted: true`.

---

## Payments — `/api/payments` 🔒

### POST `/payments/orders/:orderId`
Record a payment against an order.
```json
Body: { "amount": "number", "method": "Cash|UPI|Bank Transfer|Cheque", "note": "string" }
Response: Updated order with new payment transaction
```

---

## Business — `/api/business` 🔒

### GET `/business/profile`
Returns business profile for the authenticated user's business.
```json
Response: { "_id", "name", "phone", "address", "upiId", "onboarding" }
```

### PATCH `/business/profile`
Update business profile.
```json
Body: { "name", "phone", "address", "upiId" } (all optional)
```

---

## Clients — `/api/clients` 🔒

### GET `/clients`
```
Query: page, limit, search
```

### POST `/clients`
```json
Body: { "name": "string", "phone": "string", "address": "string" }
```

### GET `/clients/:id`
Client details + order history.

### PATCH `/clients/:id`
### DELETE `/clients/:id`

---

## Products — `/api/products` 🔒

### GET `/products`
### POST `/products`
```json
Body: { "name": "string", "price": "number", "unit": "string" }
```
### PATCH `/products/:id`
### DELETE `/products/:id`

---

## Dashboard — `/api/dashboard` 🔒

### GET `/dashboard/summary`
```json
Response: {
  "todayOrders": "number",
  "totalRevenue": "number",
  "pendingPayments": "number",
  "deliveredToday": "number"
}
```

### GET `/dashboard/due-today`
### GET `/dashboard/overdue`
### GET `/dashboard/upcoming`

---

## Analytics — `/api/analytics` 🔒

### GET `/analytics/revenue`
```
Query: period (7d|30d|90d|1y)
```

### GET `/analytics/top-products`
### GET `/analytics/order-status`

---

## Notifications — `/api/notifications` 🔒

### GET `/notifications`
### PATCH `/notifications/:id/read`
### PATCH `/notifications/read-all`

---

## Pay — `/api/pay` (PUBLIC)

### GET `/pay`
UPI deep link redirect. No auth required.
```
Query: pa (UPI ID), pn (payee name), am (amount), tn (transaction note)
Response: 302 redirect to upi://pay?pa=...&am=...&cu=INR&tn=...
```
Used by WhatsApp pay links — converts clickable https:// to upi:// deep link.

---

## Cron — `/api/cron` (Protected by cronLimiter)

### POST `/cron/notifications`
Creates delivery reminder notifications for all orders due tomorrow.
Called by external cron service daily at 8 AM.