// src/utils/calculations.js
// All financial calculations live here — pure functions, zero side effects
// Easy to unit test, easy to audit, single source of truth for math

/**
 * Calculate all order financial totals
 * @param {Array} items - line items [{ quantity, unitPrice }]
 * @param {Object} discount - { type: 'FIXED'|'PERCENTAGE', value: number }
 * @param {Object} tax - { type: 'NONE'|'GST'|'VAT', rate: number }
 * @returns {Object} { subtotal, discountAmount, taxAmount, total }
 */
export const calculateOrderTotals = (items = [], discount = {}, tax = {}) => {
  // Step 1: Subtotal — sum of all line items
  const subtotal = items.reduce((sum, item) => {
    return sum + roundMoney(item.quantity * item.unitPrice);
  }, 0);

  // Step 2: Discount
  let discountAmount = 0;
  if (discount.type === "PERCENTAGE" && discount.value > 0) {
    discountAmount = roundMoney((subtotal * discount.value) / 100);
  } else if (discount.type === "FIXED" && discount.value > 0) {
    discountAmount = Math.min(discount.value, subtotal);
  }

  const afterDiscount = roundMoney(subtotal - discountAmount);

  // Step 3: Tax
  let taxAmount = 0;
  if (tax.type !== "NONE" && tax.rate > 0) {
    taxAmount = roundMoney((afterDiscount * tax.rate) / 100);
  }

  // Step 4: Total
  const total = roundMoney(afterDiscount + taxAmount);

  return {
    subtotal,
    discountAmount,
    taxAmount,
    total,
  };
};

/**
 * Determine payment status from amounts
 */
export const getPaymentStatus = (total, totalPaid) => {
  if (totalPaid <= 0) return "UNPAID";
  if (totalPaid >= total) return "PAID";
  return "PARTIAL";
};

/**
 * Round to 2 decimal places — financial precision
 */
export const roundMoney = (value) => Math.round(value * 100) / 100;

/**
 * Calculate days overdue (negative = not yet due)
 */
export const daysOverdue = (dueDate) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.floor((now - due) / (1000 * 60 * 60 * 24));
};