# Skill: Shared Contracts (`@project/shared`)

> Load whenever a feature crosses the client↔server boundary — a new
> endpoint, a changed payload shape, or a form that submits to an API. This
> template's canonical architecture is an npm/yarn workspace monorepo with a
> dedicated `packages/shared` package (`@project/shared`) — pure TypeScript,
> zero runtime backend or browser dependencies — that both `client` and
> `server` depend on via `"@project/shared": "workspace:*"`. This is what
> makes API drift a compile-time error on both sides, not a discipline
> problem: change a shape in `@project/shared` and whichever side hasn't
> been updated fails to build.

## The rule in one sentence
**Zod schemas in `packages/shared/src/schemas/` are the source of truth; TypeScript types are inferred from them (`z.infer<>`), never hand-written twice. Both `client` and `server` import from `@project/shared` and validate against the SAME schema instance** — backend because it must never trust the network, frontend because users need fast, friendly errors before a request is even sent.

## What's shared vs what stays local
| Shared in `@project/shared` | Local to client or server |
|---|---|
| Request & response DTOs (`contracts/`) | Sequelize ORM models (server) |
| Zod form/API schemas (`schemas/`) | Express `req.user` types (server) |
| Business & status enums (`enums/`) | Redux slice state types (client) |
| Pure math/formatting helpers | React component props (client) |

Nothing backend- or browser-specific ever enters `packages/shared` — that's what keeps it importable by both sides with zero dependency conflicts.

## Dual validation (both sides, always — not redundant, it's defense in depth)
- **Frontend validates on submit** using the shared Zod schema (typically via React Hook Form + `@hookform/resolvers/zod`) — fast feedback, no round-trip needed to catch a bad email format.
- **Backend validates on receipt** using the SAME shared schema, in Express middleware — because client-side validation can always be bypassed (devtools, curl, a compromised client) and the backend is the actual trust boundary.

Full folder layout, the DTO/schema/enum pattern, the standard `ApiResponse<T>` envelope, and the review checklist: `shared-contracts-reference.md`.
