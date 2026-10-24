const express = require("express");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const Link = require("../models/Link");
const config = require("../config");
const validateUrl = require("../utils/validateUrl");
const validateExpiry = require("../utils/validateExpiry");
const { generateShortCode } = require("../utils/shortCode");

const router = express.Router();

// Rate limiter for POST /api/links (30 requests per 15 minutes per IP)
const createLinkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many link creation requests. Please try again later."
    }
  }
});

/**
 * POST /api/links
 * Create a new short link for the current owner.
 */
router.post("/", createLinkLimiter, async (req, res, next) => {
  try {
    const { originalUrl, expiresAt } = req.body || {};

    const validatedUrl = validateUrl(originalUrl);
    const validatedExpiryDate = validateExpiry(expiresAt);

    let createdLink = null;
    let attempts = 0;
    const MAX_RETRIES = 5;

    while (attempts < MAX_RETRIES) {
      const code = generateShortCode();
      try {
        const link = new Link({
          originalUrl: validatedUrl,
          shortCode: code,
          ownerId: req.ownerId,
          expiresAt: validatedExpiryDate
        });
        createdLink = await link.save();
        break;
      } catch (err) {
        if (err.code === 11000 && err.keyPattern && err.keyPattern.shortCode) {
          // Collision on shortCode, retry with a fresh code
          attempts++;
        } else {
          throw err;
        }
      }
    }

function getBaseUrl(req) {
  // If a non-localhost BASE_URL is set in config, respect it
  if (config.baseUrl && !config.baseUrl.includes("localhost") && !config.baseUrl.includes("127.0.0.1")) {
    return config.baseUrl;
  }
  // Otherwise dynamically match the host header from the request so LAN/phone/other devices work seamlessly
  const host = req.get("host");
  if (host) {
    const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
    return `${proto}://${host}`;
  }
  return config.baseUrl;
}

    if (!createdLink) {
      const error = new Error("Failed to generate a unique short link. Please try again.");
      error.status = 500;
      error.code = "COLLISION_RETRY_EXHAUSTED";
      return next(error);
    }

    res.status(201).json(createdLink.toClientJSON(getBaseUrl(req)));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/links
 * List links created by the current owner, newest first.
 */
router.get("/", async (req, res, next) => {
  try {
    const baseUrl = getBaseUrl(req);
    const links = await Link.find({ ownerId: req.ownerId })
      .sort({ createdAt: -1 })
      .exec();

    const formatted = links.map((link) => link.toClientJSON(baseUrl));
    res.status(200).json(formatted);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/links/:id
 * Get details for a single link (owner only).
 */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: {
          code: "INVALID_ID",
          message: "The provided link ID is invalid"
        }
      });
    }

    const link = await Link.findOne({ _id: id, ownerId: req.ownerId });
    if (!link) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Link not found"
        }
      });
    }

    res.status(200).json(link.toClientJSON(getBaseUrl(req)));
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/links/:id
 * Delete a link (owner only).
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: {
          code: "INVALID_ID",
          message: "The provided link ID is invalid"
        }
      });
    }

    const result = await Link.findOneAndDelete({ _id: id, ownerId: req.ownerId });
    if (!result) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Link not found"
        }
      });
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
