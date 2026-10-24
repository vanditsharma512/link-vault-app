const crypto = require("crypto");

const BASE62_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CODE_LENGTH = 7;
const RESERVED_WORDS = new Set(["api", "assets", "static", "favicon", "health", "admin"]);
const SHORT_CODE_REGEX = /^[A-Za-z0-9]{6,10}$/;

/**
 * Generates a cryptographically secure 7-character base62 short code.
 * Ensures generated code is not a reserved word.
 *
 * @returns {string} 7-character base62 string
 */
function generateShortCode() {
  let attempts = 0;
  while (attempts < 20) {
    let code = "";
    for (let i = 0; i < CODE_LENGTH; i++) {
      const idx = crypto.randomInt(0, BASE62_CHARS.length);
      code += BASE62_CHARS[idx];
    }

    if (!RESERVED_WORDS.has(code.toLowerCase())) {
      return code;
    }
    attempts++;
  }

  throw new Error("Unable to generate unique short code");
}

/**
 * Checks if a string conforms to the allowed short code pattern.
 *
 * @param {string} code
 * @returns {boolean}
 */
function isValidCodeShape(code) {
  if (!code || typeof code !== "string") return false;
  return SHORT_CODE_REGEX.test(code) && !RESERVED_WORDS.has(code.toLowerCase());
}

module.exports = {
  generateShortCode,
  isValidCodeShape,
  RESERVED_WORDS,
  SHORT_CODE_REGEX
};
