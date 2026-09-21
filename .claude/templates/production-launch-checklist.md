# Production Launch Checklist — <client / project>

**Launch date (target):** YYYY-MM-DD | **Owner:** <agent> | **Approver:** Founder
**Runbook:** `skills/production-deployment-gsc.md` (this checklist is its interactive companion)

> Deploying to prod, buying the domain/plan, and taking messaging/payments live
> are **Always-Stop** — the team completes every prep step; the Founder gives the
> explicit go for each gated ⛔ item. Check nothing you haven't actually verified
> (`verification-discipline.md`) — no box ticked from assumption.

## 1. Build verification
- [ ] Clean tree; `tsc --noEmit` ✓ (re-run, not quoted)
- [ ] `build` ✓ from clean
- [ ] All tests ✓ (re-run; count from actual run)
- [ ] Bundle within budget; no unexpected regression (`performance-benchmarking.md`)
- [ ] Core Web Vitals pass on mid-tier mobile (LCP<2.5s / CLS<0.1 / INP<200ms)

## 2. Secrets & config
- [ ] Prod secrets ONLY in host secret store — none in repo, none in `NEXT_PUBLIC_*`
- [ ] Bundle grep: no secret leaked into client chunks
- [ ] `.env.example` complete (names only); prod config has no localhost/debug flags

## 3. SEO technical prerequisites
- [ ] `robots.txt` correct (public allowed; admin/api/checkout/preview disallowed; sitemap referenced)
- [ ] `sitemap.xml` generated at build, absolute URLs, excludes noindex/admin
- [ ] Canonicals absolute + self-referential; unique titles(<60)/descriptions(<160); OG/Twitter tags
- [ ] Structured data validated (Rich Results test)

## 4. Cloud deployment ⛔ (prep now; Founder approves the prod deploy)
- [ ] Host configured (Vercel / Cloudflare / AWS / Render) with per-env vars (Preview ≠ Production)
- [ ] `/health` endpoint live with real dependency checks; logging + retention configured
- [ ] Auto-deploy-to-prod disabled until go; rollback command documented (`backup-disaster-recovery.md`)
- [ ] ⛔ Founder approval to deploy to production: __________

## 5. DNS & SSL
- [ ] A / CNAME / TXT / CAA records set and checked into repo (`dns.md`)
- [ ] Propagation verified via `dig` from MULTIPLE resolvers (not one local check)
- [ ] SSL cert issued; HTTPS forced; HSTS enabled after verify; no mixed content
- [ ] WAF/proxy not blocking payment/messaging webhook source IPs

## 6. Google Search Console
- [ ] Property added + verified (Domain property via DNS TXT preferred)
- [ ] `sitemap.xml` submitted; "Success" + discovered-URL count sane
- [ ] Homepage + key routes inspected → "Request indexing" (indexing is NOT instant — expectation set)
- [ ] GSC ↔ GA4 linked; handoff to `growth-seo-specialist` scheduled

## 7. Analytics, tracking & consent
- [ ] Consent banner + Consent Mode v2 default-denied BEFORE any tag (`cookie-consent-banners.md`)
- [ ] GTM/GA4 events fire ONLY after consent — verified in Tag Assistant, not assumed
- [ ] Conversion events tested end-to-end in each platform's debugger (`conversion-tracking-pixels.md`)
- [ ] No PII sent unhashed; browser↔server dedupe via `event_id`

## 8. Monitoring, backup & recovery
- [ ] Uptime synthetics (public + `/health` + one critical path), multi-region (`uptime-monitoring-alerting.md`)
- [ ] Slack/Discord alerting wired + test-fired + recovery notice verified
- [ ] SSL/domain-expiry monitors on
- [ ] Automated DB snapshots + PITR enabled; a real restore test passed (`backup-disaster-recovery.md`)
- [ ] Rollback runbook (code + data + migration) linked from alerts

## 9. Go / No-Go
- [ ] Security-auditor sign-off if auth/payments/PII in scope
- [ ] qa-devops PASS incl. UI screenshots
- [ ] docs-sync: READMEs/contracts/env current
- [ ] Launch verification stamp: `build ✓ / secrets ✓ / robots+sitemap ✓ / DNS+SSL (multi-resolver) ✓ / GSC verified+submitted ✓ / consent-gated tracking ✓ / monitoring+backup ✓`
- [ ] ⛔ Founder final GO: __________
