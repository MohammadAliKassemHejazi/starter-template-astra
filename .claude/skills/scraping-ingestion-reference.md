# Reference: scraping-ingestion

Deep detail for `scraping-ingestion.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Legality & ethics gate (before any code)
Public pages only — never circumvent logins, paywalls, or anti-bot walls · respect robots.txt and ToS (a ToS-prohibited scrape is a client legal risk → flag in grooming) · no harvesting of personal data (profiles, emails, phones) — that's a GDPR incident, not a feature · prefer official APIs/feeds when they exist, always.

## Technique picks
- Static HTML → `fetch` + cheerio (cheap, fast). JS-rendered → Playwright (headless). All scraper/ingestion code is TypeScript (`tsx` for scripts) — schemas typed end-to-end. Feeds/sitemaps first — they're the polite, stable path.
- Rate limiting: 1 req/s default, exponential backoff on 429/5xx, identify with a honest User-Agent. Concurrency per-domain capped.
- Extraction to **zod-validated schemas** — scraped data is untrusted input like any other; parse, don't trust.

## Ingestion doctrine
- Idempotent + re-runnable: content-hash per page/item; skip unchanged, upsert changed, tombstone removed (deletion must propagate to the RAG index — see `rag-advanced.md`).
- Change detection log: what changed per run (new/updated/removed counts) → daily log.
- Scheduling via n8n or cron; every job has failure alerting, not silent staleness.
- Provenance stored per record: source URL + fetch date — answers citing scraped facts cite the source.

## Common failure modes
Selector broke silently (page redesign) → zero-row alert thresholds · scraping the rendered locale/currency you didn't expect · duplicate items from pagination overlap · stale index because deletions never propagated.
