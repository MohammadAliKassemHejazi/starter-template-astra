# Reference: dashboards-kpis

Deep detail for `dashboards-kpis.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Metrics before charts
- **KPI tree first**: north-star metric → 3–5 drivers → input metrics per driver. A dashboard without a tree is chart soup.
- **Metric definitions doc** (`company/metric-definitions.md`): name, exact formula/SQL, grain, owner, refresh cadence. One source of truth — when two dashboards disagree, this doc arbitrates.
- Vanity-metric filter: every metric must answer "what decision changes if this moves?" — no answer, no chart.

## Dashboard design
- 5-second rule: state of the business readable in 5 seconds — headline KPIs top-left, trends below, detail behind clicks.
- Every number gets **comparison context**: vs prior period, vs target, or trend — a naked number is decoration.
- Data freshness stamped visibly ("as of 07:00 UTC"); stale data flagged, not hidden.
- Tool pragmatism: Metabase (self-hosted, free) covers most SMB clients; custom Next.js + charts when it's client-facing product; BI platform licenses = grooming cost item.

## Reporting automation
Scheduled report = dashboard snapshot + 3 written insights (what moved, why, what we recommend) — numbers without narrative get ignored. Delivery via Brevo/WhatsApp flows (sandbox rules apply) or `documents.md` for board-grade PDFs.

## Guardrails
Client-facing dashboards sit behind auth (a public Metabase link with revenue data is a breach) · cross-client benchmarks only from public data — never another client's numbers (isolation guardrail).
