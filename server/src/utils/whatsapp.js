// src/utils/whatsapp.js
// All WhatsApp message templates live here
// Returns formatted wa.me URLs ready to open WhatsApp with pre-filled text
// Pure functions — no side effects

/**
 * Format currency in Indian style
 */
const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);

/**
 * Format date to readable Indian format: 15 Jan 2024
 */
const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/**
 * Build wa.me URL from phone + message
 */
const buildWhatsAppUrl = (phone, message) => {
  // Normalize phone: strip non-digits, ensure 91 prefix
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("91") ? digits : `91${digits}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
};

/**
 * Order confirmation message
 * Sent right after order is created
 */
export const orderConfirmationMessage = (order, businessName) => {
  const itemsList = order.items
    .map((item) => `  • ${item.productName} × ${item.quantity} ${item.unit || ""} — ${formatINR(item.amount)}`)
    .join("\n");

  const message = `Hello ${order.clientSnapshot?.name} 👋

Your order has been confirmed! ✅

*Order Details*
━━━━━━━━━━━━━━━
${itemsList}
━━━━━━━━━━━━━━━
Subtotal: ${formatINR(order.financial.subtotal)}${
    order.financial.discountAmount > 0
      ? `\nDiscount: -${formatINR(order.financial.discountAmount)}`
      : ""
  }${
    order.financial.taxAmount > 0
      ? `\nTax: ${formatINR(order.financial.taxAmount)}`
      : ""
  }
*Total: ${formatINR(order.financial.total)}*
Advance Paid: ${formatINR(order.payment.advancePaid)}
*Balance Due: ${formatINR(order.payment.remainingAmount)}*

📅 Delivery Date: ${formatDate(order.deliveryDate)}

Thank you for your order! 🙏
— ${businessName}`;

  return buildWhatsAppUrl(order.clientSnapshot?.phone, message);
};

/**
 * Payment reminder message
 * Sent for overdue / pending payments
 */
export const paymentReminderMessage = (order, businessName, upiId = null) => {
  const upiSection = upiId
    ? `\n💳 Pay Online: https://pay.upi/${upiId}?amount=${order.payment.remainingAmount}`
    : "";

  const message = `Hello ${order.clientSnapshot?.name} 👋

This is a gentle reminder for your pending payment.

*Order Balance Due*
━━━━━━━━━━━━━━━
Total Amount: ${formatINR(order.financial.total)}
Amount Paid: ${formatINR(order.payment.advancePaid)}
*Balance Due: ${formatINR(order.payment.remainingAmount)}*
━━━━━━━━━━━━━━━
Delivery Date: ${formatDate(order.deliveryDate)}${upiSection}

Please clear the balance at your earliest convenience.

Thank you 🙏
— ${businessName}`;

  return buildWhatsAppUrl(order.clientSnapshot?.phone, message);
};

/**
 * Bill / invoice message
 * Sent with full order summary
 */
export const billMessage = (order, businessName, upiId = null) => {
  const itemsList = order.items
    .map((item) => `  • ${item.productName} × ${item.quantity} — ${formatINR(item.amount)}`)
    .join("\n");

  const payStatus =
    order.payment.remainingAmount <= 0 ? "✅ PAID" : `⏳ Balance: ${formatINR(order.payment.remainingAmount)}`;

  const upiLine = upiId && order.payment.remainingAmount > 0
    ? `\n💳 Pay Now: https://pay.upi/${upiId}?amount=${order.payment.remainingAmount}`
    : "";

  const message = `*Invoice from ${businessName}*
━━━━━━━━━━━━━━━

*${order.clientSnapshot?.name}*
Date: ${formatDate(order.orderDate)}
Delivery: ${formatDate(order.deliveryDate)}

*Items*
${itemsList}
━━━━━━━━━━━━━━━
${order.financial.discountAmount > 0 ? `Discount: -${formatINR(order.financial.discountAmount)}\n` : ""}${order.financial.taxAmount > 0 ? `Tax: ${formatINR(order.financial.taxAmount)}\n` : ""}*Total: ${formatINR(order.financial.total)}*
Advance: ${formatINR(order.payment.advancePaid)}
*${payStatus}*${upiLine}

Thank you for your business! 🙏`;

  return buildWhatsAppUrl(order.clientSnapshot?.phone, message);
};

export { buildWhatsAppUrl };