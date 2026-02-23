# Implementation Plan: Health Check Endpoint

**Branch**: `001-health-check-endpoint` | **Date**: 2026-02-23 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/001-health-check-endpoint/spec.md`

---

## Summary

Add a `GET /health` endpoint to the Express backend that returns a lightweight JSON
payload — `{ status, timestamp, uptimeSeconds, version }` — with no database access,
no authentication, and a guaranteed sub-50 ms response time. The endpoint enables
developers and CI/CD pipelines to confirm the Node.js process is alive and serving
the expected build version.

**Technical approach**:
- Route in `src/routes/health.routes.js` delegates to controller.
- Controller in `src/controllers/health.controller.js` assembles the payload from
  Node.js built-ins and a one-time `require('../../package.json')` call.
- Mounted in `src/app.js` after `morgan`, before the error handler.
- Tested with Mocha + Chai + `supertest` in `test/health.test.js`.
- Developer ergonomics covered by `requests.http` at the project root.

---

## Technical Context

**Language/Version**: Node.js LTS — CommonJS (`"type": "commonjs"`)  
**Primary Dependencies**: Express 5.2.1, morgan 1.10.1, cors 2.8.6, dotenv 17.3.1  
**Storage**: N/A — this feature performs zero database or file-system I/O at request time  
**Testing**: Mocha 11.x + Chai 6.x + supertest (new devDependency — see research D-005)  
**Target Platform**: Linux/macOS/Windows server running Node.js LTS  
**Project Type**: REST API web service  
**Performance Goals**: < 50 ms response time per request on local developer hardware  
**Constraints**: No DB access; no authentication; no new runtime dependencies; CommonJS only  
**Scale/Scope**: Single endpoint; zero state; trivially parallelisable

---

## Constitution Check

*GATE: Must pass before implementation begins. Re-checked after design (Phase 1).*

- [x] **I. Layered Architecture** — `health.routes.js` only mounts the path and delegates
  to `healthController.getHealth`. `health.controller.js` builds and sends the response.
  No business logic or DB access anywhere in the health-check path. ✅ PASS

- [x] **II. Test-First (NON-NEGOTIABLE)** — `test/health.test.js` is written first and
  confirmed FAILING (Red) before any production code is committed. The test file imports
  `src/app.js`, not `src/server.js`. Seven test cases cover all acceptance criteria.
  ✅ PASS

- [x] **III. Configuration via Environment** — No new environment variables are
  introduced. No hard-coded ports or credentials in `src/`. `.env.example` is unchanged.
  ✅ PASS

- [x] **IV. Observability** — Morgan is registered as the first middleware in `app.js`.
  The 4-arg `(err, req, res, next)` error handler remains the last middleware. `/health`
  returns `{ status: "ok", timestamp: <ISO-string> }` with HTTP 200. ✅ PASS

- [x] **V. Simplicity & YAGNI** — No speculative abstractions. No service layer (no
  business logic to encapsulate). One new devDependency (`supertest`) documented in
  `research.md` (D-005). CommonJS `require`/`module.exports` throughout. `nodemon`
  remains in `devDependencies` only. ✅ PASS

> **Constitution Check Result: ALL GATES PASS — no violations, no deviations required.**

---

## Architecture Design

### Middleware Execution Order in `src/app.js`

```
Request
  │
  ▼
morgan('dev')                     ← first (Principle IV)
  │
  ▼
cors()                            ← already in use
  │
  ▼
express.json()                    ← standard body parsing
  │
  ▼
GET /health → healthRouter        ← this feature
  │              └── healthController.getHealth(req, res)
  │
  ▼
(err, req, res, next) handler     ← last (Principle IV)
```

### Layer Responsibilities

| Layer | File | Responsibility |
|-------|------|----------------|
| Route | `src/routes/health.routes.js` | Create `express.Router()`; mount `GET /` → controller |
| Controller | `src/controllers/health.controller.js` | Read built-ins; build payload; `res.json()` |
| App wiring | `src/app.js` | `app.use('/health', healthRouter)` between morgan and error handler |
| Process entry | `src/server.js` | `app.listen(PORT)` — unchanged by this feature |

### Data Flow

```
GET /health
  → morgan logs request
  → healthRouter matches GET /
  → healthController.getHealth(req, res)
      APP_VERSION  ← require('../../package.json').version [cached at module load]
      timestamp    ← new Date().toISOString()
      uptime       ← Math.floor(process.uptime())
      res.status(200).json({ status, timestamp, uptimeSeconds, version })
  → morgan logs response
