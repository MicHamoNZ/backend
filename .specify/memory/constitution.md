<!--
  SYNC IMPACT REPORT
  ==================
  Version change: [unversioned template] → 1.0.0
  Bump rationale: MAJOR — initial constitution establishment; all placeholders replaced
    with project-specific values derived from repo analysis.

  Modified principles:
    [PRINCIPLE_1_NAME] → I. Layered Architecture
    [PRINCIPLE_2_NAME] → II. Test-First (NON-NEGOTIABLE)
    [PRINCIPLE_3_NAME] → III. Configuration via Environment
    [PRINCIPLE_4_NAME] → IV. Observability
    [PRINCIPLE_5_NAME] → V. Simplicity & YAGNI

  Added sections:
    - Tech Stack & Conventions (formerly [SECTION_2_NAME])
    - Development Workflow (formerly [SECTION_3_NAME])
    - Governance (populated with project-specific rules)

  Removed sections: none

  Templates requiring updates:
    ✅ .specify/templates/plan-template.md
       — Constitution Check gates updated to reflect the 5 principles above.
    ✅ .specify/templates/spec-template.md
       — No structural changes needed; existing format aligned with principles.
    ✅ .specify/templates/tasks-template.md
       — Path conventions confirmed; test phase guidance aligns with Principle II.

  Follow-up TODOs: none — all placeholders resolved.
-->

# Backend API Constitution

## Core Principles

### I. Layered Architecture

All application code MUST follow a strict three-layer separation:
**Routes → Controllers → Services/Config**.

- Route files (under `src/routes/`) MUST only mount paths and delegate to controllers.
- Controller files (under `src/controllers/`) MUST contain request-parsing, response
  formatting, and error handling. Business logic MUST NOT live here.
- Shared configuration and infrastructure (DB pool, env vars) MUST live under
  `src/config/`.
- Direct database queries from routes or controllers are PROHIBITED; all DB interaction
  MUST be encapsulated in a service or repository layer.

**Rationale**: Enforces separation of concerns, enables independent unit-testing of each
layer, and makes the codebase navigable as the feature set grows.

### II. Test-First (NON-NEGOTIABLE)

Tests MUST be written and confirmed to fail before production code is implemented
(Red → Green → Refactor).

- The test framework is **Mocha** with **Chai** assertions (`npm test`).
- All tests MUST live under `test/` and mirror the `src/` module structure
  (e.g., `test/health.test.js` ↔ `src/routes/health.routes.js`).
- A feature is not considered "done" until all tests pass and `npm test` exits 0.
- Test files MUST NOT import or start `src/server.js`; they MUST import `src/app.js`
  (the Express app without `app.listen`).

**Rationale**: TDD prevents regression, clarifies acceptance criteria before
implementation, and keeps the server/app split clean for testing.

### III. Configuration via Environment

All runtime configuration MUST be supplied through environment variables loaded by
**dotenv** at process start.

- `.env` MUST NOT be committed to version control (already in `.gitignore`).
- `.env.example` MUST be kept up-to-date with every new variable added.
- Required variables: `PORT`, `NODE_ENV`, `DB_HOST`, `DB_PORT`, `DB_NAME`,
  `DB_USER`, `DB_PASSWORD`.
- Hard-coded credentials, ports, or hostnames anywhere in `src/` are PROHIBITED.
- `src/config/db.js` is the single authorised location for constructing the PostgreSQL
  connection pool from environment variables.

**Rationale**: 12-Factor App principle; enables safe multi-environment deployments and
keeps secrets out of the repository.

### IV. Observability

Every HTTP request MUST be logged. Unhandled errors MUST be surfaced and logged before
responding to the client.

- **morgan** MUST be registered as the first middleware in the Express app for HTTP
  request logging.
- All unhandled promise rejections and uncaught exceptions MUST be caught at the
  process level in `src/server.js` and logged to `stderr`.
- An Express error-handling middleware (4-arg `(err, req, res, next)`) MUST be the
  last middleware registered in `src/app.js`.
- The `/health` route MUST always return `{ status: "ok", timestamp: <ISO-string> }`
  with HTTP 200 when the server is running normally; it MUST return HTTP 503 when the
  DB connection is unavailable.

