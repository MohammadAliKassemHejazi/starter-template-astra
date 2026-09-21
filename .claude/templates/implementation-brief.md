# Implementation Brief — <feature / story>

**Story:** US-NN | **Author:** <Claude specialist who owns this> | **Date:** YYYY-MM-DD
**Executor:** DeepSeek | **Reviewer:** <same owning specialist — accountable for the result>

> Written by Claude, executed by DeepSeek (`deepseek-delegation-reference.md`).
> **Completeness test: could a competent engineer execute this without asking a
> single question?** If no, finish the brief or implement it directly — a vague
> brief produces invented architecture that costs more to fix than to have
> written. Never delegate a decision; delegate typing against a decision.

## 1. Scope
**Create:**
- `path/to/file.ts` — one line on its responsibility

**Modify:**
- `path/to/existing.ts` — exactly what changes

**Do NOT touch:**
- <files/areas explicitly out of bounds>

## 2. Pattern to follow (highest-leverage line in this brief)
**Mirror:** `src/features/<existing>/<file>.ts` — it already does the analogous thing.
Match its layering, naming, error handling, and file structure. When in doubt, copy that file's shape rather than inventing.

## 3. Contracts (exact — never paraphrase a type)
- Request/response schemas: `packages/shared/src/schemas/<domain>.ts` (`@project/shared` — `shared-contracts-reference.md`) → `XRequestSchema`, `XResponseSchema`, imported by name, not paraphrased
- **Import these types from `@project/shared`; do NOT redeclare them.** Redeclaring a shape that already exists in the shared package is the #1 delegation defect and an automatic review reject.
- Response envelope: `ApiResponse<T>` from `@project/shared` — every handler returns this shape (`AGENTS.md`).

## 4. Architecture rules that apply
- Layering: routes → controllers → services → repositories. Business logic lives in services only.
- Dependency direction: `app → features → shared` — never sideways between features, never upward.
- **TypeScript only** — no new `.js`/`.jsx` files, `strict` on, no `any`.
- Validation: zod `safeParse` at every external boundary, using the shared schema (`shared-contracts-reference.md`).
- Full rules: `docs/CONVENTIONS.md` §<relevant sections>.

## 5. Acceptance criteria (testable)
1. **Given** …, **When** …, **Then** …
2. …

## 6. Edge cases and error states to handle explicitly
- Empty / null / boundary input:
- Not found / conflict / unauthorized:
- Dependency failure (DB, third-party timeout):

## 7. Tests expected
- Unit: <which service functions, which branches>
- Integration: happy path + validation failure + auth failure + not found

## 8. Out of scope — do NOT invent
- No new npm dependencies.
- No schema or migration changes.
- No new patterns, abstractions, or endpoints beyond those listed above.
- No changes to auth, payments, or anything handling PII.

## 9. Escalation triggers — STOP and flag rather than guess
- The brief is ambiguous or self-contradictory.
- Doing this correctly appears to require a schema change, a new dependency, or a new pattern.
- The referenced pattern file doesn't actually fit the case.
- Anything touching auth, payments, PII, secrets, or destructive data operations.

## 10. Review checklist (filled by the owning Claude specialist before merge)
- [ ] Uses `@project/shared`'s contracts exactly — nothing redeclared
- [ ] Conventions: layering, dependency direction, TypeScript-only, zod at boundaries, error envelope
- [ ] Nothing invented (no new deps/patterns/endpoints/schema changes)
- [ ] All acceptance criteria met, including the named edge cases
- [ ] Security review if sensitive surface touched; a11y review if UI
- [ ] Verification stamp: `tsc ✓ / tests ✓ (re-run, not quoted) / N files (git-counted)`
