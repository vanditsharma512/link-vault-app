# Link Vault: Backend Implementation Plan

Companion to `AGENTS.md` (the rules). This file is the ordered work. Complete each phase, run its checks, post a short status, then continue.

**Starting point:** finished single-file frontend at `frontend/snip-connect.html` (uses `localStorage`, fake `snip.link` URLs), a stub `Backend/server.js`, root `package.json`, a `.env` with secrets, and installed dependencies.

**End state:** a working MERN-style app (MongoDB + Express + Node, with the existing vanilla HTML frontend instead of React) where the full create → share → visit → redirect → count loop works.

---

## Phase 0: Inspect and report gaps

- [ ] Read `package.json`: module type, scripts, installed dependencies and versions.
- [ ] Read `Backend/server.js` (is it empty or a stub?).
- [ ] Read `frontend/snip-connect.html` fully. Note every place it touches `localStorage`, `snip.link`, or fakes clicks.
- [ ] Check `.gitignore` exists and covers `.env` and `node_modules/`. **Do not open or print `.env`.**
- [ ] Confirm which of these are installed: `express`, `mongoose`, `dotenv`, `helmet`, `express-rate-limit`, `cookie-parser`. List anything missing.
- [ ] Post a short gap summary. If a package is missing, ask before installing.

**Checkpoint:** gap summary posted.

---

## Phase 1: Config, database, model

- [ ] `Backend/config.js`: load `dotenv`, read and validate `MONGODB_URI`, `PORT`, `BASE_URL`, `NODE_ENV`, `COOKIE_SECRET`. Missing variable → clear error naming it, exit.
- [ ] Create `.env.example` (placeholders) and update `.gitignore`.
- [ ] `Backend/models/Link.js`: schema from `AGENTS.md` §5. Unique index on `shortCode`, index on `ownerId`. `timestamps: true`.
- [ ] `Backend/server.js`: connect to MongoDB, then start listening. Add `GET /api/health` returning `{ ok: true }`.
- [ ] Add npm scripts if missing: `"start": "node Backend/server.js"` and `"dev": "node --watch Backend/server.js"` (or nodemon if already installed).

**Check:** `npm run dev` starts, logs a successful DB connection (no secrets in the log), `GET /api/health` returns 200.

---

## Phase 2: Utilities and session

- [ ] `utils/validateUrl.js`: trim, add `https://` if no scheme, `new URL()`, http/https only, hostname required, max 2048 chars, reject own host. Returns a normalised URL string or throws a typed validation error.
- [ ] `utils/validateExpiry.js` (or inside the route): optional, valid date, strictly in the future, returned as a `Date`.
- [ ] `utils/shortCode.js`: 7 base62 chars via `crypto.randomInt`; reject reserved words.
- [ ] `middleware/session.js`: signed httpOnly `SameSite=Lax` cookie with `ownerId` (`crypto.randomUUID()`); `Secure` in production; sets `req.ownerId`.

**Check:** quick Node script or unit tests: valid/invalid URLs (`javascript:`, `file:`, empty, 3000-char URL, no scheme), past/future expiry, 1000 generated codes contain only base62 and none are reserved.

---

## Phase 3: Create and redirect (the core loop)

- [ ] `routes/links.js` `POST /api/links`: validate, generate code, save with `ownerId`, retry up to 5× on duplicate-key `11000`, return `201` with the link plus `shortUrl` and `status`.
- [ ] `routes/redirect.js` `GET /:shortCode`: shape check, atomic `findOneAndUpdate` (unexpired filter + `$inc` + `lastClickedAt`), `302` with `Cache-Control: no-store`. On `null`, second lookup → `404` or `410`. Safe `500` page on DB error, never redirect unverified.
- [ ] Server-rendered 404 and 410 HTML pages in the Link Vault dark style (shared tiny helper).
- [ ] `middleware/errors.js`: JSON 404 for unknown `/api/*`, central error handler with the standard error shape, no stack traces.
- [ ] Wire route order exactly as in `AGENTS.md` §10.

**Check (curl):**

```bash
# create
curl -i -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{"originalUrl":"https://example.com/some/long/path"}' -c jar.txt

# redirect (expect 302 + Location, Cache-Control: no-store)
curl -i http://localhost:3000/<code>

# unknown (expect 404 HTML)
curl -i http://localhost:3000/zzzzzzz

# invalid inputs (expect 400 with standard error JSON)
curl -i -X POST http://localhost:3000/api/links -H "Content-Type: application/json" -d '{"originalUrl":"javascript:alert(1)"}'
curl -i -X POST http://localhost:3000/api/links -H "Content-Type: application/json" -d '{"originalUrl":"https://example.com","expiresAt":"2020-01-01T00:00:00Z"}'
```

