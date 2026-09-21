# Reference: test-driven-development

Deep detail for `test-driven-development.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Red-Green-Refactor
1. **Red** — write a failing test that specifies the next tiny behavior; run it, watch it fail (a test that passes before you write code tests nothing).
2. **Green** — write the minimum code to pass; run it, watch it pass.
3. **Refactor** — clean up code AND test with the safety net green; re-run.
Small cycles. The failing test comes first because it proves the test can fail.

## The test pyramid (proportional, not equal)
- **Unit** — every service function/pure logic branch; mock the repository/IO; fast, many.
- **Integration** — every API route/handler against a REAL test database (Testcontainers/ephemeral PG — not mocks, not H2/SQLite lying about behavior); happy + validation-fail + auth-fail + not-found minimum.
- **E2E** — only critical user paths (auth, primary conversion, one admin flow) via Playwright with pixel evidence for UI. Don't E2E what a unit test covers.

## What makes a test worth keeping
- Tests behavior, not implementation (survives refactors).
- Name states the behavior: `[unit].[method] → [behavior] when [condition]`.
- One reason to fail per test; arrange-act-assert; deterministic (no real clock/network/random — inject them).
- Every bug fix ships with a regression test that fails before the fix and passes after — so it can't silently return.

## Coverage honesty
Coverage is a floor-signal, not a goal — 100% of trivial getters proves nothing; the branching logic and the money path are what must be covered. Don't chase a number; cover what breaks.

## Verification
`npm run check` is green from a fresh run before "done" — re-run, never quote a cached/claimed result. Count tests from the actual run summary, not from memory (`verification-discipline.md`).

## Common failure modes
Test written after code that never actually fails · mocking so much the test asserts the mocks · H2/SQLite integration tests passing where Postgres fails · flaky non-deterministic tests eroding trust · coverage theater · claiming green without a fresh run.
