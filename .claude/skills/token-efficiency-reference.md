# Reference: token-efficiency

Deep detail for `token-efficiency.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Core rule

Use the **smallest sufficient process, context, model, tool action, and response** that can safely complete the task. Scale up only when complexity, uncertainty, risk, or verification needs justify it. Do not spend tokens re-explaining rules already captured in this package, reproducing unchanged code, or convening agents without a distinct decision or deliverable.

## Context discipline

1. Read `CLAUDE.md`, `company/business-context.md`, the active story, and only the files necessary to make the next correct decision. Use targeted search and relevant line ranges rather than loading directories or long files wholesale.
2. Load only the skill(s) named by the Team Lead. Do not preload catalogs, alternate platform guides, or adjacent specialties "just in case." If a needed skill is not named, request or record a narrow routing correction.
3. Reuse existing decisions. Check ADRs, daily-log contract notes, and the nearest analogous feature before proposing a new pattern. Link to a prior decision instead of restating it.
4. Preserve a compact decision record: decision, reason, owner, constraint, and reference. Do not paste long transcripts, full diffs, generated logs, or repeated requirements into the daily log.
5. When information is missing, ask one focused question only if it blocks a material decision. Otherwise state the assumption, select the safest reversible option, and continue within scope.

## Context retrieval priority (cheapest first)

Before touching code, get context in this order — stop as soon as the question is answered, don't escalate further:
1. **grep/targeted search** for a specific symbol, string, or a one-line-range answer.
2. **Query the code graph** (`skills/project-graph.md` — `graphify-out/graph.json`) for structure, impact/blast-radius, or "what depends on this" — cheaper than reading the files themselves.
3. **repomix** (`npx repomix`) for a compressed multi-file slice when several related files must be seen together (a whole feature folder, not the whole repo).
4. **Targeted file read** (specific line range) when you need exact current code to edit.
5. **Full-file read** only when the file is small or truly can't be understood in parts — the last resort, not the default.
Never read a directory or a multi-thousand-line file wholesale to answer a question a grep or graph query would answer.

## Skill catalog lookup

Grep `skills/INDEX.md` for the domain keyword to find the right skill name; don't read the full index top-to-bottom every time. Every skill is two files: `<name>.md` (lean — title + trigger, confirms relevance) and `<name>-reference.md` (the actual doctrine). Read the lean file first if relevance is genuinely uncertain; once you're implementing, read `<name>-reference.md` — that's where the content is. The Team Lead names skills by exact filename in the assignment so downstream agents usually skip straight to the reference file with no lookup at all.

## Dispatch discipline (Task/subagent cost)

- A `Task` dispatch loads that agent's full definition plus its named skills into a fresh context — real cost, not free. For a genuinely trivial one-line fix, the already-active agent makes the edit directly; don't spin up a subagent to save one line of reasoning.
- Parallel dispatch trades tokens for wall-clock: N agents in parallel each carry their own context + skill loads. Parallelize when the work is genuinely independent and the time saved matters; for small sequential work, serial is cheaper in tokens even if slightly slower.
- Prefer one focused agent doing a complete vertical slice over several agents each touching one file of the same slice — the handoff overhead between agents often costs more than the "specialization" saves for small stories.

## Session hygiene

Start a fresh session per distinct task or story rather than extending one long-running thread — every prior turn is re-sent with each new prompt, so an old thread's accumulated context is pure overhead on new work. If a thread must continue, periodically compact settled ground into `company/decision-log.md` or the daily log and drop it from active discussion rather than re-deriving it each turn.

## Prompt-cache economics (why "keep context" actually saves money)

Claude's prompt cache reuses an exact-match prefix at ~10% of normal input cost — but Anthropic's default cache TTL is currently 5 minutes (reduced from 1 hour in early 2026), and the cache is destroyed by: (1) an idle gap of 5+ minutes between turns, (2) any edit to a file that forms part of the always-injected prefix — `CLAUDE.md` specifically, since it's re-read every turn — and (3) a `/compact` or context-compaction event. None of these are things a `.claude/` markdown file or hook can configure directly (the TTL is a client/API-level setting); what the team CAN control is not triggering an avoidable miss:
- **Don't edit `CLAUDE.md`, agent files, or `settings.json` mid-session** unless the change is the actual point of the task — each edit invalidates the cached prefix for every subsequent turn until a new one forms.
- **Batch decisions instead of many small back-and-forth exchanges** — a long idle gap while a human reads and thinks about a report is itself a cache-destroying wait, which is one more reason completion logging stays to one line: less to read, shorter gaps, more cache survival.
- **`RESUME-POINT.md` is not just about surviving a lost session — it's also the recovery path from a cache miss**, since a compaction event that destroys the cache is the same event that would otherwise lose track of where the work stood.

## Memory & log hygiene (persistent company files)

`ceo-memory.md` and `decision-log.md` are never archived per sprint (unlike `daily-log.md`, which resets with the sprint) — they accumulate for the life of the client engagement and are read on every relevant activation. Cap each at roughly 150 lines: when a file exceeds that, roll the oldest half into a single dated summary block (date range + the facts still relevant today) and keep only recent entries at full detail — the same "recurring log needs a cadence, not an archive" principle as the daily log, applied to memory that never gets a sprint boundary to reset it.

## Context-isolation subagent pattern

Reconnaissance requiring a broad scan across ≥5 unfamiliar files pollutes the main thread permanently — every file read stays in context for the rest of the session even after the answer is extracted. Only `ceo` and `team-lead` hold the `Task` tool (a deliberate, tested architectural boundary — see `CLAUDE.md`'s Chain of Command), so this pattern applies to THEIR broad research needs (a codebase survey during grooming, deep research reading many sources), not to every specialist mid-task. Dispatch a generic exploration subagent (`Task`, no named specialist — an unnamed research helper, not a roster role) with a tightly scoped prompt naming exactly what to find; instruct it to return ONLY a concise structured synthesis (max 10–20 lines), never raw file contents or a transcript of what it read. If an ASSIGNED SPECIALIST recognizes mid-task that it needs a broad survey beyond its assignment, it flags this back to the Team Lead rather than reading everything itself — the Team Lead runs the exploration pass (or folds it into the next assignment) and relays the synthesis. This keeps the single-dispatch-authority invariant intact while still isolating the token cost of broad reconnaissance from the main thread.

## Automate repeated mechanical checks — don't re-reason, run a script

If the SAME verification recurs across stories or sprints (does this file follow the naming convention, does the bundle stay under budget, does this diff still match the contract in `@project/shared`), write it as a script or CI check ONCE rather than having an agent re-derive the answer via LLM reasoning every time it comes up. A script is deterministic, free after it's written, and instant; re-reasoning the same check burns tokens for a worse-calibrated answer than the check would give directly. This is why `graphify`/`repomix` exist for structural questions, why `npm run check` exists for correctness, and why `engineering-craft-reference.md`'s Large-Refactor Protocol requires a drift-detection check rather than manually re-eyeballing contract conformance after every batch. When a new recurring check is identified, the specialist that keeps performing it manually should propose scripting it (logged in the daily log) rather than accepting the repeated cost as normal.

## Work sizing and output budget

| Tier | Planning allowance | Implementation output | Completion report |
|---|---|---|---|
| **LOW** | No plan; classify and act. | Minimal diff or exact edit. Do not narrate routine mechanics. | One log line plus fresh verification result. |
| **MEDIUM** | Three to six lines: outcome, files/boundary, risks, evidence. Proceed immediately. | Change only the required files; reuse approved patterns and components. | Outcome, changed files, decisions/exceptions, verification, open risk. |
| **HIGH** | Grooming artifacts only: decision-ready brief, architecture/security review, scope, risks, acceptance evidence. | Work in dependency-ordered vertical slices; summarize between checkpoints. | Executive summary, decisions, evidence, residual risk, next Founder decision. |

The Team Lead assigns a **response shape** with each task. Examples: `diff + test result`, `decision table`, `feature contract + changed files`, or `security verdict + findings`. Do not generate full files, tutorials, exhaustive alternatives, or generic best-practice essays unless the task requires them.

## Agent orchestration discipline

- Assign a specialist only when that specialist owns a distinct deliverable, decision, review, or verification. Do not ask several agents to independently rediscover the same facts.
- Parallelize only independent work with disjoint files, data, and decisions. Send each specialist a compact handoff: objective, acceptance criteria, owned boundary, named skills, known decisions, constraints, and expected response shape.
- Serialize work when an API contract, design-system choice, security decision, or shared file must settle first. A short dependency wait is cheaper than merge conflicts and rework.
- Reviewers do not restate the author’s implementation. Cite only blocking findings, non-blocking suggestions, exact evidence, and a verdict. If no finding exists, say so plainly.
- Keep a single source of truth for each category: contracts in `@project/shared`, design tokens in the design system, decisions in ADRs/daily log, requirements in the story, and verification in QA evidence.

## Implementation efficiency without quality loss

| Prefer | Avoid |
|---|---|
| Nearest approved pattern, existing component, shared schema, typed client, and token | Rebuilding a pattern, retyping a contract, or adding a dependency for one use |
| Vertical slices that prove a user outcome early | Large disconnected sets of components, endpoints, or utilities |
| Targeted tests for changed behavior and risk | Broad test rewrites or test dumps unrelated to the change |
| Targeted security checks driven by trust boundaries and CIA impact | Generic audit narration or security theater |
| Concise, structured result tables | Repeated prose, raw command logs, duplicated acceptance criteria |
| Links/references to artifacts | Pasting whole files or screenshots into updates |

## Efficient verification

Run only the checks relevant to the change, plus the project’s required final gate. Reuse a fresh successful result only while no dependent file or environment state has changed; otherwise re-run. Capture the command, pass/fail result, and essential evidence—not the entire console stream. UI changes need the agreed screenshots and accessibility/keyboard proof; security-sensitive changes need the relevant negative tests and security review; availability-sensitive changes need focused failure or recovery evidence.

## Response rules

Start with the outcome or decision. Follow with only the changes, evidence, risks, and one clear next action when one is needed. Use tables when they reduce repeated text. Do not expose private reasoning; communicate concise decisions, trade-offs, and verifiable evidence. Do not claim unverified success, invent file references, or inflate a small task into a report.

**Completion logging is ONE LINE, by default, for every agent — this supersedes any longer "on completion, log X/Y/Z" wording in an individual agent file's own Protocol section.** Those sections describe WHAT must be true (tests ran, contracts documented, evidence exists) — not how much prose to write about it. The daily-log entry is: `<tier-emoji> <task-id> — <outcome clause>` (e.g. `✅ TASK-04 login fix — tests pass`). The target split across a sprint is roughly 90% of tokens on the actual code/tests/config and 10% on everything conversational (plans, reviews, logs, reports combined) — a real number, not a vibe: if a task's log entry is longer than the diff summary, that's the failure mode this rule exists to prevent. Verification detail (what was checked, why) lives in the tool output itself (`verify-stop-gate.mjs`'s deterministic check) — don't re-narrate what a shell command already proved.

## Escalation rule

Never save tokens by skipping an Always-Stop gate, a CIA control, required review, test, security design review, accessibility check, or uncertainty that could materially affect the Founder’s decision. In those cases, provide the smallest complete decision request: context, options, recommendation, impact, and the exact approval needed. This is the one place brevity yields — a genuine escalation gets the words it needs, never padded, never cut short.
