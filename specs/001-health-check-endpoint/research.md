# Research: Health Check Endpoint

**Feature**: `001-health-check-endpoint`  
**Date**: 2026-02-23  
**Status**: Complete — all unknowns resolved

---

## Summary

All technical decisions for this feature were fully deterministic from the project's
existing constitution, stack, and spec. No external unknowns required investigation;
this document records the rationale for each design decision so that the implementation
phase can proceed without ambiguity.

---

## Decision Log

### D-001 — Response payload shape

**Decision**: `{ status: "ok", timestamp: string (ISO-8601), uptimeSeconds: number (integer), version: string }`

**Rationale**:
- `status` — a machine-readable liveness sentinel; the literal `"ok"` matches the
  constitution's required `/health` shape (`{ status: "ok", timestamp: <ISO-string> }`).
- `timestamp` — `new Date().toISOString()` is a zero-cost, built-in call; ISO-8601 UTC
  format is the industry standard for interoperability with log aggregators, APM tools,
  and deployment pipelines.
- `uptimeSeconds` — `Math.floor(process.uptime())` is a built-in, no-I/O metric that
  lets a deployment pipeline compute how long the current process has been alive. Flooring
  yields a stable integer type (no floating-point noise in assertions).
- `version` — read once from `package.json` at module load time via `require('../../package.json').version`
  (CommonJS JSON require is synchronous and cached by Node's module system, so there is
  zero per-request cost). Falls back to `"unknown"` if the field is absent or `require`
  throws.

**Alternatives considered**:
- Including DB status in `/health`: rejected — the spec and constitution treat DB liveness
  as a separate concern; this endpoint MUST remain available even when the DB is down.
- Returning `uptimeSeconds` as a float: rejected — the spec mandates `Math.floor()`;
  floats complicate test assertions and pipeline comparisons.
- Reading `package.json` on every request: rejected — YAGNI; file I/O on every request
  violates FR-004 and the `<50 ms` target.

---

### D-002 — Module loading strategy for `package.json`

**Decision**: `const { version: APP_VERSION } = require('../../package.json');` at the
top of `health.controller.js`, with a `try/catch` that falls back to `"unknown"`.

**Rationale**:
- CommonJS `require()` of a JSON file is synchronous and cached by Node.js's module
  registry after the first call. No per-request overhead.
- Placing the `require` at module load time satisfies the assumption in the spec and
  keeps the controller function pure (no I/O).
- A `try/catch` at load time handles the edge case where `package.json` is missing or
  the `version` field is absent, returning `"unknown"` gracefully.

**Alternatives considered**:
- `fs.readFileSync` at module load: functionally equivalent but more verbose than
  `require()` for JSON; rejected in favour of the idiomatic CommonJS approach.
- Dynamic `import()` (ESM): rejected — the project constitution prohibits ESM.
- Environment variable `PACKAGE_VERSION`: rejected — would require build tooling to
  inject it, adding unnecessary complexity (YAGNI).

---

### D-003 — Routing & controller split

**Decision**:
- `src/routes/health.routes.js` — creates an `express.Router()`, mounts `GET /` on it,
  delegates to `healthController.getHealth`.
- `src/controllers/health.controller.js` — exports `getHealth(req, res)`, builds and
  sends the JSON response.
- `src/app.js` — mounts the router at `/health` via `app.use('/health', healthRouter)`,
  after `morgan` and before the 4-arg error handler.

**Rationale**:
- Directly specified by FR-007 and the constitution's layered architecture principle.
- Router-at-path-prefix pattern (`app.use('/health', router)`) is the idiomatic
  Express v5 pattern; the route file registers `GET /` (root of the sub-router), giving
  a clean separation between path prefix and route definition.
- No service layer is needed: the health check has no business logic and no DB access,
  so introducing a service would violate the YAGNI principle.

**Alternatives considered**:
- Inline route handler in `app.js`: rejected — violates layered architecture and FR-007.
- Service layer for `getHealth`: rejected — no business logic to encapsulate; YAGNI.

---

### D-004 — Middleware registration order in `app.js`

**Decision** (order, top to bottom):
1. `require('dotenv').config()` (or at process entry in `server.js`)
2. `app.use(morgan('dev'))` — first middleware (constitution IV)
3. `app.use(cors())` — already in use per stack description
4. `app.use(express.json())` — standard JSON body parsing
5. `app.use('/health', healthRouter)` — feature route
6. `app.use((err, req, res, next) => { … })` — 4-arg error handler, last (constitution IV)

