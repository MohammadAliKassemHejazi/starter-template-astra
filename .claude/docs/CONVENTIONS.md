# Engineering Conventions

> Enforced by the Team Lead and code-reviewer. The codebase must read as though it were written by one careful senior engineer. Prefer the existing repository convention when it already meets this standard. A deliberate deviation requires an ADR or a concise daily-log decision; personal preference is not a reason.

## 1. The implementation contract

Every change must be **easy to locate, easy to reason about, safe at its boundaries, and backed by evidence**. Choose the smallest coherent design that meets the acceptance criteria. Do not introduce a framework, folder, abstraction, dependency, global state, or cross-cutting pattern for a single speculative use.

| Principle | Required behavior | Review question |
|---|---|---|
| One responsibility | Each module has one primary reason to change. Split mixed responsibilities at meaningful seams. | Can this file’s purpose be stated in one sentence? |
| Explicit boundaries | Validate input and expose typed output at route, action, service, repository, integration, and UI boundaries. | Where does untrusted data enter, and where is it validated? |
| Locality before reuse | Keep feature-specific code together. Promote code to shared only after a real second use or a deliberate platform decision. | Is this abstraction serving two stable consumers today? |
| Predictable control flow | Prefer guard clauses, named functions, typed results, and explicit error paths. | Can a new developer identify success, expected failure, and unexpected failure? |
| Consistency over cleverness | Use the established pattern even when a shorter novelty exists. | Does this match its nearest analogous feature? |
| Evidence over assertion | Completion claims cite fresh commands, tests, screenshots, or review evidence. | What proves this works and fails safely? |

## 2. TypeScript and language policy

- Use TypeScript for every new source, test, script, seed, migration, worker, and supported configuration file. New `.js` or `.jsx` source files are rejected. In a legacy JavaScript project, create typed boundaries and propose the migration path; do not silently add more untyped surface area.
- Enable `strict: true`. Do not use `any`. Use `unknown` at an untrusted boundary, then narrow with a schema or type guard. Do not use `@ts-ignore`; a narrowly scoped `@ts-expect-error` needs a linked issue or an immediately nearby reason.
- Give exported functions, public component props, and external contracts explicit types. Prefer inferred types for clear local implementation details.
- Use `type` for data shapes and unions; use `interface` only when the project has a documented need for declaration merging or extension.
- Import types with `import type` when they are type-only. Do not duplicate a contract already owned by `@project/shared` (`packages/shared/src/contracts/`, `schemas/`, `enums/`) — check `shared-contracts-reference.md` before retyping a request/response shape.
- Prefer immutable values. Use `const` by default; use `let` only when reassignment improves clarity. Do not mutate inputs, global state, or shared objects without an explicit, documented ownership rule.

## 3. Naming and file conventions

| Item | Convention | Examples |
|---|---|---|
| Variables and functions | `camelCase`, verb-led for actions | `createInvoice`, `hasAccess`, `invoiceCount` |
| Components, types, classes | `PascalCase` | `InvoiceSummary`, `CreateInvoiceInput` |
| Boolean values | `is`, `has`, `can`, `should`, `needs` prefix | `isLoading`, `hasPermission` |
| Environment variables | `SCREAMING_SNAKE_CASE`; validated and accessed through typed config | `DATABASE_URL` |
| Files and folders | `kebab-case` by default; React component files may use `PascalCase` only if that is the existing repository rule | `invoice-service.ts`, `InvoiceSummary.tsx` |
| Tests | Co-locate with the behavior; use `.test.ts`, `.spec.ts`, or project standard consistently | `create-invoice.test.ts` |
| Routes | Follow the framework route convention; keep route files thin | `app/invoices/[id]/page.tsx` |

Name by domain intent, not implementation accident. Avoid `utils`, `helpers`, `common`, `misc`, `manager`, `processor`, `data2`, `new`, `final`, and ambiguous handler names. If a name cannot be precise without becoming long, the module likely has more than one responsibility.

## 4. Project and dependency structure

This template's canonical architecture is an npm/yarn workspace monorepo — `client` (Next.js Pages Router), `server` (Express), and `packages/shared` (`@project/shared`, pure TypeScript, zero runtime dependencies) as independently versioned workspace packages. Preserve this layout; deviating needs a Founder-approved reason recorded in `business-context.md`, not a specialist's preference.

