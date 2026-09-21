# Reference: website-delivery

Deep detail for `website-delivery.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Outcome contract

Deliver an understandable, accessible, maintainable website that is **useful to its intended users, visually coherent, secure by design, and verifiably reliable**. Do not start implementation from an imagined design or API. First establish the product intent, the information architecture, the design-system contract, the trust boundaries, and the acceptance evidence.

For every MEDIUM or HIGH website task, produce or update the following artifacts in the repository. Keep each artifact concise and link it from the daily log.

| Artifact | Required content | Owner | Approval / review |
|---|---|---|---|
| Website brief | Goal, audience, scope in/out, conversion or task path, constraints, success signals | Team Lead with CEO | Founder for HIGH work |
| Website blueprint | Sitemap, route map, primary user journeys, content model, component map, responsive behavior | frontend-dev + css-scss-developer | Team Lead |
| Design-system contract | Personality, tokens, type scale, spacing, interaction states, accessibility decisions | css-scss-developer | Team Lead |
| Security design review | Data classification, trust boundaries, threats, CIA controls, residual risks | system-architect + security-auditor | Founder when Always-Stop applies |
| Verification plan | Acceptance criteria, automated tests, manual journeys, accessibility, performance, security evidence | qa-devops | Team Lead |

Use `templates/website-build-brief.md` and `templates/security-design-review.md`. LOW work updates only the directly affected artifact when a decision changes.

## Build in the correct order

1. **Understand.** Read `company/business-context.md`, existing ADRs, current routes, component patterns, and the relevant acceptance criteria. State what is known, unknown, and explicitly out of scope.
2. **Shape the experience.** Define the primary user journey before pages. Then define the sitemap, route responsibility, page sections, data each section needs, and each loading, empty, error, and permission-denied state.
3. **Set the design system.** Select or confirm the personality and tokens before styling components. Use semantic tokens, not raw values. Design desktop and mobile behavior intentionally; do not treat responsiveness as a final pass.
4. **Design the trust boundary.** Identify users, roles, data classification, external systems, entry points, and failure modes. Apply the CIA control matrix before implementation; resolve or escalate security design decisions before code.
5. **Build vertical slices.** Implement the smallest end-to-end slice that delivers a user outcome: route → feature boundary → validation → service/repository boundary → UI states → tests. Do not build disconnected piles of components or endpoints.
6. **Prove the outcome.** Run the verification plan fresh. Record reproducible evidence, including rendered UI evidence for UI changes. Do not mark a task Done because source code looks correct.

## Codebase shape

Preserve the host repository’s established structure when it already satisfies these rules. For a new TypeScript/Next.js website, begin with this logical shape; adapt names to the project without reversing dependency direction.

```text
src/
├── app/                     # route composition, layouts, route handlers only
├── features/                # business-oriented vertical slices
│   └── <feature>/
│       ├── components/      # feature-private UI
│       ├── schemas.ts       # input/output validation at the feature boundary
│       ├── types.ts         # feature-specific types; import shared contracts first
│       ├── service.ts       # use-case orchestration; no framework rendering logic
│       ├── repository.ts    # persistence/external I/O, when needed
│       ├── actions.ts       # server actions / adapters, when applicable
│       └── *.test.ts(x)     # tests beside the behavior they protect
├── components/
│   └── ui/                  # reusable, accessible, domain-neutral primitives
├── shared/                  # cross-feature contracts and pure utilities only
├── lib/                     # infrastructure clients, observability, configuration
├── config/                  # typed, validated, non-secret configuration
└── styles/                  # global tokens and intentionally global styles only
```

The dependency direction is **app → features → shared/lib**. A reusable UI primitive must not import a feature, route, server-only module, or business-specific data. A feature may use shared UI and contracts but must not reach into another feature’s private files. Route files compose and delegate; they do not accumulate business logic. Repository modules perform I/O; services implement use cases; schemas protect boundaries. If the project needs a different direction, record the reason in an ADR before creating an exception.

## Readable implementation rules

| Rule | Required practice |
|---|---|
| One responsibility | Keep each module focused on one clear job. Split files when two parts change for different reasons. |
| Locality | Put behavior, tests, schemas, and private components near the feature that owns them. Promote a module only after a real second use. |
| Explicit contracts | Validate untrusted input at every ingress. Share API/domain contracts instead of copying types. Make return and error behavior predictable. |
| Clear names | Prefer domain names that describe intent: `createBooking`, `BookingForm`, `bookingSchema`. Avoid vague names such as `utils`, `helpers`, `data2`, or `handleThing`. |
| Small interfaces | Pass the smallest typed data a component or function needs. Do not pass a database row or a giant context object by default. |
| Honest comments | Explain **why**, a security constraint, or a non-obvious trade-off. Delete comments that merely repeat the code. |
| Consistent error paths | Use the project error model; handle expected failure close to the user boundary and log operational detail without secrets or PII. |
| No hidden behavior | Avoid implicit global mutation, unbounded retries, silent fallback data, and environment-dependent branching without an explicit configuration seam. |

## CIA security baseline

Treat the CIA triad as design requirements, not a final audit. OWASP ASVS provides requirements for secure development and verification, while NIST SSDF organizes secure development around preparation, protection, secure production, and vulnerability response.[1][2]

| Objective | Design requirement | Minimum controls | Evidence before Done |
|---|---|---|---|
| **Confidentiality** | Only authorized actors can view sensitive data or secrets. | Data classification and minimization; server-side authorization on every object access; tenant scoping; secret isolation; secure transport; PII-safe logs/errors; least-privilege integration access; no sensitive data in client state unless necessary. | Data map; authorization test including cross-user/tenant denial; secret scan; reviewed log/error behavior. |
| **Integrity** | Data, actions, and content remain accurate, authorized, and resistant to tampering. | Schema validation at ingress; parameterized data access; CSRF protection where cookie sessions change state; output encoding/sanitization; idempotent external-event handling; optimistic concurrency or versioning where overwrite risk exists; auditable privileged actions. | Invalid-input and authorization tests; tamper/replay test where relevant; contract tests; audit-log verification for privileged behavior. |
| **Availability** | The user-facing service behaves predictably and recoverably under expected failure and misuse. | Timeouts and bounded retries; rate/size limits on public interfaces; graceful loading/error/empty states; health checks and structured logs; dependency-failure behavior; backup/restore and rollback plan for stateful systems; performance budgets appropriate to the task. | Failure-path test; health/observability evidence; rate-limit or size-limit test when exposed; restore/rollback evidence for data-bearing systems. |

### Risk triggers that require a security design review

Create or update the security design review before implementation when work introduces authentication, authorization, payments, PII or sensitive business data, file uploads, public write endpoints, webhooks, third-party integrations, multi-tenancy, admin functions, AI retrieval over customer data, data migration, or a new production data flow. These changes remain subject to the package’s Always-Stop rules.

Apply secure defaults: deny access until an explicit server-side rule allows it; collect the least data needed; make sensitive features opt in; use bounded resource consumption; and make safe behavior the easy path for users and developers. This approach aligns with CISA’s expectation that providers treat security as a core product requirement rather than an optional feature.[3]

## Design quality is a functional requirement

A good website is not a pile of polished screens. Each route must have a clear hierarchy, a primary user action, purposeful content, responsive behavior, and accessible interaction states. Require the following at implementation and review:

- Semantic landmarks, heading order, labelled controls, keyboard navigation, visible focus, error announcements, and reduced-motion support.
- A defined mobile behavior for every layout rather than a generic shrink-to-fit rule.
- Tokens for color, typography, spacing, elevation, radius, motion, and z-index; no arbitrary values outside documented exceptions.
- Explicit loading, empty, error, unauthorized, and unavailable states for every user-visible asynchronous data path.
- Responsive screenshots at the agreed viewport set, plus a keyboard and screen-reader-oriented check for material UI work.

## Required completion report

Report only facts verified from the repository and fresh runs. Include the user outcome, changed routes/features, implementation decisions, CIA controls touched, validation commands and results, UI evidence, remaining risks, and the standard verification stamp. If an item is intentionally deferred, identify its owner, risk, and planned decision point; do not describe it as complete.

## References

[1] [OWASP Application Security Verification Standard 5.0.0](https://owasp.org/www-project-application-security-verification-standard/)

[2] [NIST Secure Software Development Framework](https://csrc.nist.gov/projects/ssdf)

[3] [CISA Secure by Design](https://www.cisa.gov/securebydesign)
