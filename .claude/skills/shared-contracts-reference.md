# Reference: Shared Contracts (`@project/shared`)

Deep detail for `shared-contracts.md`. Read this when actually building or
reviewing a contract, not to decide whether the skill applies.

## Package layout
```
packages/shared/
├── src/
│   ├── contracts/
│   │   ├── api.ts          # ApiResponse<T>, PaginatedData<T> — the envelope types
│   │   ├── auth.ts         # AuthPayloads and other auth-adjacent DTOs
│   │   └── <domain>.ts     # CartCheckoutRequest, etc. — one file per domain, not per endpoint
│   ├── schemas/
│   │   ├── checkout.ts     # CartCheckoutSchema (z.object), CartCheckoutPayload (z.infer)
│   │   ├── auth.ts         # loginSchema, addressSchema
│   │   └── <domain>.ts
│   ├── enums/
│   │   └── index.ts        # OrderStatus, UserRole, PaymentType
│   └── index.ts             # central export hub — the only import surface either side uses
├── tsconfig.json
└── package.json
```
One domain concept = one file, mirrored from `css-architecture.md`'s BEM-like rule. Don't create a schema file per endpoint — `checkout.ts` holds every checkout-related schema, not just one.

## The pattern (schema → inferred type → both sides import the same thing)
```ts
// packages/shared/src/schemas/checkout.ts
import { z } from 'zod';

export const CartCheckoutSchema = z.object({
  shippingAddressId: z.string().uuid('Invalid address ID'),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  notes: z.string().max(500).optional(),
});
export type CartCheckoutPayload = z.infer<typeof CartCheckoutSchema>; // no duplicate interface
```

**Server** (`backend-node.md`), in `server/src/middlewares/`:
```ts
import { CartCheckoutSchema } from '@project/shared';

// validateBody(CartCheckoutSchema) drops invalid payloads before they reach the controller
router.post('/cart-checkout', validateBody(CartCheckoutSchema), cartController.checkout);
```

**Client** (`frontend-dev.md`), typically via React Hook Form:
```ts
import { CartCheckoutSchema, type CartCheckoutPayload } from '@project/shared';
import { zodResolver } from '@hookform/resolvers/zod';

const { register, handleSubmit } = useForm<CartCheckoutPayload>({
  resolver: zodResolver(CartCheckoutSchema), // the SAME schema instance the server enforces
});
```

If the backend changes what a field means or requires, the frontend's build breaks at compile time — the contract cannot silently drift, because both sides import the literal same package.

## The standard response envelope — a real exported type, not just documented JSON
```ts
// packages/shared/src/contracts/api.ts
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
export interface PaginatedData<T> {
  items: T[];
  pagination: { currentPage: number; pageSize: number; totalItems: number; totalPages: number };
}
```
Server's `responseStandardizer.middleware.ts` is typed against `ApiResponse<T>`; the client's Axios interceptor unwraps `ApiResponse<T>` once, centrally. Every handler and every caller narrows on `success`, never a bespoke shape per endpoint — and both sides fail to compile if the shape drifts, because it's one type, not two hand-maintained copies.

## What belongs in `@project/shared` vs what doesn't
**Belongs**: request/response DTOs and schemas, the `ApiResponse<T>`/`PaginatedData<T>` envelope, domain enums both sides must agree on (`OrderStatus`, `UserRole`, `PaymentType`), pure validation/formatting helpers with no I/O.
**Does NOT belong**: React components, Express middleware implementations, Sequelize models/ORM entities (a schema can be DERIVED from a DB model's shape, but the model itself is server-only — importing it into `packages/shared` would drop a Sequelize runtime dependency into a package the client also depends on), Redux slice state or component props, anything importing `react`, `express`, or `sequelize`.

## Versioning a contract (when a shape must change)
- **Additive only within a version**: new optional fields, yes; renamed/removed/retyped fields, no (`api-design.md`).
- A genuinely breaking change gets a NEW schema/type name (e.g. `CartCheckoutSchemaV2`) — never mutate a schema consumers already depend on in place; both `client` and `server` update together in the same PR, since they share the one package.
- Deprecate the old schema with a code comment + a daily-log/ADR note naming the sunset plan; `docs-sync` tracks it, and `server/swagger.json` reflects the change.

## Input validation rules (both sides, explicit)
- **Never trust `req.body`/`req.query`/`req.params` typed as `any`** — always `Schema.safeParse()` (backend) via the shared schema. This is what `docs/CONVENTIONS.md`'s "unvalidated ingress" review-blocker means concretely.
- **Frontend validates before the network call**, using the identical schema instance — not a hand-rolled parallel set of `if` checks that can drift from what the backend actually enforces.
- **Coerce at the boundary, not deep in business logic**: URL params are strings — `z.coerce.number()` in the schema, not a scattered `Number(req.params.id)` three files deep.
- **Validation errors are structured** — return which field failed and why (the `errors` array in `ApiResponse`'s error variant) so the frontend can show it inline, not just "something went wrong."
- Validate FILE uploads (MIME type, size) with the same schema-first discipline — never trust a client-reported `Content-Type`.

## Review checklist
- [ ] New/changed request or response shape lives in `@project/shared`, not hand-declared on one side
- [ ] Server middleware validates using the shared schema (`validateBody(...)`), not a local re-implementation
- [ ] Client form/API call imports the same schema/type — no parallel client-only validation logic
- [ ] `packages/shared` still has zero backend/browser runtime dependencies (no `sequelize`, `express`, or `react` import snuck in)
- [ ] A breaking change got a new schema name, not an in-place mutation
- [ ] `server/swagger.json` updated alongside the change

## Common failure modes
Type hand-written separately on each side out of habit (defeats the entire point — if this happens, the workspace linkage isn't being used) · Sequelize models or Express types imported into `packages/shared` (breaks the client build, or silently ships a server dependency to the browser bundle) · a breaking change made in place on a schema instead of getting a new name · `packages/shared` published/built stale so neither side actually sees the latest types (rebuild it as part of the same change, not a separate forgotten step) · frontend validation duplicating backend rules with a slightly different regex because someone hand-rolled instead of importing the shared schema.