```

---

## API Design

> Full contract: [`contracts/GET-health.md`](./contracts/GET-health.md)

**Endpoint**: `GET /health`  
**Auth**: None  
**Response**: HTTP 200, `Content-Type: application/json`

```json
{
  "status": "ok",
  "timestamp": "2026-02-23T10:00:00.000Z",
  "uptimeSeconds": 42,
  "version": "1.0.0"
}
```

| Field | Source | Notes |
|-------|--------|-------|
| `status` | Literal `"ok"` | Never changes while process is running |
| `timestamp` | `new Date().toISOString()` | Fresh UTC ISO-8601 per request |
| `uptimeSeconds` | `Math.floor(process.uptime())` | Integer; 0 on fresh start |
| `version` | `require('../../package.json').version` | Cached at load; falls back to `"unknown"` |

---

## Testing Approach

### Framework
Mocha 11.x + Chai 6.x + `supertest` (new devDependency)

### Test File
`test/health.test.js` — imports `src/app.js` (never `src/server.js`)

### Test Cases (FR-008 coverage)

| # | Description | Assertion |
|---|-------------|-----------|
| 1 | Happy path status code | `res.status` === 200 |
| 2 | Content-Type header | `res.headers['content-type']` contains `application/json` |
| 3 | `status` field | `res.body.status` === `'ok'` (string) |
| 4 | `timestamp` field type | `res.body.timestamp` is a string; `new Date(res.body.timestamp)` is valid |
| 5 | `uptimeSeconds` field type | `res.body.uptimeSeconds` is a number; `Number.isInteger(...)` is true; value ≥ 0 |
| 6 | `version` field type | `res.body.version` is a non-empty string |
| 7 | No auth required | Request with no `Authorization` header → still 200 |

### TDD Mandate (Principle II)

```
STEP 1: Write all 7 test cases in test/health.test.js
STEP 2: Run `npm test` → CONFIRM RED (7 failures expected)
STEP 3: Implement controller and routes
STEP 4: Wire into app.js
STEP 5: Run `npm test` → CONFIRM GREEN (7 passing)
STEP 6: Refactor if needed → CONFIRM still GREEN
```

The feature is NOT done until Step 5 is confirmed.

---

## Implementation Checklist

### New devDependency

- [ ] `npm install --save-dev supertest`

### Files to Create / Modify

| Action | File | Notes |
|--------|------|-------|
| **Create** | `test/health.test.js` | Write first (TDD Red phase) |
| **Create** | `src/controllers/health.controller.js` | `getHealth` function; `require('../../package.json')` at top |
| **Create** | `src/routes/health.routes.js` | `Router()`; `GET /` → `healthController.getHealth` |
| **Modify** | `src/app.js` | Wire up: morgan, cors, express.json, healthRouter, error handler |
| **Modify** | `src/server.js` | `dotenv.config()`; `app.listen(PORT)` |
| **Create** | `requests.http` | JetBrains HTTP Client example for `GET /health` |

### No Changes Required

| File | Reason |
|------|--------|
| `src/config/db.js` | Health check has zero DB interaction |
| `.env.example` | No new environment variables |
| `package.json` scripts | Existing `npm test` and `npm run dev` are sufficient |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-health-check-endpoint/
├── plan.md          ← this file
├── spec.md          ← feature specification
├── research.md      ← Phase 0: all decisions resolved
├── data-model.md    ← Phase 1: HealthPayload value object
├── quickstart.md    ← Phase 1: 2-minute developer guide
├── contracts/
│   └── GET-health.md ← Phase 1: API contract
└── tasks.md         ← Phase 2: created by /speckit.tasks (not this command)
```

### Source Code (this feature)

