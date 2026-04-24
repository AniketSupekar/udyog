// src/utils/whatsapp.util.js
// Builds wa.me URLs — opens WhatsApp with pre-filled message
// All message templates live here — single source of truth

const formatINR = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const buildUrl = (phone, message) => {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("91") ? digits : `91${digits}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
};

// Build UPI payment deeplink
const buildUpiLink = (upiId, amount, orderId) => {
  if (!upiId) return null;
  const params = new URLSearchParams({
    pa: upiId,
    am: amount,
    cu: "INR",
    tn: `Order payment`,
  });
  return `upi://pay?${params.toString()}`;
};

/**
 * Order confirmation — sent right after order is created
 */
export const getConfirmationUrl = (order, businessName) => {
  const phone = order.clientSnapshot?.phone;
  if (!phone) return null;

  const itemsList = order.items
    ?.map((i) => `  • ${i.productName} × ${i.quantity} — ${formatINR(i.amount)}`)
    .join("\n") || "  • Order items";

  const message = `Hello ${order.clientSnapshot?.name} 👋

Your order has been confirmed! ✅

*Order Details*
━━━━━━━━━━━━━━━
${itemsList}
━━━━━━━━━━━━━━━
*Total: ${formatINR(order.financial?.total)}*
Advance Paid: ${formatINR(order.payment?.advancePaid)}
*Balance Due: ${formatINR(order.payment?.remainingAmount)}*

📅 Delivery Date: ${formatDate(order.deliveryDate)}

Thank you for your order! 🙏
— ${businessName}`;

  return buildUrl(phone, message);
};

/**
 * Payment reminder — for pending/overdue payments
 */
export const getPaymentReminderUrl = (order, businessName, upiId = null) => {
  const phone = order.clientSnapshot?.phone;
  if (!phone) return null;

  const upiSection = upiId
    ? `\n💳 Pay Now: ${buildUpiLink(upiId, order.payment?.remainingAmount, order._id)}`
    : "";

  const message = `Hello ${order.clientSnapshot?.name} 👋

Gentle reminder for your pending payment.

*Balance Due: ${formatINR(order.payment?.remainingAmount)}*
Order Total: ${formatINR(order.financial?.total)}
Paid: ${formatINR(order.payment?.totalPaid)}

Delivery Date: ${formatDate(order.deliveryDate)}${upiSection}

Please clear the balance at your earliest convenience.
Thank you 🙏
— ${businessName}`;

  return buildUrl(phone, message);
};

/**
 * Bill/Invoice message
 */
export const getBillUrl = (order, businessName, upiId = null) => {
  const phone = order.clientSnapshot?.phone;
  if (!phone) return null;

  const itemsList = order.items
    ?.map((i) => `  • ${i.productName} × ${i.quantity} — ${formatINR(i.amount)}`)
    .join("\n") || "";

  const isPaid = order.payment?.remainingAmount <= 0;
  const upiSection =
    !isPaid && upiId
      ? `\n💳 Pay Now: ${buildUpiLink(upiId, order.payment?.remainingAmount, order._id)}`
      : "";

  const message = `*Invoice from ${businessName}*
━━━━━━━━━━━━━━━

*${order.clientSnapshot?.name}*
Order Date: ${formatDate(order.orderDate)}
Delivery: ${formatDate(order.deliveryDate)}

*Items*
${itemsList}
━━━━━━━━━━━━━━━
*Total: ${formatINR(order.financial?.total)}*
Paid: ${formatINR(order.payment?.totalPaid)}
*${isPaid ? "✅ PAID" : `Balance Due: ${formatINR(order.payment?.remainingAmount)}`}*${upiSection}

Thank you for your business! 🙏
— ${businessName}`;

  return buildUrl(phone, message);
};