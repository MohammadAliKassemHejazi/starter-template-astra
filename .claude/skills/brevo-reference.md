# Reference: brevo

Deep detail for `brevo.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Platform facts
- Two send paths: **transactional** (API v3 `smtp/email` endpoint or SMTP relay — order confirmations, resets) and **campaigns** (marketing blasts to lists). Never send marketing through the transactional path — deliverability and compliance both break.
- API key in `api-key` header. Separate keys per environment; live keys are Always-Stop config.
- **Contacts**: attributes are typed and account-global (define once, reuse); lists for membership, segments for dynamic filters. Upsert via `POST /contacts` with `updateEnabled: true`.
- **Automation workflows**: entry triggers (event, list join, page visit), delays, conditions, email/SMS steps. Events pushed via `POST /events` (track API) — event names are contracts, version them (`order_placed_v1`).
- **Webhooks**: delivered/opened/clicked/bounced/spam per message; verify by restricting to Brevo IPs or a shared-secret query param (Brevo lacks HMAC signing — compensate with an allowlist).
- **Sender authentication**: SPF + DKIM on the sender domain before any real sending; unauthenticated senders land in spam. Domain setup is a client-side DNS task → prepare records, hand to Founder.

## Integration doctrine
- Typed client wrapper around the SDK; template IDs and list IDs in config, never inline.
- Transactional sends: idempotency by your own message reference; log Brevo `messageId` for delivery tracing.
- Bounce/spam webhook updates local consent state — a hard-bounced or complaining address is never emailed again.
- SMS: sender name rules vary by country (alphanumeric sender IDs illegal in some); check per client market.
- Sandbox: use a test list containing only team addresses; campaign sends to real lists are Always-Stop.

## Common failure modes
Marketing sent via transactional path · attribute name collisions across clients' conventions · automation triggered by unversioned event that changed shape · missing DKIM → silent spam-folder delivery · suppression list ignored on re-import.
