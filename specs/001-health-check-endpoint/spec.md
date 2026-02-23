# Feature Specification: Health Check Endpoint

**Feature Branch**: `001-health-check-endpoint`  
**Created**: 2026-02-23  
**Status**: Draft  
**Input**: User description: "Feature: Health check endpoint — Add a simple endpoint to confirm the backend is running for local dev and deployment monitoring."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Developer Confirms Service Is Running (Priority: P1)

A developer (or automated deployment tool) sends a single HTTP request to the health
endpoint and immediately knows whether the backend process is alive and ready to accept
traffic — without needing access to logs, a database, or any authentication token.

**Why this priority**: This is the entire purpose of the feature. Every other
story is a refinement; this one is the MVP.

**Independent Test**: Can be tested end-to-end by starting the server and issuing
`GET /health`. A `200 OK` JSON response containing `status`, `timestamp`,
`uptimeSeconds`, and `version` proves the story complete.

**Acceptance Scenarios**:

1. **Given** the backend server is running, **When** a client sends `GET /health`,
   **Then** the server responds with HTTP `200 OK`, `Content-Type: application/json`,
   and a JSON body containing `{ "status": "ok", "timestamp": "<ISO-8601>", "uptimeSeconds": <number>, "version": "<string>" }`.

2. **Given** the backend server is running, **When** a client sends `GET /health`
   without an `Authorization` header, **Then** the server still responds with `200 OK`
   (no authentication is required).

3. **Given** the backend server is running, **When** a client sends `GET /health`,
   **Then** the `timestamp` field is a valid ISO-8601 date-time string representing
   the server's current UTC time at the moment the request was handled.

4. **Given** the backend server is running, **When** a client sends `GET /health`,
   **Then** the `uptimeSeconds` field is a non-negative integer (or floored number)
   reflecting how long the Node.js process has been running.

5. **Given** the backend server is running, **When** a client sends `GET /health`,
   **Then** the `version` field matches the `version` string declared in
   `package.json`.

---

### User Story 2 — Deployment Pipeline Validates a Successful Deploy (Priority: P2)

A CI/CD pipeline polls `GET /health` immediately after deploying a new build. If the
endpoint returns `200 OK` with the expected payload shape, the pipeline marks the
deploy as healthy and routes traffic to the new instance.

**Why this priority**: The endpoint's main value beyond local dev is deployment
automation. A machine-readable, stable response shape (with a version field) enables
pipelines to assert they deployed the correct build.

**Independent Test**: Can be tested by scripting a `GET /health` call and asserting
the HTTP status is `200` and the JSON body contains all four required fields with
correct types.

**Acceptance Scenarios**:

1. **Given** a new version has been deployed, **When** the pipeline calls `GET /health`,
   **Then** the response body contains a `version` value equal to the version in the
   deployed `package.json`, allowing the pipeline to confirm the correct build is
   running.

2. **Given** the pipeline sends rapid successive `GET /health` requests,
   **When** each request arrives, **Then** each responds with `200 OK` and a fresh
   `timestamp` reflecting the time of that specific request.

---

### User Story 3 — Developer Uses the `.http` Request File for Manual Testing (Priority: P3)

A developer opens the project's `requests.http` file in their IDE (e.g., WebStorm or
VS Code with REST Client), clicks "Run" on the health check entry, and immediately
sees a sample response shape — without having to remember the URL or construct the
request manually.

**Why this priority**: A quality-of-life improvement that removes friction for
onboarding and day-to-day development, but does not block the core functionality.

**Independent Test**: Can be verified independently by confirming `requests.http`
exists at the repository root and contains a `GET /health` entry with a commented
example of the expected response.

**Acceptance Scenarios**:

1. **Given** the `requests.http` file exists in the project root, **When** a developer
   opens it, **Then** it contains a `GET {{baseUrl}}/health` (or equivalent) request
   entry with an inline comment or annotation showing the expected `200` response shape.

2. **Given** the `requests.http` entry is executed against a running local server,
   **When** the request completes, **Then** the actual response matches the documented
   shape (all four fields present, correct types).

