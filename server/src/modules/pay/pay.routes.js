/**
 * modules/pay/pay.routes.js
 *
 * GET /api/pay?pa=upiid&pn=BusinessName&am=500&tn=Order+Payment
 *
 * Public redirect route — gives WhatsApp a tappable HTTPS link.
 * WhatsApp only hyperlinks https:// URLs — raw upi:// appears as plain text.
 * This route receives UPI params and 302 redirects to upi:// deep link
 * which opens customer's UPI app (PhonePe / GPay / Paytm) with fields prefilled.
 *
 * No auth required — public redirect like a payment link.
 */

import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  const { pa, pn, am, tn } = req.query;

  if (!pa) {
    return res.status(400).send("Missing UPI ID (pa)");
  }

  const params = new URLSearchParams();
  params.set("pa", pa);
  if (pn) params.set("pn", pn);
  if (am) params.set("am", am);
  params.set("cu", "INR");
  params.set("tn", tn || "Order Payment");

  const upiDeepLink = `upi://pay?${params.toString()}`;

  // 302 so it's not cached
  res.redirect(302, upiDeepLink);
});

export default router;