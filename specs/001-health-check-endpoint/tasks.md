---
description: "Task list for the Health Check Endpoint feature"
spec: "specs/001-health-check-endpoint/spec.md"
plan: "specs/001-health-check-endpoint/plan.md"
---

# Tasks: Health Check Endpoint

**Feature branch**: `001-health-check-endpoint`  
**Generated**: 2026-02-23  
**Tech stack**: Node.js LTS · CommonJS · Express 5 · Mocha + Chai + supertest  
**Architecture**: Routes → Controllers (`src/routes/` → `src/controllers/`)  
**Constitution mandate**: Test-First is NON-NEGOTIABLE — failing tests MUST precede every implementation task.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies on in-progress tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure the devDependency and all skeleton files are in place before any story work begins.

- [x] T001 Verify `supertest` is present in `devDependencies` in `package.json` (already listed — confirm with `npm ls supertest`; run `npm install` if lock-file is stale)

**Checkpoint ✅**: `node_modules/supertest` exists and `npm test` can be invoked without a missing-module error (failures expected — tests not yet written).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wire the Express application shell in `src/app.js` and `src/server.js` so that the test harness can import `app` and the dev server can start. No feature routes are added here — only the middleware skeleton mandated by the constitution.

**⚠️ CRITICAL**: No user-story work can begin until this phase is complete. US1 tests import `src/app.js`; it must export a valid Express app.

- [x] T002 Implement `src/app.js`: create Express app, register `morgan('dev')` first, `cors()`, `express.json()`, and the 4-arg error handler last; export `app` (no `app.listen`) — per constitution Principles I & IV
- [x] T003 Implement `src/server.js`: call `require('dotenv').config()`, `require('./app')`, `app.listen(process.env.PORT || 3010)`, and register `process.on('unhandledRejection')` / `process.on('uncaughtException')` handlers — per constitution Principle III

**Checkpoint ✅**: `node src/server.js` starts without error; `require('./src/app')` in a REPL returns an Express app; `npm test` exits with failures (no test file yet) rather than a module-not-found crash.

---

## Phase 3: User Story 1 — Developer Confirms Service Is Running (Priority: P1) 🎯 MVP

**Goal**: `GET /health` returns `200 OK` with `{ status, timestamp, uptimeSeconds, version }` — no auth, no DB, < 50 ms.

**Independent Test**: Start the server and issue `GET /health`. A `200 OK` JSON response containing all four required fields proves the story complete.

### Tests for User Story 1 ⚠️ WRITE FIRST — MUST BE RED BEFORE T006

> **Constitution Principle II (NON-NEGOTIABLE)**: Write and run these tests, confirm they FAIL, then proceed to T006.

- [x] T004 [US1] Write all 7 Mocha/Chai/supertest test cases in `test/health.test.js` (import `../src/app` — never `src/server.js`):
  1. `GET /health` responds with HTTP 200
  2. `Content-Type` header contains `application/json`
  3. `res.body.status` strictly equals `'ok'`
  4. `res.body.timestamp` is a string parseable as a valid `Date`
  5. `res.body.uptimeSeconds` is a non-negative integer (`Number.isInteger` + `>= 0`)
  6. `res.body.version` is a non-empty string
  7. Request without `Authorization` header still returns 200
- [x] T005 [US1] Run `npm test` and **confirm RED** — all 7 tests must fail (controller and route do not exist yet); do not proceed to T006 until failures are confirmed

### Implementation for User Story 1