**Rationale**: Operational visibility is mandatory from day one; silent failures in a
Node.js server are unacceptable in any environment.

### V. Simplicity & YAGNI

Complexity MUST be justified by a current, concrete requirement.

- Introduce abstractions, additional middleware, or architectural layers only when an
  existing requirement demands them. Speculative generality is PROHIBITED.
- Dependency additions MUST be discussed and recorded in the relevant spec before
  being merged.
- The CommonJS module system (`require`/`module.exports`) MUST be used consistently;
  mixing ESM `import`/`export` in the same package is PROHIBITED unless a migration
  plan is approved.
- `nodemon` is a dev-only tool; it MUST NOT appear in `dependencies`.

**Rationale**: A small, focused backend is easier to reason about, test, and hand off.
Every line of unnecessary code is future maintenance burden.

## Tech Stack & Conventions

**Runtime**: Node.js (LTS) — CommonJS modules (`"type": "commonjs"`)
**Web Framework**: Express 5.x
**Database**: PostgreSQL via `pg` (node-postgres) connection pool
**Config**: dotenv
**HTTP Logging**: morgan
**CORS**: cors middleware (configured in `src/app.js`)
**Testing**: Mocha 11.x + Chai 6.x
**Dev Server**: nodemon (devDependency only)

### File & Naming Conventions

- Source files: `camelCase.js` (e.g., `health.controller.js`, `health.routes.js`)
- Feature grouping: `<domain>.routes.js`, `<domain>.controller.js`
- Config files: `<resource>.js` under `src/config/`
- Test files: `<domain>.test.js` under `test/` — no subdirectories unless volume demands
- Branch names: `features/<issue-number-or-slug>` (e.g., `features/express-health-route`)

### Directory Layout

```
src/
  app.js              # Express app factory (no listen call)
  server.js           # Process entry-point (calls app.listen)
  config/
    db.js             # PostgreSQL pool singleton
  controllers/
    <domain>.controller.js
  routes/
    <domain>.routes.js
test/
  <domain>.test.js
```

## Development Workflow

1. **Branch**: create a feature branch from `main` using the convention
   `features/<slug>`.
2. **Spec**: write or update the feature spec in `.specify/memory/` before coding.
3. **Tests first**: write failing Mocha/Chai tests (`npm test` MUST show failures).
4. **Implement**: write the minimum code to make tests pass.
5. **Refactor**: clean up without breaking tests.
6. **PR**: open a pull request to `main`; CI MUST pass `npm test` before merge.
7. **Review**: all PRs MUST be reviewed against the Constitution Check in the plan
   template before approval.

### Quality Gates (MUST pass before merge)

- `npm test` exits 0 (all tests pass).
- No hard-coded credentials or config values in `src/`.
- `.env.example` is updated if new environment variables were added.
- Morgan request logging is still the first middleware in `src/app.js`.
- Error-handling middleware remains the last middleware in `src/app.js`.

## Governance

This constitution supersedes all other conventions documented elsewhere in this
repository. Any practice that conflicts with a principle stated here MUST be updated
to comply or MUST trigger an amendment.

**Amendment procedure**:
1. Propose the change in a PR that edits `.specify/memory/constitution.md`.
2. State the version bump type (MAJOR / MINOR / PATCH) and rationale.
3. Update `LAST_AMENDED_DATE` to the date of the PR merge.
4. Run the consistency propagation checklist (step 4 of the speckit.constitution
   workflow) and update all affected templates.
5. Merge only after at least one peer review.

**Versioning policy** (semantic):
- **MAJOR**: Principle removed, redefined, or a governance rule fundamentally changed.
- **MINOR**: New principle or section added; material expansion of guidance.
- **PATCH**: Wording clarification, typo fix, non-semantic refinement.

**Compliance review**: Every PR description MUST include a "Constitution Check" section
confirming the change does not violate any principle, or documenting an approved
deviation with justification.

**Version**: 1.0.0 | **Ratified**: 2026-02-23 | **Last Amended**: 2026-02-23