```text
client/src/
├── components/{common,layout,modules}/  # common: buttons/modals/inputs; layout: header/footer/nav; modules: domain components (Checkout, ProductCard)
├── config/                  # client-side env vars and constants
├── contexts/                # React contexts (ThemeContext, ToastContext)
├── hooks/                   # custom hooks (useDebounce, useAuth)
├── interfaces/              # CLIENT-ONLY types — UI and Redux state shapes; anything crossing the API boundary comes from @project/shared instead
├── pages/                   # Next.js Pages Router routes
├── services/                # API interaction layer, consuming @project/shared's DTOs/schemas (shopService.ts, authService.ts)
├── store/slices/            # Redux Toolkit domain slices (cartSlice, authSlice, shopSlice)
├── styles/                  # global CSS + Tailwind directives
└── utils/                   # httpClient.ts (Axios instance), formatters

server/src/
├── config/                  # DB connection, env validation, Stripe/PayPal config
├── controllers/             # request handling and response dispatching — no business logic here
├── interfaces/              # SERVER-ONLY types — Express req/res augmentation, database context; anything crossing the API boundary comes from @project/shared instead
├── middlewares/             # auth, role-checking, error handler, Zod validators (using schemas imported from @project/shared)
├── models/                  # Sequelize models, hooks, associations — LOCAL to server, never exported into packages/shared
├── routes/                  # Express route declarations + middleware bindings
├── scripts/                 # DB seeders and maintenance scripts
├── services/                # business logic, transactions, third-party integrations — payments live here (payment-architecture-reference.md)
└── utils/                   # custom app errors, Winston logger, response-standardizer helper (typed against @project/shared's ApiResponse<T>)

packages/shared/src/
├── contracts/                # DTOs: CartCheckoutRequest, ApiResponse<T>, PaginatedData<T>, AuthPayloads, etc.
├── schemas/                  # Zod schemas: loginSchema, checkoutSchema, addressSchema — one file per domain, not per endpoint
├── enums/                    # OrderStatus, UserRole, PaymentType, and any other cross-boundary enum
└── index.ts                  # the single import surface: `import { CartCheckoutSchema, ApiResponse } from '@project/shared'`

package.json                  # root — npm/yarn workspaces definition
tsconfig.base.json             # shared TypeScript compiler options, extended by client/server/packages/shared
```

Dependency direction, server side: **`routes → controllers → services → models`**, with `@project/shared` importable from any layer but importing nothing back (zero dependencies is what keeps it safely shared). Client side: **`pages → components → services/store`**, same rule — `@project/shared` flows in, never out. Never create circular imports; break a cycle by moving the genuinely shared logic into `packages/shared` itself rather than cross-importing between `client` and `server` directly (they must never import from each other — only through the shared package). Verify this direction and detect cycles/boundary violations with `skills/project-graph.md` (e.g. `madge --circular`, dependency-cruiser rules) rather than by eye — especially before a refactor or a shared-contract change.

## 5. Frontend composition

- Pages Router (`client/src/pages/`), not App Router — no Server Components, no `'use client'` boundary. Use `getStaticProps`/`getServerSideProps` for SEO-relevant pages; interactive/dashboard views fetch client-side via Redux Toolkit thunks. Never fetch the same data twice (once in a data-fetching function, again in a `useEffect`).
- Compose pages from feature components and accessible UI primitives. A page or layout should express route composition, metadata, authorization entry behavior, and data handoff; it should not contain large business calculations or ad hoc network logic.
- Give each async user-visible path intentional loading, empty, error, unauthorized, and unavailable states. Do not hide a failure behind an endless spinner or silent empty panel.
- Prefer URL state for shareable, navigable state; server state for persisted facts; local component state for transient interaction. Do not copy server state into client state without a defined synchronization reason.
- Keep form schemas near the feature boundary. Validate in the browser for fast feedback and on the server as the authority. Show actionable field errors; disable duplicate submission while pending.
- Use semantic landmarks and native controls first. Every interactive element must be reachable by keyboard, expose an accessible name, show visible focus, and communicate errors or dynamic state appropriately.
- Use the framework image component or equivalent with correct dimensions and meaningful alt text. Decorative images use empty alt text; never use filename-like alt text.

## 6. Styling and design-system discipline

