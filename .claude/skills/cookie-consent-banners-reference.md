# Reference: cookie-consent-banners

Deep detail for `cookie-consent-banners.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Principles (GDPR + CCPA/CPRA)
- **GDPR (EU/UK): prior opt-in** — non-essential tags (analytics, ads, personalization) load ONLY after explicit accept; reject must be as easy as accept; no pre-ticked boxes; consent is logged (who/when/text-version).
- **CCPA/CPRA (California): opt-out** — a clear "Do Not Sell or Share My Personal Information" path; honor Global Privacy Control (GPC) signals.
- Essential/strictly-necessary cookies (auth/session/security) may load without consent; nothing else.
- Consent state is DB/stored truth, checked by every outbound tag and (per `gdpr-compliance.md`) shared with email/SMS/WhatsApp suppression as one source of truth.

## Consent Mode v2 (Google) — mandatory for Google tags in the EEA
- Set **default consent = denied** for `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization` BEFORE any Google tag loads.
- Banner accept → `gtag('consent','update',{...'granted'})`; reject leaves denied.
- With v2, Google tags load in a cookieless/pinged mode when denied (modeling) and full mode when granted — wired through GTM so every Google tag inherits it.

## Consent manager integration
- **Cookiebot** (CMP, auto cookie scan + blocking, Consent Mode integration) — strong default for compliance-heavy clients.
- **Klaro** (open-source, self-hosted, no per-domain fee, good for AstraSyntx-owned control) — default when the client wants ownership.
- Either way: the CMP must (a) block non-essential scripts pre-consent, (b) drive Consent Mode v2, (c) log consent, (d) expose a re-open control so users can change their choice.

## Setup SOP
1. Choose CMP (compliance depth → Cookiebot; ownership/cost → Klaro); paid CMP plans = grooming cost item.
2. Categorize every cookie/tag (essential / analytics / ads / personalization) — the cookie inventory feeds the `gdpr-compliance.md` data map.
3. Implement default-denied Consent Mode v2, then the banner, then wire GTM tags to consent categories.
4. Verify with the browser devtools + Tag Assistant: NOTHING non-essential fires before accept; reject truly blocks; GPC honored; choice persists and is re-openable.

## Guardrails
A tag firing before consent is a breach — test it, don't assume it. Banner copy and legal text are the client's counsel's call; we implement, we don't give legal advice (say so). Consent logs contain personal data — retention + access controlled.

## Common failure modes
Consent Mode defaults set AFTER Google tag load (too late) · reject button that doesn't actually block · GPC ignored · analytics counted as "essential" · consent not logged · no way for users to change their mind · banner blocking the page for screen readers (a11y).