---

### Edge Cases

- **Server just started**: `uptimeSeconds` should be `0` or a very small number;
  the endpoint must still return `200 OK` without error.
- **`package.json` version field is absent or malformed**: The endpoint must still
  respond; `version` MUST fall back to `"unknown"` rather than throwing an error.
- **Concurrent requests**: Multiple simultaneous `GET /health` calls must all receive
  independent, correct responses — no shared mutable state should be corrupted.
- **Unsupported HTTP method**: `POST /health`, `PUT /health`, etc., are out of scope;
  the router MUST NOT handle them (Express default 404/405 behaviour is acceptable).
- **Response time under load**: The endpoint MUST NOT perform any I/O (database,
  file-system reads at request time, network calls) that could cause it to miss the
  `<50 ms` response-time target.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose an HTTP endpoint at `GET /health` that is
  accessible without any form of authentication or authorisation.

- **FR-002**: The endpoint MUST respond with HTTP status `200 OK` and
  `Content-Type: application/json` whenever the server process is running normally.

- **FR-003**: The response body MUST be a JSON object containing exactly the following
  fields:
  - `status` — string, always the literal value `"ok"`.
  - `timestamp` — string, the server's current date-time in ISO-8601 format
    (e.g., `"2026-02-23T10:00:00.000Z"`).
  - `uptimeSeconds` — number, the process uptime in seconds, floored to a whole number.
  - `version` — string, the value of the `version` field in `package.json`; falls back
    to `"unknown"` if the field cannot be read.

- **FR-004**: The endpoint MUST NOT perform any database access, external HTTP calls,
  or blocking I/O during request handling.

- **FR-005**: The endpoint MUST respond within 50 ms when the server is running locally
  on developer hardware (measured from request receipt to response sent).

- **FR-006**: The feature MUST include a `requests.http` file at the project root (or
  update an existing one) with a working example request for `GET /health` and an
  annotated example of the expected `200` response body.

- **FR-007**: The implementation MUST follow the project's layered architecture:
  route definition in `src/routes/health.routes.js`, request handling in
  `src/controllers/health.controller.js`, with no direct business logic in the route
  file and no database interaction anywhere in the health-check path.

- **FR-008**: A Mocha/Chai test in `test/health.test.js` MUST cover: HTTP status `200`,
  presence and correct type of all four response fields, and absence of a required
  `Authorization` header.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A `GET /health` request to a running local server returns HTTP `200 OK`
  with a valid JSON body containing all four required fields (`status`, `timestamp`,
  `uptimeSeconds`, `version`) — verifiable in under 1 second of manual testing.

- **SC-002**: The endpoint responds in under 50 ms on local developer hardware for
  each request, measured from the moment the server receives the request to the moment
  the response is fully sent.

- **SC-003**: The `version` field in the response matches the `version` declared in
  `package.json` 100% of the time, enabling deployment pipelines to confirm the correct
  build is serving traffic.

- **SC-004**: All Mocha/Chai tests in `test/health.test.js` pass (`npm test` exits 0)
  with no skipped or pending assertions related to this feature.

- **SC-005**: A developer unfamiliar with the project can locate the health check
  example in `requests.http` and execute it against a running local server without
  any additional documentation.

- **SC-006**: The endpoint returns a correct response even when no database connection
  is available, confirming zero coupling between process liveness and data-layer
  availability.

---

## Assumptions

- `package.json` is read once at module load time (not per-request) to derive the
  `version` value — consistent with YAGNI and the `<50 ms` response-time requirement.
- The `requests.http` file uses the JetBrains HTTP Client syntax (variable
  `{{baseUrl}}`); if the file already exists, the health-check entry is appended.
- `uptimeSeconds` is derived from `process.uptime()` and floored via `Math.floor()`.
- `timestamp` is derived from `new Date().toISOString()`.
- The endpoint is registered in the Express app before the error-handling middleware
  and after the morgan logging middleware, in line with the project constitution.
- No additional npm packages are required; all needed APIs (`process`, `Date`) are
  Node.js built-ins.
