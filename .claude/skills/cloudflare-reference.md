# Reference: cloudflare

Deep detail for `cloudflare.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Platform facts
- **Workers**: V8 isolates, not Node — no `fs`, no long-lived state, 30s CPU ceiling (paid), cold-start-free. `nodejs_compat` flag covers many Node APIs but verify each dependency. Entry: `export default { fetch(request, env, ctx) }`. Workers are written in TypeScript (wrangler scaffolds TS; `Env` interface types all bindings) — never plain JS.
- **Storage picks**: **KV** = eventually-consistent key-value (config, cache — NOT counters or anything read-after-write); **R2** = S3-compatible objects, zero egress fees (media, backups); **D1** = SQLite at the edge (small relational, single-region writes); **Durable Objects** = strongly consistent single-instance state (counters, websockets, coordination).
- **Wrangler** is the toolchain: `wrangler dev` (local), `wrangler deploy` (Always-Stop — prepare, don't run), `wrangler secret put` for secrets (never in `wrangler.toml`).
- **DNS**: proxied (orange cloud) records get CDN/WAF; grey-cloud is DNS-only. Changing proxy status changes the exposed IP — client-visible, coordinate.
- **WAF/rules order**: custom rules → rate limiting → managed rules; first match can short-circuit. Test in "Log" action mode before "Block".
- **Caching**: respect origin `Cache-Control` by default; page rules/cache rules override; purge is global and takes seconds — but cache keys with query strings need explicit config.

## Integration doctrine
- Bindings (KV/R2/D1/DO/secrets) declared in `wrangler.toml`; typed via `Env` interface; never hardcode account IDs.
- Workers that call origin APIs: pass through auth headers explicitly; add a shared-secret header so the origin can verify the edge.
- R2 uploads from browser: presigned URLs from the Worker, never proxy file bytes through the Worker (CPU limits).
- Everything reproducible from config in the repo: `wrangler.toml` + DNS record export checked in.

## Common failure modes
Node dependency that silently breaks in isolates · KV used for read-after-write (stale reads) · secret committed in wrangler.toml · WAF rule blocking webhooks from platform IPs (WhatsApp/Stripe ranges) · cache serving stale API responses because Cache-Control missing at origin.
