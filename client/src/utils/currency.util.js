// src/utils/currency.util.js

export const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

export const formatNumber = (num = 0) =>
  new Intl.NumberFormat("en-IN").format(num);