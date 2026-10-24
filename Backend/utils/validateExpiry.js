/**
 * Validates an optional expiration date.
 * - If absent/null/empty: returns null (link never expires)
 * - Must parse to a valid date
 * - Must be strictly in the future
 *
 * @param {string|Date|null|undefined} expiresAt
 * @returns {Date|null} Valid future Date in UTC or null
 */
function validateExpiry(expiresAt) {
  if (expiresAt === undefined || expiresAt === null || expiresAt === "") {
    return null;
  }

  const date = new Date(expiresAt);
  if (isNaN(date.getTime())) {
    const error = new Error("Invalid expiration date format");
    error.status = 400;
    error.code = "INVALID_EXPIRY";
    throw error;
  }

  if (date.getTime() <= Date.now()) {
    const error = new Error("Expiration date must be in the future");
    error.status = 400;
    error.code = "EXPIRY_IN_PAST";
    throw error;
  }

  return date;
}

module.exports = validateExpiry;
