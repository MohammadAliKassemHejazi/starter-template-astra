# Reference: production-deployment-gsc

Deep detail for `production-deployment-gsc.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Phase 1 — Pre-deployment build & secret isolation
- Clean build from a clean tree: `tsc --noEmit` → `build` → tests all green (re-run, don't quote — `verification-discipline.md`).
- **Env separation is absolute**: production secrets live only in the host's secret store (Vercel/CF/AWS/Render dashboard), never in the repo, never in `NEXT_PUBLIC_*`, never in client bundles. Confirm `.env.example` lists every required var by NAME with no values.
- Grep the build output/bundle for leaked secrets before shipping (a key in a client chunk is a breach).
- Production config sanity: correct API base URLs, no `localhost`, no debug flags, source maps handled per policy.

## Phase 2 — SEO technical prerequisites (do BEFORE deploy, not after)
- **robots.txt**: allow crawl of public routes; disallow `/admin`, `/api`, `/checkout`, `/profile`, preview envs; reference the sitemap URL. (Framework-generated where possible — `next-sitemap`, etc.)
- **sitemap.xml**: generated at build (post-build hook), absolute URLs, `lastmod` accurate, excludes noindex/admin routes; regenerated every deploy.
- **Canonical + meta**: every page an absolute self-canonical (no trailing-slash or http/https duplicates); unique title (<60) + description (<160); Open Graph + Twitter tags; `robots` meta (`index,follow` public, `noindex` on thank-you/preview). Ties to `aeo-seo.md`.
- **Structured data** where applicable (Organization sitewide, Product/Article/BreadcrumbList) — validate in Google Rich Results test.

## Phase 3 — Cloud deployment (pick per client stack)
- **Vercel**: connect repo, set env per environment (Preview≠Production), preview deploys per PR; production deploy = Always-Stop. See `vercel.md`.
- **Cloudflare (Pages/Workers)**: `wrangler` config, bindings, secrets via `wrangler secret put`; deploy = Always-Stop. See `cloudflare.md`.
- **AWS**: IaC (CDK/SAM/Terraform), region pinned to client data-residency, budgets alarm first; any paid resource = Always-Stop. See `aws.md`.
- **Render**: `render.yaml` (web service + managed Postgres), health-check path, auto-deploy from branch (disable auto-deploy to prod until Founder-approved); env in dashboard. Ephemeral disk — uploads to object storage.
- Every host: a real **/health** endpoint, structured logging, and log retention configured (defaults are short or infinite — both wrong).

## Phase 4 — DNS & SSL
- **A record** → apex/IP (or ALIAS/ANAME where the host needs apex→hostname). **CNAME** → subdomain (`www`, `app`) to the host target. **TXT** for domain verification. Set **CAA** to authorize the cert issuer. Document every record in the repo (a checked-in `dns.md` export) so it's reproducible.
- Proxy/orange-cloud (Cloudflare) changes the exposed IP and adds CDN/WAF — coordinate, and make sure the WAF doesn't block webhook source IPs (Stripe/WhatsApp).
- **SSL/HTTPS**: host-managed cert (Let's Encrypt/ACM) — verify issuance, force HTTPS redirect, enable HSTS after confirming everything works on https, confirm no mixed content. Changing DNS/cert is client-visible — coordinate timing.
- **Propagation**: DNS TTL means changes aren't instant; verify with `dig`/host lookups from multiple resolvers before declaring done — don't trust one local check.

## Phase 5 — Google Search Console
1. **Add property**: Domain property (covers all subdomains + protocols — preferred) via **DNS TXT verification**; or URL-prefix property via **meta-tag / HTML-file / GA verification** when DNS isn't available.
2. **Submit sitemap**: `sitemap.xml` under Sitemaps; confirm "Success" and discovered URL count matches expectation.
3. **URL Inspection**: inspect the homepage + key routes → "Request indexing" for priority pages; confirm "URL is on Google" over the following days (indexing isn't instant — set that expectation).
4. **Coverage/Pages report**: watch for Excluded/Error reasons (noindex, canonical, crawl blocked) and fix at the source.
5. **Settings**: confirm crawler access, set the right property owners, connect GSC ↔ GA4 for query+behavior joins.
6. Hand off to `growth-seo-specialist` for ongoing query/CTR monitoring post-launch.

## Verification stamp (launch)
`build ✓ / secrets-isolated ✓ / robots+sitemap ✓ / DNS+SSL verified (dig, multi-resolver) ✓ / GSC property verified + sitemap submitted ✓`. No stamp → not launched.

## Common failure modes
Secret in a client bundle · sitemap listing admin/noindex URLs · missing canonical → self-competition · HTTPS forced before cert issued (outage) · WAF blocking payment webhooks · "indexed" claimed same-day (it isn't) · one-resolver DNS check hiding partial propagation · auto-deploy-to-prod left on.
