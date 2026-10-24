const config = require("../config");

/**
 * Validates and normalizes an input URL.
 * - Trims whitespace
 * - Rejects non-HTTP/HTTPS schemes (javascript:, file:, data:, ftp:, etc.)
 * - Prepends 'https://' if no scheme is provided
 * - Validates with new URL()
 * - Only http: and https: protocols allowed
 * - Requires a hostname
 * - Caps max length to 2048 characters
 * - Rejects URLs matching this app's own host (prevents redirect loops)
 *
 * @param {string} rawUrl
 * @returns {string} Normalized URL string
 */
function validateUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") {
    const error = new Error("URL is required and must be a string");
    error.status = 400;
    error.code = "INVALID_URL";
    throw error;
  }

  let trimmed = rawUrl.trim();
  if (!trimmed) {
    const error = new Error("URL cannot be empty");
    error.status = 400;
    error.code = "INVALID_URL";
    throw error;
  }

  if (trimmed.length > 2048) {
    const error = new Error("URL exceeds maximum length of 2048 characters");
    error.status = 400;
    error.code = "URL_TOO_LONG";
    throw error;
  }

  // Detect non-HTTP schemes (e.g. javascript:, file:, data:, ftp:, etc.)
  const colonIdx = trimmed.indexOf(":");
  const slashIdx = trimmed.indexOf("/");
  if (colonIdx > 0 && (slashIdx === -1 || colonIdx < slashIdx)) {
    const potentialScheme = trimmed.slice(0, colonIdx).toLowerCase();
    if (potentialScheme !== "http" && potentialScheme !== "https") {
      // If it contains "://" (like file://, ftp://) or matches standard non-http URI schemes
      if (
        trimmed.slice(colonIdx).startsWith("://") ||
        ["javascript", "file", "data", "vbscript", "about", "mailto", "ftp", "tel", "sms"].includes(potentialScheme)
      ) {
        const error = new Error("Only HTTP and HTTPS URLs are allowed");
        error.status = 400;
        error.code = "INVALID_PROTOCOL";
        throw error;
      }
    }
  }

  // Prepend https:// if no scheme is specified (per existing frontend behavior and AGENTS.md §8)
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
    trimmed = "https://" + trimmed;
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    const error = new Error("Please provide a valid URL");
    error.status = 400;
    error.code = "INVALID_URL";
    throw error;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    const error = new Error("Only HTTP and HTTPS URLs are allowed");
    error.status = 400;
    error.code = "INVALID_PROTOCOL";
    throw error;
  }

  if (!parsed.hostname || parsed.hostname.length === 0) {
    const error = new Error("URL must include a valid hostname");
    error.status = 400;
    error.code = "INVALID_URL";
    throw error;
  }

  // Check for redirect loop against app's own host
  try {
    const appHost = new URL(config.baseUrl).host.toLowerCase();
    if (parsed.host.toLowerCase() === appHost) {
      const error = new Error("URLs pointing to this service are not allowed");
      error.status = 400;
      error.code = "SELF_REDIRECT_NOT_ALLOWED";
      throw error;
    }
  } catch {
    // If baseUrl cannot be parsed, continue
  }

  return parsed.href;
}

module.exports = validateUrl;
