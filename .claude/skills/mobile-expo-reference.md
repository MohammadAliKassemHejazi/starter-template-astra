# Reference: mobile-expo

Deep detail for `mobile-expo.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## EAS (the toolchain)
- `eas build` (cloud builds for iOS without a Mac) · `eas submit` (store upload) · `eas update` (OTA). Profiles in `eas.json`: development / preview / production with separate env vars.
- **OTA updates** push JS/asset changes instantly — but native changes (new package with native code, permissions, SDK upgrade) REQUIRE a store build. Know which kind of change you're making before promising "instant fix".

## Store realities (calendar items, not code items)
Apple review: hours to days; rejections for vague permission strings, missing privacy manifest/nutrition labels, broken demo accounts. Google: faster, but first release + data-safety form takes time. Store accounts belong to the CLIENT — the Founder coordinates access; submission itself is client-facing → Founder approves.

## Doctrine
- Push notifications: `expo-notifications`; store Expo push tokens server-side keyed to user; handle permission denial gracefully; deep-link from notification payload to the right screen.
- Deep linking: scheme + universal links configured in `app.json`; every marketing/automation link should deep-link, not open the browser.
- Permissions: request in context with a pre-prompt explaining why (blind startup permission walls tank opt-in and reviews).
- Offline: queue mutations, optimistic UI, reconcile on reconnect — mobile networks fail as a feature.
- Test on real low-end Android + oldest supported iOS before "done"; simulators lie about performance.

## Common failure modes
OTA pushed for a change that needed a native build (app breaks) · push tokens not rotated per user session · Android back-button unhandled · keyboard covering inputs (KeyboardAvoidingView) · store rejection for a permission string written by a developer for developers.
