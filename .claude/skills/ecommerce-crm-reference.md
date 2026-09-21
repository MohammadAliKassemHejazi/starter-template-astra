# Reference: ecommerce-crm

Deep detail for `ecommerce-crm.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Payments (provider-agnostic doctrine, Stripe as reference)
- **Card data never touches the server** — hosted checkout or provider elements tokenize client-side; the backend sees tokens only. Receiving raw card fields in a request body = stop and escalate.
- **Webhook is the source of truth** for payment success — never the frontend callback. Verify signature on RAW body (mount raw parser before the JSON parser); dedupe by event ID; return 200 fast.
- **Idempotency keys** on every payment-creating call (`order-{id}-attempt-{n}`).
- **Money in integer minor units** (cents) end-to-end; format at display only.
- **Order state machine** (one-way): `pending → awaiting_payment → paid → fulfilled` with terminal `failed`/`refunded`; every transition audit-logged; `paid` set only by the webhook handler; sweep stale `awaiting_payment` after timeout.
- Refund path designed with the charge path, day one. Executing refunds = Always-Stop.

## CRM lifecycle
- **Lead model**: one owner, one stage at a time; stages: `new → contacted → qualified → proposal → won/lost`; every transition logged with timestamp + actor.
- **Routing rules are data** (config table: criteria → owner), not scattered conditionals; new rule = config change, not deploy.
- **Lifecycle automation hooks**: stage transitions emit events consumed by messaging automations (welcome sequence on `won`, nurture on `qualified` idle >7d) — via the event patterns in `brevo.md`/`whatsapp.md`.
- **Support automation**: ticket intake → classify (AI-assisted via ai-engineer's patterns) → route by rules → human handoff always available; SLA timers with escalation.
- Consent and communication preferences live on the customer record, checked by every outbound path — one suppression source of truth shared by email, SMS, and WhatsApp.

## Common failure modes
Frontend-confirmed payment without webhook confirmation · double fulfillment on webhook retry · lead owned by two reps after a routing change · automation emailing an unsubscribed-but-still-in-list contact · refund issued at provider but order still `paid` locally.
