# Quickstart: Health Check Endpoint

**Feature**: `001-health-check-endpoint`  
**Date**: 2026-02-23

This guide lets a developer verify the health check endpoint is working within
two minutes of cloning the repo.

---

## Prerequisites

- Node.js LTS installed
- A `.env` file at the project root (copy from `.env.example`)

```bash
cp .env.example .env
```

The health endpoint does **not** require a running database.

---

## Step 1 — Install dependencies

```bash
npm install
```

This also installs `supertest` (devDependency) needed for the test suite.

---

## Step 2 — Start the development server

```bash
npm run dev
```

Expected output (example):

```
[nodemon] starting `node src/server.js`
Server running on port 3010
```

---

## Step 3 — Call the endpoint

### Option A — curl

```bash
curl -s http://localhost:3010/health | json_pp
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-02-23T10:00:00.000Z",
  "uptimeSeconds": 3,
  "version": "1.0.0"
}
```

### Option B — JetBrains HTTP Client (`requests.http`)

1. Open `requests.http` in the project root in WebStorm or IntelliJ.
2. Click the green **▶** button next to the `GET {{baseUrl}}/health` entry.
3. The IDE runs the request against `http://localhost:3010` and shows the response.

---

## Step 4 — Run the test suite

```bash
npm test
```

Expected output:

```
  GET /health
    ✓ responds with HTTP 200
    ✓ returns Content-Type application/json
    ✓ body has status === "ok"
    ✓ body has a valid ISO-8601 timestamp
    ✓ body has a non-negative integer uptimeSeconds
    ✓ body has a non-empty version string
    ✓ responds without requiring an Authorization header

  7 passing (Xms)
```

All tests must pass (`npm test` exits 0) before the feature is considered done.

---

## TDD Workflow (Test-First)

Per the project constitution (Principle II), tests are written **before** production code.

1. Write `test/health.test.js` with all assertions → run `npm test` → confirm **RED** (failures expected).
2. Create `src/controllers/health.controller.js` and `src/routes/health.routes.js`.
3. Wire them into `src/app.js`.
4. Run `npm test` → confirm **GREEN** (all pass).
5. Refactor if needed → confirm still **GREEN**.

---

## File Map

| File | Role |
|------|------|
| `src/app.js` | Express app factory — wire router here |
| `src/routes/health.routes.js` | Mount `GET /` → delegate to controller |
| `src/controllers/health.controller.js` | Build and send the JSON response |
| `test/health.test.js` | Mocha/Chai tests (import `app.js`) |
| `requests.http` | JetBrains HTTP Client example |
| `specs/001-health-check-endpoint/contracts/GET-health.md` | API contract |

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `Cannot GET /health` (404) | Router not mounted in `app.js` | Add `app.use('/health', require('./routes/health.routes'))` |
| `version: "unknown"` in response | `package.json` path wrong in `require()` | Verify relative path from `src/controllers/` to root is `../../package.json` |
| Tests fail with `ECONNREFUSED` | `server.js` imported instead of `app.js` | Change test import to `require('../src/app')` |
| Response time >50ms in tests | Unexpected I/O in handler | Ensure no `require()` calls inside the handler function |

