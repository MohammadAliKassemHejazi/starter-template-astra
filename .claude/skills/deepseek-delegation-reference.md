# Reference: deepseek-delegation

Deep detail for `deepseek-delegation.md`. Read when architecting or reviewing
delegated work.

## The model
`Claude architects → writes the implementation brief → DeepSeek implements → Claude reviews → normal gates`.
Tokens shift from Claude's generation to DeepSeek's generation. Claude's tokens go into the brief and the review — both far shorter than writing the whole implementation, which is where the saving comes from.

## Division of labor

**Claude does (never delegated) — this is where Claude's coding capability is deliberately concentrated:**
- System/service boundaries and contracts (`system-architect`, `api-design-reference.md`, `shared-contracts-reference.md`).
- Data models, schema and migration strategy, indexing, caching invalidation (`data-architect`).
- Anything security-sensitive: auth flows, permission checks, payment paths, PII handling, input-validation design, crypto usage.
- Non-obvious algorithms, concurrency, state machines, performance-critical paths — anywhere a subtly-wrong-but-plausible implementation is expensive.
- Debugging real failures (root cause needs judgment; a wrong guess wastes more than it saves).
- Integration seams between features, and any change with a wide blast radius (`project-graph-reference.md`).
- The implementation brief itself, and the review of everything that comes back.
- Every Always-Stop item, gate, classification, verdict, and Founder-facing communication.

**DeepSeek does (from an approved brief):**
- Bulk implementation of well-specified features: routes/handlers/services/components that follow an already-decided pattern.
- Repetitive variants — CRUD across many resources, component families, form screens sharing one structure.
- Test scaffolding from acceptance criteria Claude/qa-devops already wrote.
- Mechanical refactors with a stated rule (rename, extract, migrate a pattern across N files).
- Type/DTO stubs derived from existing `@project/shared` Zod schemas.
- First-draft docs for code that already exists.
- Bulk data/format transformation with a specified rule.

**The dividing question**: *does this require a decision, or does it require typing against a decision already made?* Decisions are Claude's. Typing is delegable.

## The implementation brief (the contract that makes this work)
Use `templates/implementation-brief.md`. A brief is complete only if a competent engineer could execute it without asking a question. Minimum contents:
- **Scope**: exact files to create/modify, and explicitly what NOT to touch.
- **Contracts**: the exact `@project/shared` schema/type path involved, verbatim — never "the user type."
- **Architecture rules that apply**: the specific `docs/CONVENTIONS.md` sections, layering (routes → controllers → services → repositories), dependency direction, TypeScript-only rule, error envelope shape, validation placement.
- **Pattern to follow**: point at an existing file in this repo that already does the analogous thing ("mirror `src/features/orders/service.ts`"). This is the single highest-leverage line in a brief.
- **Acceptance criteria**: Given/When/Then, testable.
- **Edge cases and error states** to handle explicitly.
- **Out of scope / do not invent**: no new dependencies, no schema changes, no new patterns without escalation.
- **Escalation trigger**: what DeepSeek should stop and flag rather than guess.

## Review protocol (non-negotiable)
Delegated output is treated as an untrusted outside contribution — reviewed line by line before it enters the repo, never pasted in on trust. Check, in this order:
1. **Contract conformance** — does it import from `@project/shared` exactly, or did it redeclare a shape locally? (The most common delegation defect — and the fastest to catch, since a redeclared shape usually still compiles, so this needs an actual look, not just `tsc`.)
2. **Convention conformance** — layering, dependency direction, TypeScript-only, zod at boundaries, error envelope, naming.
3. **Invented surface** — new dependencies, new patterns, new endpoints, silently changed schemas. Anything invented is reverted or escalated, not accepted because it works.
4. **Correctness against the acceptance criteria**, including the edge cases the brief named.
5. **Security review** if it touched anything on the sensitive list (`security-auditor`), a11y if UI (`a11y-auditor`) — unchanged gates.
6. **Fresh verification**: re-run tsc/tests/build, count files from git (`verification-discipline-reference.md`). Delegated work is verified more carefully, not less.

The owning specialist remains accountable. "DeepSeek wrote it" is not a defense for a defect, a convention violation, or a missed edge case.

## When NOT to delegate (even when active)
- The brief would take longer to write than the implementation (small tasks — the overhead exceeds the work).
- The task is exploratory or ambiguous — review becomes a rewrite, which is a net token LOSS, not a saving.
- HIGH-tier design work, or anything in the Claude-only list above.
- Client data would need to be sent and the Founder hasn't approved that data flow in writing (DeepSeek is a third-party subprocessor — see `compliance-extended-reference.md`; regulated clients need the DPA/BAA question answered first).

## Economics (be honest about it)
Delegate when `brief tokens + DeepSeek tokens + review tokens < Claude implementing directly`. That holds strongly for bulk, repetitive, well-patterned work and fails for small or ambiguous tasks. Track DeepSeek spend per feature alongside Claude spend (`finops-cost-reference.md`) — it's a paid service, and the money guardrail applies. If review keeps turning into rewriting for a given task type, that type is mis-classified: stop delegating it and say so in the retro.

## Setup
1. Set `DEEPSEEK_API_KEY` in your own shell (never in the repo — `setup/connect-deepseek.mjs` prints the exact command per platform). Optionally `DEEPSEEK_MODEL` (default `deepseek-chat`).
2. That's it — the tier auto-activates. Verify with `node .claude/setup/deepseek-status.mjs`.
3. Remove the key to deactivate; the team continues Claude-only with no other change.

## Failure modes
Vague brief → DeepSeek invents architecture and Claude rewrites it (net loss) · delegated code merged without line-by-line review (the whole safeguard) · redeclared types instead of importing `shared/` contracts · silently added dependencies · client data sent without an approved data flow · a specialist blaming the model for a defect they own · delegating debugging or design because it "seemed faster" · forgetting DeepSeek cost in the feature's cost line · brief that omits the "mirror this existing file" pointer, producing code in a foreign style.
