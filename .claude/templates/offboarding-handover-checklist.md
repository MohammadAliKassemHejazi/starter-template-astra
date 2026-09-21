# Client Offboarding & Asset Handover — <client>

**Initiated:** YYYY-MM-DD | **Owner:** ceo | **Target completion:** YYYY-MM-DD
**Reason:** Project complete / Contract ended / Client-requested transfer

> Mirrors the onboarding interview in reverse. Every item transfers OWNERSHIP
> or ACCESS to the client, not just a copy — the goal is the client fully
> controls their own assets with zero dependency on this team afterward.
> Irreversible/access-losing steps are ⛔ Founder-confirmed before executing.

## 1. Domain & DNS
- [ ] Domain registrar: transferred to client's own account (or client already owns it — confirm)
- [ ] DNS records exported and documented (`production-deployment-gsc-reference.md`'s `dns.md` if used)
- [ ] CDN/proxy (Cloudflare etc.) ownership transferred to client account
- [ ] ⛔ Confirm: agency no longer holds registrar/DNS admin access after transfer

## 2. Search & analytics
- [ ] Google Search Console: client added as Owner, agency access removed (or kept read-only only if client requests)
- [ ] GA4 / analytics: ownership transferred, agency access removed or downgraded
- [ ] Any SEO tool subscriptions (rank trackers etc.): cancelled or transferred

## 3. Hosting & infrastructure
- [ ] Cloud account (Vercel/AWS/Cloudflare/Heroku) billing ownership transferred to client
- [ ] Agency's admin/deploy access removed after transfer confirmed working
- [ ] Infra-as-code / repo access transferred (client owns the GitHub org/repo)
- [ ] Database access: client has their own credentials; agency's are revoked

## 4. Mobile signing credentials (irreplaceable if lost — handle with care)
- [ ] Android: keystore (`.jks`) file + password handed to client, verified they can open it; agency's copy deleted after confirmation (a lost keystore means the app can NEVER be updated again — `mobile-store-release-reference.md`)
- [ ] iOS: distribution certificate + provisioning profile ownership transferred in App Store Connect; agency removed as a team member after confirmed
- [ ] App Store Connect / Google Play Console: client is Account Holder, agency access removed

## 5. Third-party API keys & integrations
- [ ] Every API key used in the project inventoried (Stripe, WhatsApp, Brevo, Gemini, DeepSeek, etc.)
- [ ] Each key: client generates their OWN new key, project's env vars updated to it
- [ ] Agency's keys revoked/deleted (never left active "just in case")
- [ ] Webhook endpoints re-pointed if any pointed at agency-owned infrastructure

## 6. Secrets & environment
- [ ] `.env` values in the client's own secret store (not agency's), rotated if the agency ever saw them in plaintext
- [ ] Any agency-owned service accounts / OAuth grants revoked

## 7. Documentation handover
- [ ] README, ADRs, runbooks (`backup-disaster-recovery-reference.md`, `incident-postmortem.md` history) delivered
- [ ] `company/business-context.md` and decision history summarized for the client (not raw internal files)
- [ ] Final architecture overview if the client has in-house engineers taking over

## 8. Confirmation
- [ ] Client confirms, in writing, they can independently: deploy, access hosting, access domain/DNS, access analytics, and update the mobile app (if applicable)
- [ ] ⛔ Founder sign-off that all agency access has been removed — this project's data/access is fully isolated from the agency's other clients from this point forward (guardrail 6)

## Post-offboarding
- [ ] `company/` files for this client archived per the Founder's retention policy, then access to them removed from active tooling