- [x] T006 [P] [US1] Create `src/controllers/health.controller.js`: load `APP_VERSION` via `try { require('../../package.json').version || 'unknown' } catch` at module load time; implement `getHealth(req, res)` that calls `res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), uptimeSeconds: Math.floor(process.uptime()), version: APP_VERSION })`; export `{ getHealth }`
- [x] T007 [P] [US1] Create `src/routes/health.routes.js`: instantiate `express.Router()`; register `router.get('/', getHealth)` (delegating to `healthController.getHealth`); export `router`
- [x] T008 [US1] Wire the health router into `src/app.js`: add `const healthRouter = require('./routes/health.routes')` and `app.use('/health', healthRouter)` **after** `express.json()` and **before** the 4-arg error handler — per constitution Principle IV middleware order (depends on T006, T007)
- [x] T009 [US1] Run `npm test` and **confirm GREEN** — all 7 tests in `test/health.test.js` must pass; `npm test` must exit 0 (depends on T008)

**Checkpoint ✅**: `npm test` exits 0 with 7 passing. `curl http://localhost:3010/health` (after `npm run dev`) returns a correct JSON body. User Story 1 is fully functional and independently verified.

---

## Phase 4: User Story 2 — Deployment Pipeline Validates a Successful Deploy (Priority: P2)

**Goal**: The `version` field in the response reliably reflects the deployed `package.json` version; rapid successive requests each return a fresh `timestamp`.

**Independent Test**: Script a `GET /health` call; assert HTTP 200 and that all four fields are present with correct types. Both acceptance scenarios are already covered by the 7 tests written for US1 — no additional test file is required.

> **Note**: US2 adds no new source files. Its acceptance criteria (stable `version` field, fresh `timestamp` per request) are fully satisfied by the implementation delivered in Phase 3. This phase is a **validation gate**, not a coding task.

- [x] T010 [US2] Verify `version` in the response matches `package.json .version` by inspecting `res.body.version` in `test/health.test.js` — add an assertion `expect(res.body.version).to.equal(require('../package.json').version)` to the existing version test case (or as a standalone `it` block) in `test/health.test.js`
- [x] T011 [US2] Run `npm test` and confirm all tests still pass (`npm test` exits 0) after the T010 assertion is added

**Checkpoint ✅**: `npm test` exits 0. The `version` assertion confirms pipeline-readiness. User Story 2 acceptance criteria are met.

---

## Phase 5: User Story 3 — Developer Uses the `.http` Request File for Manual Testing (Priority: P3)

**Goal**: `requests.http` exists at the project root with a `GET {{baseUrl}}/health` entry and a commented example of the expected `200` response shape.

**Independent Test**: Confirm `requests.http` exists and contains the `GET {{baseUrl}}/health` entry. Open it in WebStorm and click ▶ against a running local server; the response matches the documented shape.

- [x] T012 [US3] Create `requests.http` at the project root with JetBrains HTTP Client syntax: define `@baseUrl = http://localhost:3010`; add a `GET {{baseUrl}}/health` request with `Accept: application/json` header; include a block comment documenting the expected `200` response body with all four fields (`status`, `timestamp`, `uptimeSeconds`, `version`) and their example values

**Checkpoint ✅**: `requests.http` exists at the project root. Opening it in WebStorm shows the health check entry. Executing it against a running `npm run dev` server returns the documented response shape. User Story 3 is complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation pass and documentation hygiene to confirm the full feature is shippable.

- [x] T013 [P] Run the full quickstart scenario from `specs/001-health-check-endpoint/quickstart.md` end-to-end: `npm install` → `npm run dev` → `curl http://localhost:3010/health` → verify JSON body → `npm test` → confirm 7 passing → open `requests.http` and execute in IDE
- [x] T014 [P] Confirm no new runtime dependencies were added: `npm ls --prod --depth=0` must list only `cors`, `dotenv`, `express`, `morgan`, `pg` — no additions
- [x] T015 Confirm `src/config/db.js` is untouched (zero DB interaction in the health-check path) and `test/health.test.js` does not import `src/server.js`

**Checkpoint ✅**: All quickstart steps succeed. `npm test` exits 0 with 7 (or 8 after T010) passing tests. Zero runtime-dependency additions. Feature is shippable.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
  └── Phase 2 (Foundational)  ← BLOCKS all user stories
        └── Phase 3 (US1 — MVP)
              └── Phase 4 (US2 — validation gate, no new code)
                    └── Phase 5 (US3 — requests.http)
                          └── Phase 6 (Polish)