```text
src/
├── app.js                          ← MODIFY: wire router
├── server.js                       ← MODIFY: dotenv + listen
├── config/
│   └── db.js                       ← unchanged
├── controllers/
│   └── health.controller.js        ← CREATE
└── routes/
    └── health.routes.js            ← CREATE

test/
└── health.test.js                  ← CREATE (write first)

requests.http                       ← CREATE (project root)
```

---

## Pseudo-code Reference

### `src/controllers/health.controller.js`

```js
'use strict';

// Read once at module load — cached by Node's module system
let APP_VERSION;
try {
  APP_VERSION = require('../../package.json').version || 'unknown';
} catch (_) {
  APP_VERSION = 'unknown';
}

function getHealth(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    version: APP_VERSION,
  });
}

module.exports = { getHealth };
```

### `src/routes/health.routes.js`

```js
'use strict';

const { Router } = require('express');
const { getHealth } = require('../controllers/health.controller');

const router = Router();

router.get('/', getHealth);

module.exports = router;
```

### `src/app.js` (skeleton)

```js
'use strict';

const express = require('express');
const morgan  = require('morgan');
const cors    = require('cors');

const healthRouter = require('./routes/health.routes');

const app = express();

// Principle IV: morgan first
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Feature routes
app.use('/health', healthRouter);

// Principle IV: 4-arg error handler last
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
```

### `src/server.js` (skeleton)

```js
'use strict';

require('dotenv').config();

const app  = require('./app');
const PORT = process.env.PORT || 3010;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Principle IV: surface uncaught errors
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = server;
```

### `test/health.test.js` (skeleton — write BEFORE production code)

```js
'use strict';

const request = require('supertest');
const { expect } = require('chai');
const app = require('../src/app');

describe('GET /health', () => {
  it('responds with HTTP 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).to.equal(200);
  });

  it('returns Content-Type application/json', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).to.match(/application\/json/);
  });

  it('body has status === "ok"', async () => {
    const res = await request(app).get('/health');
    expect(res.body.status).to.equal('ok');
  });

  it('body has a valid ISO-8601 timestamp', async () => {
    const res = await request(app).get('/health');
    expect(res.body.timestamp).to.be.a('string');
    expect(Number.isNaN(new Date(res.body.timestamp).getTime())).to.be.false;
  });

  it('body has a non-negative integer uptimeSeconds', async () => {
    const res = await request(app).get('/health');
    expect(res.body.uptimeSeconds).to.be.a('number');
    expect(Number.isInteger(res.body.uptimeSeconds)).to.be.true;
    expect(res.body.uptimeSeconds).to.be.at.least(0);
  });

  it('body has a non-empty version string', async () => {
    const res = await request(app).get('/health');
    expect(res.body.version).to.be.a('string').and.not.equal('');
  });

  it('responds without requiring an Authorization header', async () => {
    const res = await request(app).get('/health');  // no auth header
    expect(res.status).to.equal(200);
  });
});
```

### `requests.http`

```http
### Health Check — confirm the backend process is alive

@baseUrl = http://localhost:3010

GET {{baseUrl}}/health
Accept: application/json

### Expected 200 response:
# {
#   "status": "ok",
#   "timestamp": "2026-02-23T10:00:00.000Z",
#   "uptimeSeconds": 42,
#   "version": "1.0.0"
# }
```

---

## Complexity Tracking

> No constitution violations — this section is intentionally empty.

All gates pass without deviation. No additional justification required.

---

## Post-Design Constitution Re-Check

After Phase 1 design, re-verifying all principles against the concrete design decisions:

| Principle | Status | Evidence |
|-----------|--------|---------|
| I. Layered Architecture | ✅ PASS | Route → Controller; no DB; no logic in route file |
| II. Test-First | ✅ PASS | `test/health.test.js` skeleton written; imports `app.js`; 7 Red tests before any production code |
| III. Configuration via Environment | ✅ PASS | No new env vars; no hard-coded values; `.env.example` unchanged |
| IV. Observability | ✅ PASS | Morgan first; 4-arg error handler last; `/health` returns `{status, timestamp, ...}` |
| V. Simplicity & YAGNI | ✅ PASS | No service layer; one new devDep (`supertest`) documented; CommonJS throughout; no ESM |

**Final verdict**: Implementation may proceed. No blockers.
