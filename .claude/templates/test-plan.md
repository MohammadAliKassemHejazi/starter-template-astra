# Test Plan — <feature / story>

**Author:** qa-devops (with the owning specialist) | **Story:** US-NN | **Tier:**

> Written BEFORE implementation for MEDIUM/HIGH work (test-first framing,
> `test-driven-development.md`). Proportional pyramid: many unit, fewer
> integration, few E2E (`playwright-testing.md`) — don't E2E what a unit test
> already covers.

## Scope
**In scope:**
**Out of scope (explicitly):**

## Unit tests (services / pure logic)
| # | Behavior under test | Given | When | Then |
|---|---|---|---|---|

## Integration tests (API routes — against a real test DB, not mocks)
| # | Endpoint / handler | Case | Expected status + shape |
|---|---|---|---|
| 1 | | happy path | |
| 2 | | validation failure | |
| 3 | | auth/permission failure | |
| 4 | | not found / conflict | |

## E2E matrix (critical path only — Playwright, pixel evidence for UI)
| # | Flow | Steps | Pass criteria | Screenshot evidence required? |
|---|---|---|---|---|

## Edge cases & negative paths
- Empty / null / boundary inputs:
- Concurrent/duplicate requests (idempotency):
- Failure of a dependency (DB down, third-party API timeout):

## Accessibility (if UI) — hand off to a11y-auditor
- Keyboard-only path verified:
- Screen-reader semantics verified:

## Non-functional (if applicable)
- Performance budget (`performance-benchmarking.md`):
- Load/concurrency behavior (`k6`, if a hot path):

## Test data & fixtures
- Fixtures needed:
- Any data that must be disposable/seeded, never the shared dev DB (`verification-discipline.md`):

## Verification stamp (fill in at completion, re-run — never quoted)
`unit ✓ (N, re-run) / integration ✓ (N, re-run) / E2E ✓ (N, re-run) / a11y ✓ / coverage of changed logic: ✓`
