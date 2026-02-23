# Data Model: Health Check Endpoint

**Feature**: `001-health-check-endpoint`  
**Date**: 2026-02-23

---

## Overview

This feature has **no database entities** and **no persistent state**. All response
data is derived entirely from Node.js built-ins and the application's own module system
at request time.

The "data model" for this feature is the **response payload shape** — a pure value
object assembled on every request from in-process sources.

---

## Response Value Object: `HealthPayload`

> This is not a database model. It is the canonical shape of the JSON body returned
> by `GET /health`.

| Field | Type | Source | Example | Validation |
|-------|------|--------|---------|------------|
| `status` | `string` | Hardcoded literal | `"ok"` | Always `"ok"` |
| `timestamp` | `string` (ISO-8601) | `new Date().toISOString()` | `"2026-02-23T10:00:00.000Z"` | Valid ISO-8601 UTC string |
| `uptimeSeconds` | `number` (integer ≥ 0) | `Math.floor(process.uptime())` | `42` | Non-negative integer |
| `version` | `string` | `require('../../package.json').version` | `"1.0.0"` | Non-empty string; `"unknown"` on error |

### Construction (pseudo-code)

```js
// Loaded once at module initialisation — NOT per request
let APP_VERSION;
try {
  APP_VERSION = require('../../package.json').version || 'unknown';
} catch (_) {
  APP_VERSION = 'unknown';
}

// Called on every GET /health request
function buildHealthPayload() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    version: APP_VERSION,
  };
}
```

---

## State Transitions

N/A — The health endpoint is stateless. There are no entities, no transitions, and
no mutations. Each call is fully idempotent.

---

## Validation Rules

| Rule | Condition | Behaviour on Violation |
|------|-----------|----------------------|
| `version` read fails | `package.json` absent or `version` field missing | Return `"unknown"` — never throw |
| `uptimeSeconds` type | `Math.floor` always returns an integer | No validation needed; guaranteed by built-in |
| `timestamp` format | `Date.toISOString()` always produces ISO-8601 | No validation needed; guaranteed by built-in |

---

## Edge Cases

| Scenario | Expected `HealthPayload` behaviour |
|----------|------------------------------------|
| Server started < 1 second ago | `uptimeSeconds` is `0` — valid integer |
| `package.json` missing or unreadable | `version` is `"unknown"` — endpoint still returns 200 |
| Multiple concurrent requests | Each request gets an independent `new Date()` call — no shared mutable state |
| Process uptime overflows JS safe integer | Not a realistic concern (`Number.MAX_SAFE_INTEGER` seconds ≈ 285 million years) |

---

## No Database Interaction

Per FR-004 and the project constitution (Principle I), the health check path MUST NOT
touch the database. The `src/config/db.js` module MUST NOT be imported anywhere in
`src/routes/health.routes.js` or `src/controllers/health.controller.js`.

