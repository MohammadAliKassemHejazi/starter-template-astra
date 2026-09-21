# Reference: compliance-extended

Deep detail for `compliance-extended.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Pick the regime(s) from the client
Stated in `business-context.md`. Don't apply HIPAA to a marketing site or SOC 2 to a hobby app — match controls to real obligations.

## HIPAA (US health data — PHI)
- Applies when handling Protected Health Information for a covered entity/business associate. **BAA required** with the client and with every subprocessor that touches PHI (hosting, email, AI APIs) — no BAA, no PHI flows there (Always-Stop before it does).
- Controls: encryption in transit + at rest, strict access controls + unique user IDs, audit logging of PHI access, automatic logoff, minimum-necessary access, data-integrity controls. PHI never in logs, analytics, error payloads (`sentry-triage` scrubbing), or LLM prompts without a compliant path.
- Breach notification obligations are stricter than GDPR — the path exists before launch.

## SOC 2 (Trust Services Criteria — security, availability, confidentiality, processing integrity, privacy)
- It's an AUDIT of controls over time, not a code checkbox. We build the technical evidence: access control + least privilege, change management (our PR/review/merge chain already is this), encryption, monitoring + alerting (`uptime-monitoring-alerting.md`), backup + tested recovery (`backup-disaster-recovery.md`), vendor management, incident response.
- Map each implemented control to the criterion it satisfies; keep evidence (logs, configs, runbooks) auditors will ask for. Type I = point in time; Type II = over a period (needs sustained evidence).

## CCPA / CPRA (California)
- Opt-OUT model (vs GDPR opt-in): a clear "Do Not Sell or Share My Personal Information" path; honor Global Privacy Control (GPC) browser signals; disclose categories collected/sold/shared; consumer rights (know/delete/correct/opt-out) implemented + tested. Ties to `cookie-consent-banners.md` (which already handles GPC + regional modes).

## OSS license compliance (ship-blocking if ignored)
- **Automated scanning** in CI: license-checker / FOSSA-style / `license-checker` for npm, and equivalent per ecosystem — fail the build on a disallowed license.
- **Know the buckets**: permissive (MIT, Apache-2.0, BSD, ISC) → generally fine; weak-copyleft (MPL, LGPL) → usually fine with care; strong-copyleft (GPL, AGPL) → can force disclosure of YOUR source, especially AGPL for SaaS — flag to Founder before adoption (Always-Stop for a strong-copyleft dep in proprietary client code).
- Maintain a dependency license inventory; attribute where required (NOTICE file); re-scan on every dependency change (ties to `git-workflow-discipline.md` review).

## Output
Per regime: a controls checklist (control · status · owner · evidence location · gap), mapped to the criteria/rules, delivered via `documents.md` for the client-facing version. Always state: "we implement and evidence controls; legal certification/attestation is the client's counsel/auditor's determination."

## Guardrails
Sending regulated data (PHI, etc.) to any subprocessor/AI API without the required agreement + safeguards = Always-Stop. No legal advice — technical implementation + evidence only. A strong-copyleft/AGPL dependency in proprietary code stops for Founder decision. Isolation: one client's compliance evidence never mixes with another's.

## Common failure modes
PHI in logs/analytics/LLM prompts · subprocessor without a BAA · SOC 2 "done" as a checkbox instead of sustained evidence · GPC ignored for CCPA · AGPL dependency discovered after launch · license scan not in CI (disallowed license ships) · treating GDPR controls as sufficient for HIPAA.
