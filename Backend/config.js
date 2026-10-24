require("dotenv").config();

// List of required environment variables per AGENTS.md
const REQUIRED_ENV_VARS = [
  "MONGODB_URI",
  "PORT",
  "BASE_URL",
  "NODE_ENV",
  "COOKIE_SECRET"
];

for (const varName of REQUIRED_ENV_VARS) {
  if (!process.env[varName] || process.env[varName].trim() === "") {
    console.error(`Configuration error: Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

const config = {
  mongodbUri: process.env.MONGODB_URI.trim(),
  port: parseInt(process.env.PORT, 10) || 3000,
  baseUrl: process.env.BASE_URL.trim().replace(/\/+$/, ""),
  nodeEnv: process.env.NODE_ENV.trim(),
  cookieSecret: process.env.COOKIE_SECRET.trim(),
  isProduction: process.env.NODE_ENV.trim() === "production"
};

module.exports = config;
