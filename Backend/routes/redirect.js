const express = require("express");
const Link = require("../models/Link");
const { isValidCodeShape } = require("../utils/shortCode");
const renderErrorPage = require("../utils/errorPage");

const router = express.Router();

/**
 * GET /:shortCode
 * Handles redirection for valid short links.
 * Uses atomic findOneAndUpdate to increment clickCount and record lastClickedAt.
 */
router.get("/:shortCode", async (req, res, next) => {
  const { shortCode } = req.params;

  // Only handle valid short code formats; everything else falls through
  if (!isValidCodeShape(shortCode)) {
    return next();
  }

  try {
    const now = new Date();

    // Atomic find and update: counts valid unexpired redirect
    const link = await Link.findOneAndUpdate(
      {
        shortCode,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
      },
      {
        $inc: { clickCount: 1 },
        $set: { lastClickedAt: now }
      },
      {
        returnDocument: "after"
      }
    );

    if (link) {
      // Must not be cached by browser so subsequent visits are counted
      res.set("Cache-Control", "no-store");
      return res.redirect(302, link.originalUrl);
    }

    // If update returned null, check if the link exists but expired
    const existing = await Link.findOne({ shortCode }).exec();
    if (existing) {
      return res.status(410).send(
        renderErrorPage({
          statusCode: 410,
          title: "Link Expired",
          message: "This short link has expired and is no longer accessible."
        })
      );
    }

    // Short code was not found in the database
    return res.status(404).send(
      renderErrorPage({
        statusCode: 404,
        title: "Link Not Found",
        message: "We couldn't find a destination for that short link. Check the address and try again."
      })
    );
  } catch (err) {
    console.error(`Redirect error for ${shortCode}:`, err.message);
    // Safe error page: never redirect to an unverified destination on error
    return res.status(500).send(
      renderErrorPage({
        statusCode: 500,
        title: "Temporary Error",
        message: "Unable to process the redirect right now. Please try again in a moment."
      })
    );
  }
});

// HEAD /:shortCode - do not count HEAD requests per AGENTS.md §6
router.head("/:shortCode", async (req, res, next) => {
  const { shortCode } = req.params;
  if (!isValidCodeShape(shortCode)) return next();

  try {
    const now = new Date();
    const link = await Link.findOne({
      shortCode,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    }).exec();

    if (link) {
      res.set("Cache-Control", "no-store");
      return res.redirect(302, link.originalUrl);
    }

    const existing = await Link.findOne({ shortCode }).exec();
    if (existing) {
      return res.status(410).end();
    }
    return res.status(404).end();
  } catch (err) {
    return res.status(500).end();
  }
});

module.exports = router;
