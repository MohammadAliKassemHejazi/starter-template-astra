# Reference: playwright-testing

Deep detail for `playwright-testing.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Doctrine
- **Accessibility-tree-first**: locate by role/name (`getByRole`, `getByLabel`), never brittle CSS/XPath. If an element can't be found by role, that's an accessibility bug — file it.
- **Verify your own work**: frontend-dev runs the flow after building it and BEFORE marking review-ready; qa-devops re-runs independently. "It compiles" is not "it works."
- **Waits**: `waitFor` conditions and web-first assertions (`toBeVisible`), never `sleep`/fixed timeouts — the #1 flake source.
- **Evidence**: screenshot (or trace) of the passing final state attached/referenced in the daily-log entry.

## Critical-path suite (per client project, keep it small)
Auth happy-path · primary conversion flow (checkout, booking, lead form) · one admin CRUD. E2E confirms wiring; unit tests cover logic — don't E2E what a unit test covers.

## Failure protocol
Repro steps + trace to the daily log; regression gets a permanent test so it can't return silently.