**Rationale**:
- Morgan first ensures every request — including `/health` — is logged.
- Error handler last ensures it catches errors from all routes.
- This order is mandated by both the constitution and the Express documentation.

**Alternatives considered**:
- Registering `/health` before morgan: rejected — would make health check requests
  invisible in logs, violating Principle IV.

---

### D-005 — Test approach (Mocha/Chai)

**Decision**: Use `chai-http` (or `supertest` equivalent) HTTP assertions against the
Express `app` exported from `src/app.js`, without calling `app.listen()`.

**Rationale**:
- The constitution mandates importing `src/app.js` (not `src/server.js`) in tests.
- Supertest is the de-facto standard for in-process HTTP testing in Node.js; it starts
  an ephemeral server on a random port, eliminating port conflicts in CI.
- Test file: `test/health.test.js` (mirrors `src/routes/health.routes.js`).
- Tests MUST be written and confirmed FAILING before production code is committed (TDD
  Red phase), per Principle II.

**Test cases to cover (FR-008)**:
1. `GET /health` → HTTP 200
2. Response has `Content-Type: application/json`
3. Body has `status === "ok"` (string)
4. Body has `timestamp` that is a valid ISO-8601 string
5. Body has `uptimeSeconds` that is a non-negative integer
6. Body has `version` that is a non-empty string
7. Request without `Authorization` header still returns 200

**Alternatives considered**:
- Node's built-in `http.request` in tests: too verbose; no benefit over supertest.
- `chai-http` plugin: functionally equivalent to supertest but requires an additional
  devDependency (`chai-http`). Since `supertest` is already the expressly recommended
  tool for Express v5, it is preferred — **however**, checking existing devDependencies
  shows neither is installed yet. Resolution: use `supertest` (lightweight, no extra
  assertion library needed, widely supported with Mocha). Add as devDependency.

> **NOTE**: `supertest` is not yet in `package.json`. It MUST be added as a
> `devDependency` (`npm install --save-dev supertest`). This is the only new dependency
> introduced by this feature and is test-infrastructure only (not a runtime dependency),
> consistent with Principle V.

---

### D-006 — `requests.http` file

**Decision**: Create `requests.http` at the repository root using JetBrains HTTP Client
syntax with a `{{baseUrl}}` variable and an annotated expected response.

**Rationale**:
- FR-006 and User Story 3 both mandate this file.
- JetBrains HTTP Client uses `### ` section separators, `@variable = value` for
  variables, and `< {% ... %}` for response assertions (optional). The `{{baseUrl}}`
  variable is substituted from an `http-client.env.json` file or the IDE's environment
  configuration.
- No additional tooling is required; the file is plain text.

**Alternatives considered**:
- Postman collection: rejected — the spec explicitly calls for JetBrains HTTP Client syntax.
- `curl` examples in README: rejected — not executable in-IDE without a plugin.

---

### D-007 — No new environment variables

**Decision**: This feature introduces zero new environment variables. `.env.example`
does not need updating.

**Rationale**:
- All data sources (`process.uptime()`, `new Date()`, `require('../../package.json')`)
  are Node.js built-ins or the module system — no configuration required.
- `PORT` and `NODE_ENV` already exist in `.env.example`.

---

### D-008 — Express v5 compatibility

**Decision**: No special handling required for Express v5 in the route or controller.

**Rationale**:
- Express v5 removed the need for `try/catch` wrappers around async route handlers
  (async errors are forwarded to the error handler automatically). However, `getHealth`
  is synchronous, so this is moot.
- Express v5 `Router()` API is unchanged from v4 for the patterns used here.
- `app.use('/health', router)` is identical in v4 and v5.

---

## Dependency Impact

| Package | Type | Purpose | Already Present? |
|---------|------|---------|-----------------|
| `supertest` | devDependency | HTTP assertions in Mocha tests | ❌ Must be added |
| `express` | dependency | Web framework | ✅ v5.2.1 |
| `morgan` | dependency | HTTP request logging | ✅ v1.10.1 |
| `cors` | dependency | CORS middleware | ✅ v2.8.6 |
| `dotenv` | dependency | Environment config | ✅ v17.3.1 |

**Action required**: `npm install --save-dev supertest` before writing tests.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| `package.json` missing at runtime (Docker, etc.) | Low | Low | `try/catch` fallback to `"unknown"` |
| Port conflict in tests | Low | Medium | `supertest` uses ephemeral ports |
| Response time >50ms | Very Low | Medium | No I/O in handler; all data from built-ins |
| Express v5 breaking change in Router API | Very Low | Low | Verified: Router API unchanged for this pattern |

