# Reference: whatsapp

Deep detail for `whatsapp.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Platform facts that shape every design
- **Cloud API** (Meta-hosted) is the default; On-Premises API is deprecated. Base: `graph.facebook.com/v-latest/{phone-number-id}/messages`.
- **24-hour customer service window**: after a customer's last message you have 24h of free-form replies. Outside the window you can ONLY send pre-approved **template messages**. Every flow must model this — check window state before choosing message type.
- **Templates** require Meta approval (minutes to 24h+). Categories: utility, marketing, authentication — category affects pricing and approval strictness. Named placeholders `{{1}}`; buttons: quick-reply, URL, call. Template rejections are common → keep copy factual, no spam patterns.
- **Interactive messages** inside the window: reply buttons (≤3), list messages (≤10 rows), **WhatsApp Flows** (structured multi-screen forms — the tool for booking/lead-capture).
- **Opt-in is mandatory** (Meta policy + GDPR): store consent with timestamp + source; provide opt-out honored in code (STOP keyword handling).
- **Pricing is per-conversation** (24h buckets by category), not per message — batching within a window is free; new template pings are not.

## Integration doctrine
- Webhook receiver: verify `X-Hub-Signature-256` (HMAC-SHA256 of raw body with app secret) BEFORE parsing. Respond 200 within seconds; process async.
- Dedupe by `messages[].id` — Meta retries aggressively.
- Message send: queue with per-number rate limiting (limits scale with quality rating; assume 80 msg/s ceiling, much lower for new numbers).
- Quality rating protection: high block/report rates throttle or ban the number. Marketing template volume ramps gradually; never blast a cold list.
- State per customer: `{ waId, windowExpiresAt, consentStatus, activeFlowState, lastTemplateSent }` — the minimum viable conversation record.
- Test numbers: Meta provides test numbers in the app dashboard; ALL development happens there until the Founder approves live.

## Common failure modes
Template sent inside window when free-form was available (wasted cost) · free-form attempted outside window (silent 131047 error) · webhook processed twice · flow with no human-handoff exit · consent checked at send time but not stored.