```

### Within User Story 1 (the critical path)

```
T004 Write tests (health.test.js)
  └── T005 Confirm RED (npm test fails)
        ├── T006 [P] Create health.controller.js
        ├── T007 [P] Create health.routes.js
        └── T008 Wire router into app.js  ← depends on T006 + T007
              └── T009 Confirm GREEN (npm test passes)
```

### Parallel Opportunities

- **T006 and T007** can be written simultaneously (different files, no shared dependency).
- **T002 and T003** can be written simultaneously (different files).
- **T013, T014** (polish) can run in parallel.
- US3 (**T012**) is entirely independent of US2 (**T010–T011**) and can be done in either order after Phase 3.

---

## Parallel Example: User Story 1 Implementation Sprint

```
After T005 (RED confirmed):

  Thread A                          Thread B
  ─────────────────────────         ─────────────────────────
  T006  health.controller.js        T007  health.routes.js
        ↓                                 ↓
        └──────── both done ────────────┘
                       ↓
                  T008  Wire app.js
                       ↓
                  T009  Confirm GREEN
```

---

## Implementation Strategy

### MVP First (User Story 1 Only — Phases 1–3)

1. **Phase 1**: Verify `supertest` is installed.
2. **Phase 2**: Implement `src/app.js` and `src/server.js` shells.
3. **Phase 3**: Write tests (RED) → implement controller + route → wire app → GREEN.
4. **STOP AND VALIDATE**: `npm test` exits 0; `curl /health` returns correct JSON.
5. **Deploy / demo if ready** — US1 alone is the entire MVP.

### Incremental Delivery

1. Phases 1–3 → **MVP shipped** (US1 complete, `npm test` green)
2. Phase 4 → US2 validation (strengthen `version` assertion, no new code)
3. Phase 5 → US3 (`requests.http` created, developer ergonomics done)
4. Phase 6 → Polish pass, quickstart validation, dependency audit

---

## Task Summary

| Phase | Tasks | User Story | Parallelisable |
|-------|-------|-----------|----------------|
| Phase 1 — Setup | T001 | — | No |
| Phase 2 — Foundational | T002–T003 | — | T002 ∥ T003 |
| Phase 3 — US1 (MVP) | T004–T009 | US1 (P1) | T006 ∥ T007 |
| Phase 4 — US2 | T010–T011 | US2 (P2) | No |
| Phase 5 — US3 | T012 | US3 (P3) | No |
| Phase 6 — Polish | T013–T015 | — | T013 ∥ T014 |
| **Total** | **15 tasks** | **3 stories** | **3 parallel pairs** |

### Independent Test Criteria (per story)

| Story | Done When |
|-------|-----------|
| **US1 (P1)** | `npm test` exits 0 · 7 tests passing · `GET /health` returns `200` + correct JSON |
| **US2 (P2)** | `version` assertion passes · `npm test` exits 0 · pipeline can assert build identity |
| **US3 (P3)** | `requests.http` exists · contains `GET {{baseUrl}}/health` · IDE executes it successfully |

---

## Notes

- `[P]` tasks operate on different files and have no dependency on other in-progress tasks.
- `[Story]` labels map directly to user stories in `specs/001-health-check-endpoint/spec.md`.
- **Constitution Principle II is NON-NEGOTIABLE**: T005 (RED confirmation) must happen before T006/T007. Do not skip it.
- `test/health.test.js` MUST import `../src/app` — never `../src/server` (constitution Principle II).
- `src/config/db.js` is untouched throughout; health check has zero DB coupling.
- Commit after each checkpoint to keep a clean, bisectable history.
- The suggested MVP scope is **Phases 1–3** (User Story 1 only).

