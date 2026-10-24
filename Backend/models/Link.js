const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: true,
      trim: true
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    ownerId: {
      type: String,
      required: true,
      index: true
    },
    expiresAt: {
      type: Date,
      default: null
    },
    clickCount: {
      type: Number,
      default: 0
    },
    lastClickedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Method to format a link document according to the API contract (AGENTS.md §6)
linkSchema.methods.toClientJSON = function (baseUrl) {
  const isExpired = this.expiresAt && new Date(this.expiresAt).getTime() <= Date.now();
  return {
    id: this._id.toString(),
    originalUrl: this.originalUrl,
    shortCode: this.shortCode,
    shortUrl: `${baseUrl}/${this.shortCode}`,
    createdAt: this.createdAt,
    expiresAt: this.expiresAt,
    clickCount: this.clickCount,
    lastClickedAt: this.lastClickedAt,
    status: isExpired ? "expired" : "active"
  };
};

const Link = mongoose.model("Link", linkSchema);

module.exports = Link;
