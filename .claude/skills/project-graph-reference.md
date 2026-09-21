# Reference: project-graph

Deep detail for `project-graph.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Why a graph, not a guess
Most breakage comes from editing a node without knowing its edges — who imports
this, what this route calls, which types ripple. A quick structural map turns
"I think this is safe" into "these 6 files consume it." Build the map from the
CODE, never from memory or a stale doc (`verification-discipline.md`).

## What "the graph" means here (layers)
1. **Module/import graph** — files and their import/export edges; the dependency direction; cycles.
2. **Layer/boundary graph** — server side: `routes → controllers → services → models`; client side: `pages → components → services/store`; both flow FROM `packages/shared`, never INTO it (respects the CONVENTIONS dependency-direction rule) — `client` and `server` must never import from each other directly, only through `@project/shared`.
3. **Route/endpoint graph** — routes/handlers → the services and data they touch, and which `client/src/services/` calls hit which server route.
4. **Data/contract graph** — `packages/shared/` (DTOs, Zod schemas, enums) and every consumer (`client`, `server`, mobile, integrations) — the highest-blast-radius edges; a change here potentially breaks the build on BOTH sides, which is the point (`shared-contracts-reference.md`).
5. **Runtime/service graph** (for multi-service or 3D/heavy apps) — process/service boundaries and what crosses them (pairs with `system-architect` ADRs).

## How to build it (cheap, on demand — TypeScript-first)
- **Fast inventory**: `git ls-files` + ripgrep for a targeted question ("who imports `authService`?" → `rg "from ['\"].*authService"`). For most single-change impact checks, a scoped ripgrep IS the graph — don't over-tool.
- **Import/dependency graph tools** (choose per need, all TS-aware):
  - **madge** — quick import graph + **circular-dependency detection** (`madge --circular --extensions ts,tsx client/src server/src`) and DOT/SVG output. Lightest first reach.
  - **dependency-cruiser** — richer: validate boundary RULES (fail CI if a controller imports a model directly, skipping the service layer; if a client component imports from `server/`; or if `client`/`server` import from each other instead of through `packages/shared`), plus graphs. Use to ENFORCE the CONVENTIONS dependency direction, not just view it.
  - **ts-morph / the TS compiler API** — programmatic, precise symbol-level graph when you need "every caller of this exact function/type" beyond text matching.
- **Framework-native**: Sequelize's own association definitions ARE a data graph — read `models/` associations before assuming a query shape; `tsc --noEmit` catches the ripple after a schema change (the type graph, verified) on each side independently (client and server are separate TS programs).
- **Visual**: emit SVG/DOT for a HIGH-tier grooming artifact so the Founder/architect see the boundary map; keep it in `docs/` if durable.

## The impact-analysis workflow (the main use)
Before editing node X:
1. Find X's **consumers** (who imports/calls it) and X's **dependencies** (what it needs).
2. State the **blast radius**: the files that must be re-checked/tested if X changes — especially `packages/shared/` changes (ripple to every route AND every client consumer at once — both fail to compile until updated, which is the safety net working as intended, not a problem to route around) and route contracts (ripple to every client caller).
3. Feed that list into the plan, the tests to run, and the daily-log contract notes. A change to `packages/shared` is still announced to consuming agents via the Team Lead BEFORE the edit — the compiler will catch a missed update, but a heads-up before the build breaks is still cheaper than after.

## Boundary/health checks worth running
- **Cycles**: `madge --circular` — circular deps are refactor debt and a load-order hazard; flag them.
- **Boundary violations**: dependency-cruiser rules encoding CONVENTIONS (feature isolation, shared-direction) — surface a violation as a review finding.
- **Orphans/dead code**: modules nothing imports — candidates for removal (confirm, don't assume).

## Guardrails
The graph is analysis only — building it never edits code or runs destructive commands. Tools run read-only against the repo. Report the graph compactly (the answer to the question asked — the consumer list, the cycle, the boundary break), not a giant dump of the whole tree (`token-efficiency.md`): scope the graph to the decision at hand.

## Common failure modes
Editing a shared type without listing consumers (breaks callers silently) · trusting a stale architecture doc instead of deriving from code · pulling in a heavy graph tool when a scoped ripgrep answered it · circular dependency shipped (load-order bug) · feature-to-feature import sneaking past review (boundary erosion) · dumping the entire module graph when only the blast radius was needed.
