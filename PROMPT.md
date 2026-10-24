# PROMPT.md: Antigravity kickoff prompt for Link Vault

## How to use

1. Put `AGENTS.md`, `IMPLEMENTATION_PLAN.md`, and this file in the **project root** (next to `package.json`).
2. Open the project folder in Antigravity.
3. Open the Agent Manager, start a new task, and paste everything under **"Prompt to paste"** below.
4. Review the agent's Phase 0 summary before letting it continue, then approve each phase checkpoint.

Tips:

- Keep `.env` filled in with your real `MONGODB_URI`, `PORT`, `BASE_URL`, `COOKIE_SECRET` before you start. The agent is told never to print it.
- If the agent asks to install a package, check it against the list in `IMPLEMENTATION_PLAN.md` Phase 0 before approving.
- If you ever shared your MongoDB connection string in a chat or committed it, rotate the password in MongoDB Atlas first.

---

## Prompt to paste

You are working in an existing project called **Link Vault**, a URL shortener with click analytics. The frontend is already designed and finished. Your job is to build a real Node.js + Express + MongoDB (Mongoose) backend and connect the existing frontend to it so the full loop works end to end: create a short link, open it, get redirected, and see the click count increase.

**Before doing anything else, read these two files completely:**

1. `AGENTS.md`: the standing rules, API contract, data model, security requirements, frontend integration rules, and verification checklist. Follow it exactly.
2. `IMPLEMENTATION_PLAN.md`: the ordered phases (0 to 6) with checks for each.

**Project facts you must respect:**

- The frontend is `frotnend/snip-connect.html`. The folder name is misspelled; do **not** rename it.
- The backend entry point is `Backend/server.js`.
- `package.json` and `node_modules` are at the project root. Dependencies are supposed to be installed; verify in `package.json` and tell me if anything is missing instead of installing a long list.
- `.env` contains real secrets. **Never open, print, log, or copy its contents.** Read config only through `dotenv`. Use placeholders in `.env.example`.
- Preserve the frontend's design. Only make the changes listed in `AGENTS.md` §9. The existing page has a `localStorage` demo and fake `snip.link` URLs that must be replaced with real API calls. It also has an unclosed `main{` CSS rule to fix.
- There is no authentication. Use the anonymous signed-cookie ownership model described in `AGENTS.md` §7, and describe it honestly as "links created in this browser".

**How to work:**

1. Start with **Phase 0** only: inspect the repo, then post a short summary of the current state and the gaps against `AGENTS.md`. Wait for my go-ahead before writing code.
2. Then work through Phases 1 to 6 in order. After each phase, run its checks, post a brief status with the **actual observed results** (pass or fail), and continue unless something needs my decision.
3. Keep the code beginner-readable: clear names, small files, comments that explain why. No unnecessary dependencies or abstractions.
4. Fix root causes. Don't hide errors with empty catch blocks or fake success messages, and don't mock the database to make a test pass.
5. Do not add anything listed as out of scope in `AGENTS.md` §13 (auth, billing, QR codes, custom aliases, unique-visitor tracking, geo or device analytics, and so on).
6. Don't claim any feature works unless you ran it and saw it work. If you cannot test something (for example, MongoDB is unreachable), say so plainly.
7. Ask me only when a decision is really mine: branding ("Link Vault" vs the "Snip.Link®" ticker), the folder rename, the unverified "Redirects in under 40ms" ticker claim, or deployment. Otherwise make a reasonable choice, note the assumption, and keep going.

**Non-negotiables (summary; the full rules are in AGENTS.md):**

- Redirect route: single atomic `findOneAndUpdate` (unexpired filter, `$inc` clickCount, set `lastClickedAt`), `302`, `Cache-Control: no-store`. Unknown code returns 404, expired returns 410 (no count increase). Never redirect to an unverified destination on a DB error.
- Short codes: server-generated, 7 base62 characters from `crypto`, unique index, retry on duplicate-key error 11000, reserved words blocked.
- URL validation on the server: http/https only, hostname required, length cap, reject this app's own host. Expiry must be a valid future date. No TTL index.
- `helmet`, JSON body limit, and rate limiting on `POST /api/links`. Consistent JSON error shape. No stack traces or Mongo errors sent to clients.
- Route order: security/parsing → session cookie → `/api` → static frontend and `GET /` → `/:shortCode` → 404 → error handler. Same-origin frontend, so no CORS.
- Clicks are an approximate count of valid redirect requests. They are not unique visitors and not bot-filtered. Say that in the README and never claim otherwise.

**Final deliverable:** the working app plus a final report in the format in `AGENTS.md` §14: what was implemented, files changed, commands run with real results, required env vars, how to run it, known limitations, and open questions. Never include secret values in the report.

Begin with Phase 0 now.
