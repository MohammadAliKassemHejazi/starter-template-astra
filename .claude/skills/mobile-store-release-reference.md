# Reference: mobile-store-release

Deep detail for `mobile-store-release.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Release toolchain
- **EAS Build + Submit** (Expo-native, default): cloud builds for iOS without a Mac; `eas submit` uploads to both stores. Profiles in `eas.json` (development / preview / production) with per-env config.
- **Fastlane** (when the client needs advanced automation beyond EAS): `match` for iOS cert/profile sync (shared, encrypted), `gym` build, `pilot` (TestFlight), `supply` (Play). Use when store automation is complex or already in the client's pipeline.
- CI (GitHub Actions/etc.) triggers builds on a release branch/tag; secrets from CI secret store, never committed.

## Beta / staged rollout
- **iOS TestFlight**: internal testers (fast, no review) → external testers (light review) before production. Demo account + notes ready (reviewers reject without them).
- **Google Play**: internal → closed → open testing tracks; **staged rollout %** (5% → 20% → 100%) so a bad build hits few users; halt-and-rollback if crash rate spikes (watch `sentry-triage`).

## OTA update strategy (the critical distinction)
- **`eas update` (OTA)** pushes JS/asset changes instantly — bug fixes, copy, tweaks — no store review.
- **Native changes REQUIRE a store build**: new native module, permission, SDK/runtime bump, config plugin. Pushing an OTA for a native change breaks the app. Know which kind of change you're shipping before promising "instant."
- Pin OTA updates to the matching runtime version; never push an update built for a different native runtime.

## Credentials & signing (handle with care)
- iOS: distribution cert + provisioning profile (EAS-managed or Fastlane `match` in a private encrypted repo); App Store Connect API key for automated submit. Android: upload keystore (BACK IT UP — losing it means you can't update the app; `backup-disaster-recovery.md`), Play service-account JSON for `supply`.
- ALL of these are secrets → secret store / CI secrets / encrypted match repo, NEVER committed. Store accounts belong to the CLIENT; the Founder coordinates access.

## Store-readiness checklist (calendar items, not code)
Privacy nutrition labels / data-safety form accurate (ties to `compliance-extended.md`) · permission usage strings written for humans · screenshots + metadata per locale · content rating · demo credentials · review lead time budgeted (Apple hours–days; Play first-review slower).

## Guardrails
Submitting to a store, publishing a release, or promoting a staged rollout = Always-Stop (Founder/client approves). Keystores/certs are irreplaceable-if-lost → backed up + access-controlled. Never commit signing material.

## Common failure modes
OTA pushed for a native change (app breaks) · Android keystore lost (can't update ever) · signing secret committed · TestFlight external review lead time not budgeted · staged rollout not halted on a crash spike · privacy form mismatched to actual data use (rejection/removal) · runtime-version mismatch on OTA.
