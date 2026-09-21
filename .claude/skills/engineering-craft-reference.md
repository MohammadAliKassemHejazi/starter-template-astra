# Reference: engineering-craft

Deep detail for `engineering-craft.md`. Read when implementing or reviewing.

## Before writing any code (the pre-edit checklist)
- **Read the target and its neighbours.** What pattern does this area already use? Match it (`docs/CONVENTIONS.md`: consistency over novelty).
- **Trace the real path** — request → middleware → route → service → repository → DB → response, or render → state → effect → data. Know what runs before and after your change.
- **Know the blast radius** before editing shared code: who imports this? (`project-graph-reference.md`). A `@project/shared` contract change ripples to every consumer on both sides — and both fail to compile until they're updated, which is the intended safety net.
- **Confirm the contract** — `@project/shared`'s schema is the truth for shapes (`shared-contracts-reference.md`); never redeclare a type that already exists there.
- **Find the analogous file** that already solves a similar problem, and mirror its structure. This is also the highest-leverage line in a delegation brief.

## Surgical editing
- One story = one coherent change. Unrelated cleanup goes in its own story, not smuggled into this diff.
- Prefer the smallest correct edit over a rewrite. A rewrite discards working, reviewed, tested behavior and re-opens every bug that was already fixed there.
- Don't reformat files you're not otherwise changing — it buries the real diff and generates merge conflicts for parallel streams (`integration-merge`).
- Don't rename or move things "while you're in there" unless the story asks; those changes have wide blast radius and belong in their own reviewed unit.
- If you find a real problem outside scope: log it, tell the Team Lead, let it be prioritized. Don't silently fix it and don't silently ignore it.

## Simplicity
- Write the straightforward version first. If it meets the criteria and the conventions, that's the answer.
- **Rule of three** for abstraction: two similar things are a coincidence; three are a pattern worth extracting. Premature abstraction is harder to remove than duplication.
- Avoid speculative generality — config options, hooks, and extension points nobody asked for are surface area that must be maintained, tested, and understood forever.
- Fewer moving parts beats fewer lines. Clever one-liners that need a comment to explain are a net loss.
- New dependency = a decision, not a convenience: it's supply-chain risk, bundle weight, licence exposure (`compliance-extended-reference.md`), and maintenance. Justify it or write the few lines.

## Debugging method (root cause, not symptom)
1. **Reproduce it reliably first.** A fix for a bug you can't reproduce is unverifiable by definition.
2. **Form a hypothesis and test it** — read the actual error, stack trace, and the real data (`sentry-triage-reference.md`), rather than changing things until the symptom moves.
3. **Find the mechanism.** Explain why it happened in one sentence. If you can't, you haven't found it — you've found something that correlates with it.
4. **Fix the cause**, then confirm the reproduction case now passes AND nothing adjacent broke (re-run fresh — `verification-discipline-reference.md`).
5. **Add a regression test** so it cannot silently return (`test-driven-development-reference.md`).
6. Never "fix" by widening a type to `any`, swallowing an exception, adding a retry around a deterministic bug, or bumping a timeout to hide a race.

## Large-refactor protocol (triggers above ~10 files, or an architectural service extraction — HIGH tier by definition, grooming + gate)

Surgical editing above assumes a normal story. A refactor at this scale needs staging, not one giant diff:

1. **Pre-flight safety net.** Before touching anything, confirm baseline end-to-end and unit tests are pinned and passing (`test-driven-development-reference.md`). A refactor with no working safety net is a rewrite wearing a refactor's name — you can't tell if you preserved behavior without one.
2. **Strangler fig / branch by abstraction.** Introduce the new interface/path alongside the old one; migrate callers to it incrementally; only delete the old path once nothing calls it. Never delete-then-rebuild — that removes working, tested behavior before its replacement is proven.
3. **Micro-batching.** Maximum ~5 related files per incremental commit and verification step. Each batch is independently green (`npm run check`) before the next starts — a failure is isolated to a small, reviewable diff instead of buried in a thousand-line change.
4. **Drift detection, every batch.** Re-verify against `shared-contracts-reference.md` after each batch — a contract violation shows up as a type error immediately if checked per-batch, and as a mystery three weeks later if checked only at the end. This is exactly the kind of repeated mechanical check that should be scripted once, not re-eyeballed each time (`token-efficiency-reference.md`'s automation principle) — `tsc --noEmit` against the shared types IS that script.

A large refactor that skips the safety net or batches unrelated changes together is not following this protocol regardless of how careful the diff looks — the staging is what makes a big change reviewable and reversible, not the care taken within a single giant commit.

## Working in a multi-agent codebase
- Assume another stream is editing nearby: keep diffs tight, commits atomic and conventional, and branches synced (`git-workflow-discipline-reference.md`).
- Document contract changes in the daily log and tag the consuming agent — the frontend cannot read your mind about a renamed field.
- Leave the code better-organized than a stranger would need to understand it in six months, but only within the scope you touched.

## Failure modes
Editing without reading the surrounding code · rewriting a working module because it looked unfamiliar · drive-by reformatting that hides the real diff · premature abstraction from a single example · adding a dependency for something trivial · `any` or a swallowed catch used to make an error go away · a retry masking a deterministic bug · a fix with no explanation of the mechanism · silently fixing an out-of-scope problem (invisible blast radius) · cleverness that needs a comment to be readable.
