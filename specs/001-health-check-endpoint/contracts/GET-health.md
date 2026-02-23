# API Contract: GET /health

**Feature**: `001-health-check-endpoint`  
**Date**: 2026-02-23  
**Version**: 1.0.0  
**Status**: Approved

---

## Endpoint

```
GET /health
```

---

## Authentication

**None required.** This endpoint is intentionally unauthenticated. Any client —
authenticated or not — MUST receive a response.

---

## Request

### Method
`GET`

### Path
`/health`

### Path Parameters
None.

### Query Parameters
None.

### Request Headers
| Header | Required | Notes |
|--------|----------|-------|
| `Accept` | No | Server always returns `application/json` regardless |

### Request Body
None.

---

## Responses

### 200 OK — Server is running

The server process is alive and the endpoint is reachable.

**Content-Type**: `application/json`

**Body Schema**:

```json
{
  "status":        "ok",
  "timestamp":     "2026-02-23T10:00:00.000Z",
  "uptimeSeconds": 42,
  "version":       "1.0.0"
}
```

**Field Definitions**:

| Field | JSON Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `status` | `string` | Always `"ok"` | Liveness sentinel |
| `timestamp` | `string` | ISO-8601 UTC (e.g. `YYYY-MM-DDTHH:mm:ss.sssZ`) | Server clock at request time |
| `uptimeSeconds` | `number` | Non-negative integer (≥ 0) | `Math.floor(process.uptime())` |
| `version` | `string` | Non-empty; `"unknown"` if `package.json` unreadable | Value of `package.json .version` |

**Example response body**:

```json
{
  "status": "ok",
  "timestamp": "2026-02-23T10:00:00.000Z",
  "uptimeSeconds": 42,
  "version": "1.0.0"
}
```

---

### 4xx / 5xx — Not applicable to this endpoint

This endpoint has no error conditions under normal operation. Because it performs no
I/O, no authentication, and no DB access, it cannot produce a 4xx or 5xx response
unless the Node.js process itself is unable to respond (in which case there is no
HTTP response at all).

> **Note**: HTTP 503 for DB unavailability is listed in constitution Principle IV as a
> future concern for a more comprehensive health check. It is **explicitly out of scope**
> for this feature (FR-004: no DB access).

---

## Performance Contract

| Metric | Target | Measurement Point |
|--------|--------|------------------|
| Response time | < 50 ms | From request receipt to response sent (local developer hardware) |
| Throughput | Unbounded (no I/O) | N/A — bounded only by Express event loop |

---

## Stability Contract

This endpoint's response shape is **stable**. Deployment pipelines and monitoring tools
MAY rely on:
- HTTP status always being `200` when the process is running
- All four fields (`status`, `timestamp`, `uptimeSeconds`, `version`) always being present
- `status` always being the string `"ok"`
- `version` always being a non-empty string

Any breaking change to this contract MUST be accompanied by a spec amendment and a
version bump in `package.json`.

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-02-23 | Initial contract — four-field health payload |

