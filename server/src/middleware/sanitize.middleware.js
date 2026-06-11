// src/middleware/sanitize.middleware.js
// Runs on every request before controllers
// 1. Trims all string fields recursively
// 2. Strips HTML tags to prevent XSS via stored content
// 3. Enforces hard length limits on common string fields
// 4. Removes any keys starting with $ (belt-and-suspenders on top of mongoSanitize)

const HTML_TAG_REGEX = /<[^>]*>/g;

// Fields with specific max lengths — everything else gets the default 2000 char limit
const FIELD_LIMITS = {
  email:         254,
  password:      128,
  name:          100,
  businessName:  100,
  phone:          20,
  otp:            10,
  token:         512,
  slug:           60,
  tagline:       160,
  description:   1000,
  notes:         2000,
  address:        300,
  category:        60,
  unit:            30,
  invoicePrefix:   10,
  gstNumber:       20,
  upiId:           60,
  reference:      100,
};

const DEFAULT_MAX_LENGTH = 2000;

// Strip HTML tags from a string
const stripHtml = (str) => str.replace(HTML_TAG_REGEX, "");

// Enforce max length for a given key
const enforceLength = (key, value) => {
  const limit = FIELD_LIMITS[key] ?? DEFAULT_MAX_LENGTH;
  return value.length > limit ? value.slice(0, limit) : value;
};

// Remove keys that start with $ (extra safety layer)
const hasDangerousKey = (key) => key.startsWith("$") || key.includes(".");

// Recursively sanitize an object or array
const sanitizeValue = (key, value) => {
  if (typeof value === "string") {
    let clean = value.trim();
    clean = stripHtml(clean);
    clean = enforceLength(key, clean);
    return clean;
  }

  if (Array.isArray(value)) {
    return value.map((item, idx) => sanitizeValue(String(idx), item));
  }

  if (value !== null && typeof value === "object") {
    return sanitizeObject(value);
  }

  return value;
};

const sanitizeObject = (obj) => {
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (hasDangerousKey(key)) continue; // drop dangerous keys silently
    clean[key] = sanitizeValue(key, value);
  }
  return clean;
};

export const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === "object") {
    req.query = sanitizeObject(req.query);
  }

  // Don't sanitize req.params — IDs and slugs should stay as-is
  // mongoSanitize already handles $ injection in params

  next();
};