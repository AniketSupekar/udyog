# Features — Udyog

Complete map of every feature — built, in progress, and planned.

---

## ✅ Built & Shipped

### Authentication
- **Register** — business name, name, email, password. Creates Business + User in a MongoDB transaction.
- **Email OTP verification** — 6-digit code sent via Resend. Individual OTP input boxes with paste support and auto-focus.
- **Login** — email + password. Failed attempt tracking (locks after 10 failures for 30 min).
- **Forgot password** — sends reset link via email (Resend). Token hashed in DB.
- **Reset password** — token validated, password updated, token cleared.
- **Persistent session** — JWT in httpOnly cookie, 30-day expiry.
- **Auto-logout** — 401 interceptor redirects to login on expired session.

### Orders
- **Create order** — select client, add products with quantity/price, set delivery date, advance payment, notes, discount, tax.
- **Orders list** — paginated (15/page), search by client name, filter by status (CREATED/PENDING/DELIVERED/CANCELLED).
- **Order details** — full order view with customer, dates, items, payment summary, payment history, notes.
- **Edit order** — edit customer snapshot, dates, notes (not items — by design).
- **Status transitions** — CREATED → PENDING → DELIVERED. Each transition is one-tap.
- **Soft delete** — orders are marked deleted, not removed from DB.
- **Dashboard filters** — orders list accepts `filter=overdue|due-today|upcoming` and `status=` params from dashboard deep links.

### Payments
- **Record payment** — amount, method (Cash/UPI/Bank Transfer/Cheque), note.
- **Payment history** — all transactions listed on order details.
- **Balance tracking** — remaining amount calculated and shown in red/green.
- **Payment status badge** — UNPAID / PARTIAL / PAID auto-calculated.

### WhatsApp Integration
- **Order confirmation** — formatted message with items, total, balance, delivery date.
- **Payment reminder** — balance due with UPI pay link.
- **Bill/Invoice** — full invoice message with items, totals, UPI pay link.
- **UPI pay link** — clickable `https://` link in WhatsApp → backend redirects to `upi://` → UPI app opens with amount prefilled.
- All messages use `%0A` encoding for proper line breaks in WhatsApp.

### Bill / Invoice
- **Bill preview** — clean invoice with business details, client details, items table, totals.
- **PDF print/download** — via `react-to-print`.
- **Business details on bill** — pulled from business profile (Settings).

### Dashboard
- **Summary cards** — today's orders, total revenue, pending payments, delivered orders.
- **Due today** — orders with delivery date = today.
- **Overdue orders** — past delivery date, not delivered.
- **Upcoming orders** — next 7 days deliveries.
- All dashboard sections are deep-linked to filtered orders list.

### Clients
- **Client list** — search, paginated.
- **Client details** — client info + order history.
- **Client select** — searchable dropdown when creating orders.

### Products
- **Product list** — all products with price and unit.
- **Create/edit product** — name, price, unit (kg/piece/dozen etc).
- Products are used as templates when creating orders.

### Analytics
- Revenue over time chart.
- Top products by revenue.
- Order status breakdown.

### Notifications
- **Delivery reminders** — created by cron job for orders due tomorrow.
- **Notification bell** — badge count, panel with all notifications.
- **Mark as read** — individual and bulk.

### Settings
- **Business profile** — name, phone, address, UPI ID.
- UPI ID is used in WhatsApp pay links and bill preview.

### Onboarding
- First-time setup flow after registration.
- Business profile completion tracked via `onboardingCompleted` flag.

---

## 🔧 Known Issues / Tech Debt

- `window.confirm` used for destructive actions — should be replaced with custom modal
- No input validation library (zod/joi) — controllers do manual validation
- No API versioning — all routes are `/api/` not `/api/v1/`
- No test coverage
- Console.log statements should be replaced with proper logger (winston/pino)

---

## ⬜ Planned Features

### High Priority (next sprint)
- [ ] **Multi-user roles** — owner adds staff with limited access (no delete, no financials)
- [ ] **Expense tracking** — record business expenses alongside revenue
- [ ] **Low stock alerts** — notify when product quantity below threshold
- [ ] **Bulk order status update** — mark multiple orders delivered at once

### Medium Priority
- [ ] **Daily summary notification** — WhatsApp/email to owner every morning
- [ ] **Customer portal** — clients track their own orders via link
- [ ] **CSV export** — orders, payments, clients
- [ ] **Bulk import** — create orders from CSV

### Scale Features
- [ ] **Subscription billing** — Razorpay integration, plans, trial period
- [ ] **Multiple business support** — one owner, multiple businesses
- [ ] **Mobile app** — React Native (same API)
- [ ] **WhatsApp Business API** — replace wa.me links with proper API (WATI/Twilio) at scale

---

## Business Logic Rules

### Order Status Machine
```
CREATED → PENDING → DELIVERED
CREATED → CANCELLED
PENDING → CANCELLED
(DELIVERED and CANCELLED are terminal states)
```

### Payment Calculation
```
remainingAmount = total - totalPaid
status = remainingAmount === 0 ? PAID : totalPaid > 0 ? PARTIAL : UNPAID
```

### Multi-tenancy Rule
Every DB query MUST filter by `businessId: req.user.businessId`.
Never query without businessId — this is the data isolation guarantee.

### Overdue Definition
Orders where `deliveryDate < today` AND `status !== DELIVERED` AND `status !== CANCELLED`.