const crypto = require("crypto");
const config = require("../config");

const COOKIE_NAME = "linkvault_owner";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Middleware providing anonymous browser session tracking via signed httpOnly cookie.
 * Ensures req.ownerId is always populated.
 */
function sessionMiddleware(req, res, next) {
  let ownerId = req.signedCookies ? req.signedCookies[COOKIE_NAME] : null;

  if (!ownerId) {
    ownerId = crypto.randomUUID();
    res.cookie(COOKIE_NAME, ownerId, {
      httpOnly: true,
      signed: true,
      sameSite: "lax",
      secure: config.isProduction,
      maxAge: ONE_YEAR_MS
    });
  }

  req.ownerId = ownerId;
  next();
}

module.exports = sessionMiddleware;
