# Link Vault 🔗

Link Vault is a high-performance, dark-themed URL shortener with real-time click analytics. Built with **Node.js**, **Express**, **MongoDB (Mongoose)**, and a responsive vanilla HTML/CSS/JavaScript frontend.

---

## 🚀 Features

- **Instant URL Shortening**: Generates unique, cryptographically secure 7-character base62 short codes (`crypto.randomInt`).
- **Atomic Click Tracking**: Uses atomic MongoDB `findOneAndUpdate` operations with `$inc` to guarantee accurate click counts under high concurrency.
- **Link Expiration**: Optional expiration dates (`datetime-local`) stored in UTC. Redirection ceases immediately upon expiration and serves a branded HTTP 410 Expired page without inflating click counts.
- **Anonymous Session Ownership**: No passwords or registration needed. Links are scoped to the current browser using a signed, `httpOnly`, `SameSite=Lax` cookie.
- **Branded Dark Error Pages**: Custom server-rendered HTML pages for 404 (Not Found), 410 (Expired), and 500 (Temporary Server Error).
- **Security & Reliability**: Configured with `helmet` CSP headers, 10kb JSON payload caps, IP rate limiting on link creation (30 links per 15 min), and self-redirect prevention.

---

## ⚙️ Ownership Model

Link Vault uses an **anonymous browser session model**:
- On your first request, the server issues a signed, `httpOnly`, `SameSite=Lax` cookie containing a random UUID (`ownerId`).
- All links created in this session are associated with this `ownerId`.
- Only the browser session that created a link can list or delete it. Requests to access or delete another session's links return `404 Not Found`.
- **Note**: Links are strictly "links created in this browser". Clearing browser cookies will reset access to your dashboard list (though the shortened URLs themselves will remain active and redirecting).

---

## 📊 What Counts as a "Click"?

Each valid HTTP `GET` redirect request through a short URL increments its click counter by exactly 1.
- **Important**: This is an **approximate request count**.
- It does **not** filter search-engine bots, web crawlers, or social media link-preview scrapers.
- It measures total requests, not unique human visitors.

---

## 🛠️ Environment Variables

Link Vault is configured via environment variables. Create a `.env` file in the project root:

| Variable | Required | Description | Example |
|---|---|---|---|
| `MONGODB_URI` | Yes | MongoDB Atlas or local connection string | `mongodb+srv://<user>:<password>@<cluster>/linkvault` |
| `PORT` | Yes | HTTP server listening port | `3000` |
| `BASE_URL` | Yes | Public origin used to build short URLs | `http://localhost:3000` |
| `NODE_ENV` | Yes | Environment mode (`development` or `production`) | `development` |
| `COOKIE_SECRET` | Yes | Secret key used to sign anonymous session cookies | `random-secret-string-at-least-32-chars` |

A sample template is provided in `.env.example`. **Never commit your `.env` file to version control.**

---

## 📦 Installation & Running

### Prerequisites
- Node.js `v18.x` or higher (tested on Node `v24.22.1`)
- npm `v9.x` or higher
- A running MongoDB instance or MongoDB Atlas cluster

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your MongoDB credentials:
```bash
cp .env.example .env
```

### 3. Start the Server
- **Production mode**:
  ```bash
  npm start
  ```
- **Development mode (with auto-reload)**:
  ```bash
  npm run dev
  ```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔌 API Reference

All `/api/*` endpoints respond with JSON. Errors use a uniform structure:
```json
{
  "error": {
    "code": "STRING_IDENTIFIER",
    "message": "Human readable error description"
  }
}
```

| Method & Route | Description | Status | Response Shape |
|---|---|---|---|
| `GET /api/health` | Server health check | `200` | `{"ok": true}` |
| `POST /api/links` | Create a short link | `201` | Link object with `shortUrl`, `status` |
| `GET /api/links` | List current session's links (newest first) | `200` | Array of Link objects |
| `GET /api/links/:id` | Get single link details (owner only) | `200` | Link object |
| `DELETE /api/links/:id` | Delete link (owner only) | `204` | No content |
| `GET /:shortCode` | Short URL redirect | `302` | Redirects to `originalUrl` with `Cache-Control: no-store` |

### Link Object Structure
```json
{
  "id": "6adbf33e0f78c76d19c8d9c7",
  "originalUrl": "https://example.com/long/path",
  "shortCode": "dgUivwE",
  "shortUrl": "http://localhost:3000/dgUivwE",
  "createdAt": "2026-10-24T05:22:30.123Z",
  "expiresAt": null,
  "clickCount": 0,
  "lastClickedAt": null,
  "status": "active"
}
```

---

## ⚠️ Known Limitations

1. **Approximate Click Counts**: As stated, clicks measure raw GET redirect requests and do not deduplicate IP addresses or filter web spiders.
2. **Browser-tied Management**: Clearing browser cookies or switching to an incognito window creates a new anonymous session. Existing shortened links will continue working, but they will no longer appear in the dashboard list.
3. **No User Accounts or Passwords**: The system deliberately omits user registration, email verification, or password management in favor of instant, friction-free anonymous shortening.
