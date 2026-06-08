// src/utils/slug.js

/**
 * Generate a URL-safe slug from a business name
 * "Pixel Prints & Co." → "pixel-prints-co"
 */
export const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")  // remove special chars
    .replace(/\s+/g, "-")           // spaces to hyphens
    .replace(/-+/g, "-")            // collapse multiple hyphens
    .slice(0, 50);                  // max 50 chars
};

/**
 * Make a slug unique by appending a number if taken
 * Usage: pass a check function that queries DB
 */
export const makeUniqueSlug = async (baseSlug, checkFn) => {
  let slug = baseSlug;
  let counter = 1;
  while (await checkFn(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
};