Confirm in the DB or via the API that `clickCount` went up by exactly 1 per redirect.

---

## Phase 4: Expiry, list, details, delete, limits

- [ ] Expiry end to end: create a link expiring ~10 s in the future, redirect works, wait, redirect returns `410` and the count does not change.
- [ ] `GET /api/links`: owner-filtered, newest first, each item has computed `status`.
- [ ] `GET /api/links/:id` and `DELETE /api/links/:id`: validate id, owner-filtered, `404` for others' or missing links, `204` on delete.
- [ ] Add `helmet`, `express.json({ limit: '10kb' })`, `express-rate-limit` on `POST /api/links`.
- [ ] Ownership test: use two cookie jars; jar B cannot see, fetch, or delete jar A's link.
- [ ] Concurrency test: fire 10–20 parallel requests at one short code (e.g. `xargs -P` or a small Node script); final `clickCount` must equal the number of successful redirects.

**Checkpoint:** all backend acceptance checks pass; status posted with real results.

---

## Phase 5: Serve and connect the frontend

- [ ] Serve `frontend/` statically; `GET /` returns `snip-connect.html`.
- [ ] In `snip-connect.html`, apply the allowed changes from `AGENTS.md` §9:
  - [ ] Remove `localStorage` logic and the `snip.link` hardcoding.
  - [ ] `fetch('/api/links')` on load; render rows from API data (short URL from `shortUrl`, original URL, click count, status).
  - [ ] Loading, empty, and error states in the existing visual style.
  - [ ] `POST /api/links` from the Shorten button / Enter key; show server errors in `#err`.
  - [ ] Optional expiry `datetime-local` field, converted to UTC ISO; expiry status shown in each row.
  - [ ] Delete with a confirmation step.
  - [ ] Copy copies the real short URL; keep the "Copied" feedback.
  - [ ] Short link opens the real URL in a new tab; refresh the list on window focus so counts update.
  - [ ] Stats (Links, Clicks) computed from real data.
  - [ ] Close the unterminated `main{...}` CSS rule.
- [ ] Disable the Shorten button while a request is pending (prevent double submits).
- [ ] Keep accessibility: labels on inputs, visible focus, keyboard operable controls, `aria-live` for status/error text.

**Check (manual or scripted browser test):**

- Paste URL → Shorten → row appears with real short URL.
- Open short URL in a new tab → redirected; return to dashboard → count is 1.
- Create a link with an expiry a minute away → shows expiry; after it passes, opening shows the expired page.
- Delete asks for confirmation, then removes the row.
- Stop the backend and reload → friendly error state, no blank page.
- Layout at ~375px and ~1280px: no horizontal scroll, controls usable.

---

## Phase 6: Documentation and final verification

- [ ] `README.md`: what the app is, ownership model (anonymous browser session), what a "click" means (approximate request count, not unique, not bot-filtered), env var table, install and run commands, API reference table, known limitations.
- [ ] Re-run every check in `AGENTS.md` §11 and record real results.
- [ ] Confirm `.env` is not tracked and no secret appears in any file, log, or the report.
- [ ] Produce the final report in the format from `AGENTS.md` §14.

---

## Acceptance checklist (from the project context)

- [x] A valid long URL can be submitted and stored
- [x] A unique short code and usable short URL are generated
- [x] The short URL redirects to the correct destination
- [x] Opening the short URL increments its click count
- [x] Unknown codes return a meaningful not-found response
- [x] Optional expiry can be saved and is enforced during redirection
- [x] Invalid URLs and invalid or past expiry dates are rejected
- [x] Link information and click counts are visible in the UI
- [x] Copy-to-clipboard works and gives feedback
- [x] Loading, empty, success, and error states are handled
- [x] Works at common desktop and mobile widths
- [x] Database credentials are not committed
- [x] Setup instructions explain env vars and how to run the app

Mark an item only after you have observed it working.

---

## Risks to watch

| Risk | Mitigation |
|---|---|
| Short code route swallows `/api` or static files | Strict route order and code-shape regex |
| Browser caches 302 and skips counting | `Cache-Control: no-store` |
| Count lost under concurrency | Single atomic `findOneAndUpdate` with `$inc` |
| Expired links vanish and can't show status | No TTL index; compare at request time |
| Short URL shows wrong origin | Build from `BASE_URL`, not from the request host |
| Redirect loop via own URL | Reject own host in URL validation |
| Link previews and bots inflate counts | Documented limitation; do not claim filtering |
| Secrets leaked in logs or report | Never print `.env` or the connection string |
