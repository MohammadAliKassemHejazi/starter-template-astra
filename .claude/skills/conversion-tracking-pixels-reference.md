# Reference: conversion-tracking-pixels

Deep detail for `conversion-tracking-pixels.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Architecture decision first
- **GTM as the container** (one script, tags managed without redeploys) is the default; direct-inject GA4 only for the simplest sites.
- **Server-side tagging** (GTM server container / GA4 Measurement Protocol / Meta Conversions API) alongside browser pixels — browser-only tracking undercounts badly post-ATT and ad-blockers. Dedupe browser↔server by a shared `event_id`.

## GTM setup SOP
1. Create container; install the two snippets (head + noscript body) — via the framework's script strategy, consent-gated.
2. Variables: data-layer variables for the values events need (value, currency, item ids, user-consent state).
3. Triggers: fire on real events (form submit, purchase, CTA click) — not pageviews masquerading as conversions.
4. Tags: GA4 config tag + event tags; ad pixels as separate tags; ALL tags set to respect Consent Mode (below).
5. Use Preview mode + Tag Assistant to verify each tag fires with correct params BEFORE publishing; publish is a discrete, logged step.

## GA4 event tagging
- Event taxonomy mirrors the KPI tree (`dashboards-kpis.md`): `view_item`, `add_to_cart`, `begin_checkout`, `purchase` (with `transaction_id`, `value`, `currency`, `items`), `generate_lead`, `sign_up`.
- Event names are contracts — name once, version if shape changes; document them in the repo.
- Mark conversions in GA4; link to GSC and to Google Ads if used.

## Meta Pixel + Conversions API
- Base pixel via GTM (consent-gated); standard events matching GA4 semantics.
- **Conversions API** server-side for the same events with `event_id` dedupe; hash PII (email/phone) before sending — never raw.

## Custom conversions
Define per client goal (booking confirmed, quote requested); document the trigger, the value, and which platforms receive it; test end-to-end in each platform's debug view.

## Guardrails
Every tag is consent-gated via Consent Mode v2 (`cookie-consent-banners.md`) — a pixel firing pre-consent is a compliance breach. No PII in event params unhashed. Live ad-platform sending beyond test events aligns with the Always-Stop on ad spend. Provenance: verify each event in the platform's own debugger — never report "tracking works" from code inspection alone (`verification-discipline.md`).

## Common failure modes
Pixel fires before consent · browser+server double-count (no `event_id`) · unhashed email to Meta CAPI · conversion counting pageviews · GTM published without preview-testing · event renamed silently breaking historical reports.
