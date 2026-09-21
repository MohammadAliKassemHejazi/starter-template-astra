# User Story — <short title>

**ID:** US-NN | **Sprint:** #N | **Status:** 🔲 Backlog / ⏳ In progress / 🔎 Review / ✅ Done / ❌ Blocked
**Priority:** P0 critical / P1 high / P2 medium / P3 low
**Estimate:** ⚫ story points (1 / 2 / 3 / 5 / 8 / 13-too-big-split)
**Tier:** LOW / MEDIUM / HIGH (drives process weight + model — see CLAUDE.md)

## Story
**As a** <role / user type>
**I want** <capability>
**So that** <benefit / why it matters>

## Acceptance Criteria (Definition of Done for THIS story)
1. **Given** <context>, **When** <action>, **Then** <observable outcome>.
2. Given …, When …, Then …
<!-- Every criterion must be testable — if qa-devops can't verify it, it's not ready (DoR). -->

## Standard DoD (all must hold — from CLAUDE.md)
- [ ] Typed strict + zod at boundaries
- [ ] Tests written for new behavior (meaningful, not vacuous)
- [ ] Code-reviewer approved; security-auditor approved IF auth/payments/PII/upload/public-endpoint
- [ ] qa-devops verified every AC; **UI → before/after rendered screenshot attached**
- [ ] Docs updated (docs-sync); API contract documented if backend changed
- [ ] Verification stamp: `tsc ✓ / tests ✓ (re-run) / N files (git-counted) / data-safe ✓`

## Owner & Collaborators
- **Owner:** <single agent>
- **Collaborators / pairing:** <e.g. frontend-dev + css-scss-developer; backend-node + data-analytics>
- **Skills to load:** <named skills — see skills/INDEX.md>

## Dependencies
- <blocking stories / external blockers — API key, account, another stream>

## Risks
- <top 1–2 things that could go wrong>

## Always-Stop flags
- <money / production deploy / destructive data / auth design / live messaging / new paid infra — or "none">
