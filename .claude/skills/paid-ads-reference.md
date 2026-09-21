# Reference: paid-ads

Deep detail for `paid-ads.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Hard rule first
Launching campaigns, changing budgets, or ANY ad spend = **Always-Stop**. The team builds structure, creative, and tracking; the Founder/client presses every money button.

## Campaign structure (Meta & Google share the shape)
`Campaign (objective + budget) → Ad set/group (audience + placement) → Ads (creative)`. One variable tested per level — audience tests at ad-set level, creative tests at ad level; changing both at once teaches nothing.

## Tracking (where agencies actually add value)
- **Server-side events** (Meta Conversions API / GA4 Measurement Protocol) alongside the pixel — browser-only tracking undercounts badly post-ATT; dedupe via event IDs.
- Conversion events mirror the KPI tree (`dashboards-kpis.md`): purchase/lead/booking with value — not pageviews.
- **UTM discipline**: fixed schema (`utm_source/medium/campaign/content`) enforced everywhere links are generated (including WhatsApp/Brevo flows) so attribution survives.
- Consent-gate all of it: pixels and CAPI fire only after consent (`gdpr-compliance.md`).

## Creative & analysis doctrine
Creative testing matrix: 3 hooks × 2 formats beats 6 unrelated ads · report CAC and ROAS against target, never clicks/impressions as headlines · kill rules pre-agreed (spend > X with 0 conversions → pause recommendation) · learnings feed `viral-trends.md` idea cards — paid and organic share hooks.