- Use the repository’s selected styling approach consistently. Do not mix Tailwind, CSS Modules, SCSS, inline styles, and CSS-in-JS within a feature unless an ADR documents the boundary.
- Use semantic design tokens for color, typography, spacing, radius, elevation, motion, z-index, and breakpoints. No raw hex values, arbitrary spacing, or unexplained magic values in component code.
- Prefer component-scoped styles. Global styles are limited to resets, tokens, typography foundations, accessibility utilities, and explicitly documented layout primitives.
- Choose layout intentionally: Flexbox for one-dimensional alignment and distribution; Grid for two-dimensional composition. Record non-obvious decisions in the website brief.
- Build mobile-first. Define behavior at the agreed viewport set for each material layout; do not apply generic shrink-to-fit patches after desktop is finished.
- Use motion only to clarify hierarchy, state, or feedback. It must respect reduced-motion preferences and avoid layout-thrashing properties. The resting visual state remains understandable without animation.

## 7. Backend, APIs, and data

- Separate route or framework adapters, services, and repositories. A route parses protocol concerns and delegates; a service owns a use case; a repository or adapter owns I/O. Do not embed authorization, SQL, or remote calls in React components.
- Validate all untrusted input with Zod or the project’s approved schema library: request body, query, route params, webhooks, environment, file metadata, and third-party responses. Treat typed client input as untrusted on the server.
- Use a shared, typed error model. Client-safe messages must not expose stack traces, secrets, internal IDs, or authorization details. Log technical context safely using the project logger.
- Check authorization server-side for every resource and state-changing operation. UI visibility is never authorization. Scope data access by the authenticated principal and tenant before loading or updating records.
- Use parameterized queries or the approved ORM/query builder. Never construct queries, shell commands, paths, or HTML by string concatenation with untrusted values.
- Version migrations; never edit an applied migration. Prefer reversible, observable migrations and idempotent webhook/event handlers. Use explicit concurrency protection when stale writes could damage data.
- Parse and validate environment variables at startup through a typed configuration module. Access `process.env` only in that module. Never expose server secrets to client bundles, logs, test snapshots, or error reports.

## 8. Security by design and CIA controls

| Objective | Required implementation behavior | Review evidence |
|---|---|---|
| Confidentiality | Minimize data; classify sensitive fields; enforce server-side authorization and tenant scope; protect secrets; redact logs and client-safe errors. | Cross-user or cross-tenant denial test; secret scan; data-flow review. |
| Integrity | Validate input; authorize state changes; encode output; make webhooks idempotent; use CSRF protection where cookie-authenticated state changes require it; audit privileged actions. | Invalid-input, tamper, replay, and authorization tests as applicable. |
| Availability | Bound request size, retries, timeouts, pagination, uploads, and costly operations; fail gracefully; provide health and recovery behavior for stateful services. | Failure-path, limit, health, and rollback/restore evidence as applicable. |

Use `templates/security-design-review.md` before implementation whenever the change introduces a new trust boundary or touches authentication, authorization, PII, payments, uploads, public writes, webhooks, third parties, tenant boundaries, admin functions, AI retrieval over customer data, migrations, or production data flows. Follow the package’s Always-Stop rules for decisions that require Founder approval.

## 9. Tests, observability, and completion evidence

- Write tests at the narrowest useful level: unit tests for pure domain logic, integration tests for boundaries and persistence, and E2E tests for material user journeys. A test should assert behavior, not implementation detail.
- Every bug fix receives a regression test when technically feasible. Every authorization-sensitive feature has a negative test. Every external event handler has replay/idempotency coverage when applicable.
- Test named unhappy paths: invalid input, missing resource, unauthorized access, dependency failure, empty state, and duplicate action. Verify public endpoints have bounded behavior under reasonable misuse.
- UI work requires rendered evidence at the agreed viewports, keyboard navigation verification, and relevant loading/error/empty-state evidence. Code inspection alone is insufficient.
- Use structured logs with correlation-friendly context, never raw secrets, passwords, tokens, payment information, or unnecessary PII. Add health checks and actionable error signals for deployable services.
- Before reporting completion, run the project’s fresh typecheck, lint, tests, build, and relevant E2E/security checks. Report exact commands, results, files changed, UI evidence, CIA controls touched, and remaining risks.

## 10. Agent ownership matrix (`company/` and `.claude/` paths)

Documented boundaries, not a runtime lock (Claude Code's hook payload doesn't
reliably expose which subagent issued a nested tool call, so this is enforced
by `code-reviewer`/`docs-sync` at review, not by a hook). Writing outside your
own area without a stated reason is a review finding.

