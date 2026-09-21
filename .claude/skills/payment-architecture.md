# Skill: Payment Architecture (cart checkout + subscriptions, webhook-idempotent)

> **Required reading before touching any payment code — not optional.** This
> is the canonical pattern for this template's default architecture (Express
> + Sequelize + PostgreSQL + Stripe/PayPal). Money correctness bugs are
> Always-Stop-adjacent: a double-charge or a lost payment is exactly the
> class of mistake this pattern exists to make structurally impossible.

Two distinct lifecycles share one webhook discipline: **cart checkout**
(physical/digital items, inventory-bound) and **package subscriptions**
(memberships, no inventory). Both are driven by server-side webhook
verification — **never** a client-side redirect confirming a payment
succeeded, since that can be spoofed or simply missed.

The three non-negotiables: atomic inventory reservation with row-level
locks, raw-body signature verification on every webhook, and an idempotency
store keyed on the provider's own event ID so a retried webhook (which
providers do send, deliberately) never double-processes.

Full flow, the idempotency table shape, and failure modes:
`payment-architecture-reference.md`.
