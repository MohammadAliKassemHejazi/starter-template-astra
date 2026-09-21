# Reference: payment-architecture

Deep detail for `payment-architecture.md`. Read before implementing or
reviewing any checkout, subscription, or webhook code.

## Flow 1: Cart checkout (physical/digital items)
1. Client: `POST /api/payments/cart-checkout`.
2. **Atomic inventory reservation** — verify stock and place it into
   `status: PENDING_PAYMENT` using a PostgreSQL row-level lock
   (`SELECT ... FOR UPDATE`) inside the same transaction that creates the
   reservation. This is what prevents two simultaneous checkouts from both
   reserving the last unit of stock — without the lock, both reads see
   "1 available" and both proceed.
3. Attach a **TTL to the reservation** (a few minutes, tuned to the checkout
   flow's real length) so an abandoned checkout releases the stock back
   rather than hoarding it indefinitely. A scheduled job or a check-on-read
   pattern expires stale `PENDING_PAYMENT` reservations.
4. Create a Stripe `PaymentIntent` with metadata `{type: 'cart', orderId, userId}` —
   the metadata is what the webhook handler uses to route processing later;
   it is not optional decoration.
5. Client: Stripe Elements collects payment details — the server never sees
   raw card data.

## Flow 2: Package subscriptions (memberships)
1. Client requests a subscription intent for a specific plan tier.
2. Create a `PaymentIntent` with metadata `{type: 'package', packageId, userId}`.
3. No inventory reservation — subscriptions aren't stock-bound, so this flow
   is simpler than cart checkout by design; don't add inventory logic here.

## Webhook processing — the part that actually has to be correct
Payment execution relies **strictly** on this server-side path. A client
redirecting to a "success" page proves nothing — it proves the browser
navigated, not that Stripe/PayPal actually confirmed the charge.

1. **Raw body signature verification.** Verify every webhook against the
   *raw* request payload using `stripe.webhooks.constructEvent(rawBody, sig, secret)`
   (PayPal's equivalent verification for its own webhooks). This requires the
   raw body to reach the handler unparsed by a global JSON body-parser —
   configure the webhook route to receive the raw buffer, not the already-
   parsed object, or signature verification silently fails.
2. **Idempotency check, before any processing.** Every event carries its own
   `event.id` from the provider. Check it against an `IdempotentEvents` table
   (`{eventId (unique), processedAt, type}`):
   - **ID already exists** → respond `200 OK` immediately, do nothing else.
     Providers deliberately retry webhooks (network hiccups, slow 200s,
     etc.) — this is not a bug to fix, it's an expected delivery guarantee
     the idempotency store exists specifically to absorb.
   - **ID is new** → proceed, inside one atomic PostgreSQL transaction.
3. **Transactional execution** (all of this in one transaction — partial
   application on failure is exactly what this prevents):
   - **Cart payments**: decrement stock *permanently* (the reservation from
     step 2 above becomes real), mark the order `PAID`, clear the user's
     active cart, insert the `event.id` into `IdempotentEvents`.
   - **Package payments**: activate the plan in `UserPackages`, set the
     expiration date, insert the `event.id` into `IdempotentEvents`.
   - **Any step fails → the whole transaction rolls back**, including the
     idempotency insert — a failed attempt must be retryable on the next
     webhook delivery, not permanently marked as "already handled."

## Common defects this pattern exists to prevent
- Trusting a client-side "payment succeeded" callback instead of the webhook
  — the single most common real-world payment vulnerability.
- Parsing the webhook body as JSON before signature verification (breaks the
  raw-body requirement, verification fails or — worse — gets bypassed with a
  permissive fallback).
- Checking inventory without a row lock (`SELECT` then `UPDATE` as two
  separate statements) — a race condition, not a rare edge case, under any
  real concurrent traffic.
- Inserting the idempotency record *before* the transaction that uses it
  commits — if the transaction later fails, the event is now wrongly marked
  processed and will never be retried.
- No TTL on `PENDING_PAYMENT` reservations — abandoned checkouts silently
  lock up inventory forever.

## Review checklist
- [ ] Inventory reservation uses `SELECT ... FOR UPDATE` inside a transaction
- [ ] Reservation has a TTL and an expiry path
- [ ] Webhook route receives the raw body (verify this explicitly — it's the
      most common way this pattern breaks silently)
- [ ] Signature verified before any processing, using the provider's SDK method
- [ ] `IdempotentEvents` checked first; early-return `200 OK` on a repeat
- [ ] All state changes (stock, order status, cart clear / plan activation,
      idempotency insert) happen inside one transaction with rollback on any failure
- [ ] Metadata (`type`, `orderId`/`packageId`, `userId`) set at PaymentIntent
      creation and actually used to route the webhook handler
