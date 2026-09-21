# Reference: gdpr-compliance

Deep detail for `gdpr-compliance.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## The data map (start here, always)
Inventory per system: what PII · where stored (DB tables, logs, third parties) · why (purpose) · lawful basis (consent/contract/legitimate interest — named, per purpose) · retention period · who it's shared with. No map = no audit; the map feeds `security-audit.md` and pipeline retention rules.

## Implementation checklist
- **Consent**: granular (per purpose), unticked by default, withdrawable as easily as given, logged (who/when/what version of the text) — consent state is DB truth checked by every outbound path (ties to `whatsapp.md`/`brevo.md` suppression).
- **Cookies**: nothing non-essential fires before consent (analytics included); banner reject-path as easy as accept.
- **DSRs in code, not promises**: export (all PII as portable JSON) and erasure (delete or anonymize — orders keep the row, null the PII) within 30 days; both tested, both logged.
- **Processors**: DPA with each (hosting, email, analytics, AI APIs); subprocessor list in the privacy policy matches reality — sending EU personal data to an AI API without a DPA basis is a finding, and an Always-Stop before it happens.
- **Residency**: EU clients → EU regions (noted in `business-context.md`); transfers outside need a mechanism (SCCs).
- **Breach path**: detection → assess → notify authority within 72h — the contact list and template exist BEFORE the breach.

## Audit output
Findings table (gap · risk · article ref · fix · effort) + the data map as a living deliverable (`documents.md` for the client-facing version). Legal sign-off stays with the client's counsel — we implement, we don't give legal advice; say so in every report.
