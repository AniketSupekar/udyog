const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");

const formatINR = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

const openWhatsApp = (phone, lines) => {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("91") ? digits : `91${digits}`;
  const encoded = lines.map(l => encodeURIComponent(l)).join("%0A");
  const url = `https://wa.me/${normalized}?text=${encoded}`;
  window.open(url, "_blank", "noopener,noreferrer");
};

const buildUpiLink = (upiId, businessName, amount) => {
  if (!upiId?.trim() || Number(amount) <= 0) return null;
  const params = new URLSearchParams({
    pa: upiId.trim(),
    pn: businessName || "Business",
    am: Number(amount).toFixed(2),
    tn: "Order Payment",
  });
  return `${BACKEND_URL}/api/pay?${params.toString()}`;
};

const buildFooter = (businessName) => [
  ``,
  `────────────────`,
  `📲 This is an automated message from ${businessName}'s order management system.`,
  `_Powered by Udyog_`,
];

export const getQuotationUrl = (order, businessName) => {
  const phone = order.clientSnapshot?.phone;
  if (!phone) return null;

  const itemsList = order.items
    ?.map((i) => `  * ${i.productName} x ${i.quantity} ${i.unit} — ${formatINR(i.amount)}`)
    .join("\n") || "  * Items";

  openWhatsApp(phone, [
    `Hello ${order.clientSnapshot?.name} 👋`,
    ``,
    `Here's your quotation from *${businessName}* 📋`,
    ``,
    `*Items:*`,
    `--------------------------------`,
    itemsList,
    `--------------------------------`,
    `*Total Estimate: ${formatINR(order.financial?.total)}*`,
    ``,
    `_This is a quotation, not a confirmed order._`,
    `Reply to confirm and we'll get started! ✅`,
    ``,
    `— ${businessName}`,
    ...buildFooter(businessName),
  ]);
};

export const getConfirmationUrl = (order, businessName) => {
  const phone = order.clientSnapshot?.phone;
  if (!phone) return null;

  const itemsList = order.items
    ?.map((i) => `  * ${i.productName} x ${i.quantity} — ${formatINR(i.amount)}`)
    .join("\n") || "  * Order items";

  openWhatsApp(phone, [
    `Hello ${order.clientSnapshot?.name} 👋`,
    ``,
    `Your order has been confirmed! ✅`,
    ``,
    `*Order Details*`,
    `--------------------------------`,
    itemsList,
    `--------------------------------`,
    `*Total: ${formatINR(order.financial?.total)}*`,
    `Advance Paid: ${formatINR(order.payment?.advancePaid)}`,
    `*Balance Due: ${formatINR(order.payment?.remainingAmount)}*`,
    ``,
    `Delivery Date: ${formatDate(order.deliveryDate)}`,
    ``,
    `Thank you for your order! 🙏`,
    `— ${businessName}`,
    ...buildFooter(businessName),
  ]);
};

export const getPaymentReminderUrl = (order, businessName, upiId = null) => {
  const phone = order.clientSnapshot?.phone;
  if (!phone) return null;

  const upiLink = buildUpiLink(upiId, businessName, order.payment?.remainingAmount);

  const lines = [
    `Hello ${order.clientSnapshot?.name} 👋`,
    ``,
    `Gentle reminder for your pending payment.`,
    ``,
    `*Balance Due: ${formatINR(order.payment?.remainingAmount)}*`,
    `Total: ${formatINR(order.financial?.total)}`,
    `Paid: ${formatINR(order.payment?.totalPaid)}`,
    ``,
    `Delivery Date: ${formatDate(order.deliveryDate)}`,
  ];

  if (upiLink) {
    lines.push(``);
    lines.push(`💳 Pay Now:`);
    lines.push(upiLink);
    lines.push(`_(Tap to pay via PhonePe, GPay or Paytm)_`);
  }

  lines.push(``);
  lines.push(`Please clear the balance at your earliest convenience.`);
  lines.push(`Thank you 🙏`);
  lines.push(`— ${businessName}`);
  lines.push(...buildFooter(businessName));

  openWhatsApp(phone, lines);
};

export const getBillUrl = (order, businessName, upiId = null) => {
  const phone = order.clientSnapshot?.phone;
  if (!phone) return null;

  const itemsList = order.items
    ?.map((i) => `  * ${i.productName} x ${i.quantity} — ${formatINR(i.amount)}`)
    .join("\n") || "";

  const isPaid = order.payment?.remainingAmount <= 0;
  const upiLink = !isPaid
    ? buildUpiLink(upiId, businessName, order.payment?.remainingAmount)
    : null;

  const lines = [
    `*Invoice from ${businessName}*`,
    `--------------------------------`,
    ``,
    `*Bill To: ${order.clientSnapshot?.name}*`,
    `Order Date: ${formatDate(order.orderDate)}`,
    `Delivery: ${formatDate(order.deliveryDate)}`,
    ``,
    `*Items:*`,
    itemsList,
    `--------------------------------`,
    `Total: ${formatINR(order.financial?.total)}`,
    `Paid: ${formatINR(order.payment?.totalPaid)}`,
    `*${isPaid ? "✅ PAID IN FULL" : `Balance Due: ${formatINR(order.payment?.remainingAmount)}`}*`,
  ];

  if (upiLink) {
    lines.push(``);
    lines.push(`💳 Pay Now:`);
    lines.push(upiLink);
    lines.push(`_(Tap to pay via PhonePe, GPay or Paytm)_`);
  }

  lines.push(``);
  lines.push(`Thank you for your business! 🙏`);
  lines.push(`— ${businessName}`);
  lines.push(...buildFooter(businessName));

  openWhatsApp(phone, lines);
};