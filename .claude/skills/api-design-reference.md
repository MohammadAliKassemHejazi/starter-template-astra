# Reference: api-design

Deep detail for `api-design.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Resource doctrine
- Nouns, plural, hierarchical: `/clients/{id}/invoices` · verbs only for true actions (`/invoices/{id}/send`).
- **Versioning**: `/v1` path prefix; within a version, changes are ADDITIVE ONLY (new optional fields yes, renamed/removed/retyped fields no). Breaking = new version + deprecation window.
- **Pagination**: cursor-based (`?cursor=...&limit=`) over offset (offset breaks under concurrent writes); response envelope carries `nextCursor`.
- Filtering/sorting conventions fixed once: `?status=paid&sort=-createdAt` — documented, consistent, validated.

## Reliability contracts
- **Idempotency keys** on every non-idempotent POST (client sends `Idempotency-Key` header; server dedupes) — mandatory on anything money-adjacent.
- Error envelope everywhere: `ApiResponse<T>`'s error variant — `{ success: false, message, errors?: [{ field, issue }] }`, a real exported type from `@project/shared` (this template's canonical envelope — `AGENTS.md`, `shared-contracts-reference.md`), not just a documented convention — clients branch on `success`, not on parsing message text; `errors` gives per-field detail when relevant.
- Rate limiting visible: `429` + `Retry-After` + `X-RateLimit-*` headers.
- Timestamps ISO 8601 UTC; money in integer minor units + currency code; IDs opaque strings.

## Webhooks you emit (when the client's systems subscribe to yours)
Signed (HMAC on raw body, secret per subscriber) · versioned event types (`invoice.paid.v1`) · retries with backoff + dead-letter visibility · a test-delivery endpoint so integrators can develop.

## The contract artifact
OpenAPI spec generated from zod schemas (or maintained alongside) lives in the repo — it IS the contract frontend/mobile/integrators build against; drift between spec and behavior is a defect like any other.