| Path | Primary owner | Notes |
|---|---|---|
| `company/business-context.md`, `ceo-memory.md`, `decision-log.md` | `ceo` | Others read; only the CEO writes |
| `company/product/` | `product-manager` | PRDs, journeys, wireframe specs |
| `company/sprints/current/` (goal, backlog) | `team-lead` | Specialists append to `daily-log.md` only |
| `company/media/`, `company/social/` | `media-prompt-director` | Prompts, calendar, style guide |
| `company/feedback/` | `support-triage` | Clustered feedback log |
| `docs/adr/` | `system-architect` | Append-only; supersede, never edit |
| Database schema / migrations | `data-architect` (design) → owning backend agent (executes) | See `templates/database-migration.md` |
| `.claude/agents/`, `.claude/skills/`, `.claude/CLAUDE.md` | Founder-approved changes only | Any agent may propose; `code-reviewer` gates the merge |
| `.claude/company/.teamlead.lock` | `single-teamlead-lock.mjs` hook | Agents don't hand-edit; released by the Team Lead at sprint close |

## 11. Documentation and decisions

- Update the feature’s README, API contract, environment example, ADR, or runbook whenever the change alters a public interface, setup step, operational behavior, data flow, or architectural pattern.
- Record architecturally significant decisions in an ADR. Record smaller conventions or implementation decisions in the daily log. Do not create documentation that claims a behavior not verified in code.
- Keep comments sparse and valuable. Comments explain **why**, a security constraint, an external limitation, or a non-obvious trade-off; they never narrate obvious syntax.
- **`.claude/` package file-size discipline** (this applies to agents/skills/CLAUDE.md, not application code): agent files ~70 lines are the healthy range. `CLAUDE.md` is read every session regardless of task — anything only occasionally relevant belongs in an on-demand skill/doc with a one-line pointer, never restated in the hub. `docs-sync` flags drift at sprint close; `code-reviewer` flags it on `.claude/` PRs.
- **Model ceilings on mechanical agents**: `docs-sync` (haiku), `support-triage`/`content-marketing`/`a11y-auditor` (sonnet) carry an explicit `model:` value instead of `inherit` — this is the ONLY mechanism that actually controls a Task-dispatched subagent's model; "recommending" a model in the dispatch prompt does not (the subagent's own frontmatter decides, full stop). A ceiling is a hard cap: it never rises for a single unusually complex instance. **Fallback rule**: if a task for a capped agent is clearly beyond its ceiling's ability (e.g. reconciling docs across a major, HIGH-tier architecture change), the Team Lead routes that specific piece to an uncapped agent instead (`system-architect` for architecture-adjacent docs work, or a direct Claude pass) rather than accepting degraded output — the cap is about not overspending on routine cases, never about forcing a bad result through.
- **Agent count is governed by the `description:` FIELD token count, not file count or intuition.** Claude Code warns when combined subagent `description:` fields exceed 15,000 tokens — that field alone, not the full agent file body (which only loads when that agent actually runs). Before ever proposing to consolidate agents for "bloat," measure the real number (a short script summing `description:` field lengths) rather than eyeballing a directory listing — at 29 agents this package sits around 2,900 tokens, ~19% of the limit. Consolidating well-separated roles (e.g. merging distinct engines with an explicit split contract) to solve a token-count problem that measurement shows doesn't exist is a regression, not a fix. If the real number ever does approach the threshold, trim individual `description:` fields first — that's what the mechanism actually asks for.
- **Every skill is two files: `<name>.md` (lean) + `<name>-reference.md` (deep)**, not one flat file. `<name>.md` holds ONLY the title and the "load when…" trigger paragraph (5–10 lines — enough to confirm relevance, no more) and ends with a pointer to the reference file. Everything else — doctrine, tables, checklists, failure modes — lives in `<name>-reference.md`, read only once the skill is actually being used, not to decide whether it applies. New skills are authored this way from the start; `code-reviewer` rejects a new skill PR that puts substantive doctrine in the lean file. A skill needing an executable check (not just guidance) may add `scripts/<name>-<purpose>.sh` alongside it — optional, only where a script genuinely beats prose (e.g. a validation or linting step), never required.

## 12. Review blockers

Reject a change that introduces new JavaScript source; `any`; unvalidated ingress; duplicated contracts; business logic in a route or UI primitive; client-only authorization; secrets or sensitive data in code/logs/errors; unexplained token or styling deviations; missing user-facing states; an untested material behavior; fabricated verification; or a new repository pattern without a documented decision.
