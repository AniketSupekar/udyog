# Changelog — Udyog

All notable changes to Udyog are documented here.
Format: `[version] — date — description`

---

## [0.2.0] — May 2026 — UI Redesign + Production Fixes

### Design System
- Migrated font from DM Sans to Inter — sharper, better on budget Android phones
- New color palette: charcoal CTA (#0F1117) + indigo accent (#6366F1) — replaces green
- Auth pages redesigned: Login, Register, OTP verify, Forgot Password, Reset Password
- OTP screen: individual digit boxes with paste support and auto-focus between digits
- Centered headings on all auth pages, removed brand mark placeholder

### Bug Fixes
- Fixed infinite redirect loop on `/login` — axios interceptor now skips redirect on public paths
- Fixed CORS error in production — `RESEND_API_KEY` missing caused server crash at import
- Fixed `getMe` not passing businessId in AuthContext
- Fixed `getBusinessProfile` wrong function name in OrderDetails (was `getMyBusiness`)
- Fixed WhatsApp message formatting — switched from `\n` to `%0A` encoding for real line breaks
- Fixed UPI pay link — now routes through backend `/api/pay` → 302 redirect to `upi://`
- Fixed FAB (create order button) overlapping nav bar on mobile

### Features
- WhatsApp Bill: UPI pay link now clickable in WhatsApp (https→upi redirect via backend)
- Bill preview now shows real business details from Settings (was hardcoded "My Business")
- Added `/api/pay` public route for UPI deep link redirect
- Rate limiter: relaxed to 1000 req/min in dev, 200 in prod
- Redis and RESEND_API_KEY made optional — server no longer crashes if missing

---

## [0.1.0] — March 2026 — Initial Build

### Features shipped
- Full auth flow: register, OTP verify, login, forgot/reset password
- Orders: create, list, details, status transitions, soft delete, edit
- Payments: record payment, history, balance tracking
- WhatsApp: confirmation, payment reminder, bill messages
- Bill: preview modal, PDF print via react-to-print
- Dashboard: summary cards, due today, overdue, upcoming orders
- Clients: list, details, order history
- Products: list, create, edit
- Analytics: revenue charts, top products
- Notifications: delivery reminders via cron, bell with badge
- Settings: business profile, UPI ID
- Onboarding: first-time setup flow
- Multi-tenancy: all data isolated by businessId
- Rate limiting: auth and API limiters
- Redis caching: dashboard and analytics
- Deployed to Vercel (frontend + backend)