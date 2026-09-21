# AGENTS.md

> Cross-tool instructions — read natively by Codex, Jules, Cursor, and other
> AGENTS.md-compatible tools (agents.md, Linux Foundation-stewarded). Claude
> Code reads this too: `CLAUDE.md`'s first line imports it (`@AGENTS.md`), so
> content lives here ONCE, not duplicated. This file contains only what's
> genuinely tool-agnostic — build commands, architecture rules, conventions.
> Claude-specific orchestration (the 29-agent roster, hooks, skills) has no
> equivalent in Codex/Jules and lives in `.claude/CLAUDE.md` instead — that
> section doesn't need duplicating here either.

## Stack & commands (canonical — this is the required architecture for every project built from this template)

**npm/yarn workspace monorepo, three packages, each independently versioned:**
- **`client`**: Next.js **Pages Router** (not App Router) + TypeScript strict + Tailwind CSS + Redux Toolkit (state, `createAsyncThunk` for network calls) + Axios (`withCredentials: true`, interceptors unwrap the standard response envelope, imported from `@project/shared`) + Stripe.js/React Stripe.js + Playwright (e2e).
- **`server`**: Node.js + Express.js + TypeScript strict + PostgreSQL + Sequelize (ORM — models, hooks, associations, migrations, seeders; **models are server-only, never exported to shared**) + Zod validation (schemas live in `@project/shared`, imported into server middleware) + JWT via `httpOnly`/`secure`/`sameSite: 'strict'` cookies + Helmet + CORS + `express-rate-limit` (tiered: standard routes get general throttling, `/api/auth/*` gets aggressive throttling) + Stripe SDK + PayPal SDK + Winston (logging) + Swagger/OpenAPI (`server/swagger.json`).
- **`packages/shared`** (`@project/shared`): pure TypeScript, zero runtime backend or browser dependencies — request/response DTOs, Zod schemas, and domain enums (`OrderStatus`, `UserRole`, `PaymentType`, etc.), consumed by both `client` and `server` via `"@project/shared": "workspace:*"`. This is the single source of truth that makes API drift a compile-time error on both sides, not a discipline problem.
- Mobile (when a project needs it): Expo/React Native — additive, not a replacement for the web client; can also depend on `@project/shared`.
- Conditional per client, dormant unless `business-context.md` activates them: .NET, Spring Boot — out of scope for the current default; when activated, follow that stack's own established conventions instead of the above.
- `npm install` at the repo root installs across root, `client`, `server`, and `packages/shared` in one pass (workspace-aware).
- `npm run check` (typecheck + lint + tests) must exist and pass in `client/`, `server/`, and `packages/shared/` independently.

**Project structure** (exact — deviating from this needs a Founder-approved reason, not a specialist's preference):
```
client/src/{components/{common,layout,modules},config,contexts,hooks,i18n,interfaces,pages,services,store/slices,styles,utils}
server/src/{config,controllers,interfaces,middlewares,models,routes,scripts,services,utils}
packages/shared/src/{contracts,schemas,enums,index.ts}
```
Server layering: `routes → controllers → services → models`. Controllers handle request/response only; business logic and transactions live in `services/`; `models/` is Sequelize only, and Sequelize models are **never** exported into `packages/shared` — that package has zero backend runtime dependencies by design.

**Standardized API envelope** (every endpoint, no exceptions — the type itself lives in `packages/shared/src/contracts/api.ts` as `ApiResponse<T>`, not just documented convention):
```json
{"success": true, "message": "...", "data": {}}
{"success": true, "message": "...", "data": {"items": [], "pagination": {"currentPage": 1, "pageSize": 20, "totalItems": 142, "totalPages": 8}}}
{"success": false, "message": "...", "errors": [{"field": "quantity", "issue": "..."}]}
```
Enforced server-side by a single response-standardizer middleware typed against `ApiResponse<T>`; the client's Axios interceptor unwraps it once, centrally — no endpoint reinvents this shape, and both sides fail to compile if they drift from it.

**Payment & inventory**: cart checkout and package subscriptions are separate lifecycles, both driven by server-side webhook verification (never client-side redirects) with strict idempotency. Full pattern, including the row-lock inventory reservation and the webhook idempotency mechanism: `skills/payment-architecture-reference.md` — required reading before touching any payment code, not optional.

## Architecture invariants (non-negotiable, any tool)
- TypeScript only. No new `.js`/`.jsx` source files.
- Server layering above is fixed: business logic in `services/` only, never in `controllers/` or `routes/`.
- **`packages/shared` (`@project/shared`) is the single source of truth for anything crossing the client↔server boundary**: request/response DTOs (`contracts/`), Zod validation schemas (`schemas/`), and domain enums (`enums/`) — `shared-contracts-reference.md` has the full pattern. Never hand-write a duplicate interface on either side for something `@project/shared` already exports; never put anything backend-internal (Sequelize models, `req.user` types) or frontend-internal (Redux slice state, component props) into `packages/shared` — it stays pure and dependency-free.
- Never commit secrets, `.env*`, or credentials. Never touch production, real payment flows, or destructive data operations without explicit human approval — these are hard stops for any agent, tool, or human.

## Full conventions
`docs/CONVENTIONS.md` has the complete rules (naming, structure, security, testing, review blockers). Read it before non-trivial changes.

## Continuing work across sessions or tools (Codex, Jules, Claude Code, a human)

Work state lives in plain files any tool can read — this is what lets you switch tools mid-sprint and keep going instead of starting over.

**Run this first, always:** `node scripts/whats-next.mjs` — prints the next pending task, its `verify_cmd`, any outstanding delegation session that needs an answer, any open question, and any unresolved escalation ticket. One command instead of reading four files separately.

If you don't run the script, the files it reads are:
- `.claude/company/sprints/current/tasks.json` — the work queue. Each entry: `{"id", "description", "target_files", "verify_cmd", "status"}`. `status` is `pending` → `in_progress` → `done`. **Run `verify_cmd` yourself and confirm it exits 0 before flipping status to `done`** — Claude Code has a hook that enforces this automatically; nothing enforces it for you here, so don't skip it.
- `.claude/company/sprints/current/RESUME-POINT.md` — a short, current summary: outstanding delegation-tier sessions, pending questions, one-line status.
- `.claude/company/sprints/current/backlog.md` — the human-readable task list with acceptance criteria, one row per item.
- `.claude/company/escalations/` — if a previous session hit real ambiguity, it wrote `ESC-*.md` here instead of guessing. Check `**Status:**` — resolve an open one before continuing unrelated work.

**Update the same way you'd expect to inherit it**: flip `tasks.json` status yourself, add one line to `daily-log.md` (`<task-id> — <outcome>`, not a paragraph), and update `RESUME-POINT.md`'s three fields if something changed enough to matter for whoever picks this up next — including you, in a future session.

**One-time setup, any tool**: `node .claude/setup/install-git-hooks.mjs` installs the OS-level pre-commit/pre-push checks (secrets, TypeScript-only, `npm run check` before push) — this works identically regardless of which agent or tool is making the commit.

## When you make a mistake
If corrected on something, update THIS file so the fix persists for the next session — this is the same feedback-loop discipline Codex, Claude Code, and most agent tools already expect from an AGENTS.md file.
