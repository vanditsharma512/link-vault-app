const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const config = require("./config");
const sessionMiddleware = require("./middleware/session");
const { apiNotFoundHandler, errorHandler } = require("./middleware/errors");
const linksRoutes = require("./routes/links");
const redirectRoutes = require("./routes/redirect");
const renderErrorPage = require("./utils/errorPage");

const app = express();
if (config.isProduction) {
  // Trust first proxy hop when deployed behind reverse proxy (e.g. Render/Cloudflare) per AGENTS.md §8
  app.set("trust proxy", 1);
}

// Path to frontend directory
const frontendPath = path.join(__dirname, "..", "frontend");

// 1. Security and parsing middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"]
      }
    }
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser(config.cookieSecret));

// 2. Anonymous session cookie middleware
app.use(sessionMiddleware);

// 3. API Routes
app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true });
});
app.use("/api/links", linksRoutes);

// Catch-all for unknown /api/* requests before static and redirect handlers
app.use("/api", apiNotFoundHandler);

// 4. Static frontend files and GET /
app.use(express.static(frontendPath));
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "snip-connect.html"));
});

// 5. Short code redirect route (mounted after static files)
app.use("/", redirectRoutes);

// 6. Non-API 404 fallback page
app.use((req, res) => {
  res.status(404).send(
    renderErrorPage({
      statusCode: 404,
      title: "Page Not Found",
      message: "The requested resource could not be found."
    })
  );
});

// 7. Central error handler
app.use(errorHandler);

// Connect to MongoDB before listening per AGENTS.md §10
async function startServer() {
  const maxRetries = 5;
  const retryDelay = 1500;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(config.mongodbUri);
      console.log("Connected to MongoDB successfully.");

      app.listen(config.port, () => {
        console.log(`Link Vault server running in ${config.nodeEnv} mode at ${config.baseUrl}`);
      });
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt}/${maxRetries} failed:`, err.message);
      if (attempt < maxRetries) {
        console.log(`Retrying connection in ${retryDelay}ms...`);
        await new Promise((r) => setTimeout(r, retryDelay));
      } else {
        console.error("All MongoDB connection attempts exhausted. Exiting.");
        process.exit(1);
      }
    }
  }
}

startServer();

module.exports = app;