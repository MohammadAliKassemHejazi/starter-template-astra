# Skill: Optional Tooling (free plugins — reactive, not default)

> Load ONLY when a quality gate has already failed and a well-known free tool
> could close the specific gap — never as a default step, never to make an
> Always-Stop or architectural decision. These are troubleshooting aids for
> non-critical dimensions (lint noise, a11y misses, SEO/AEO structure, bundle
> bloat), reached for reactively.

## The rule in one sentence
**If the output already meets expectations, don't add a tool.** Only escalate to something in `optional-tooling-reference.md` when a review/audit has concretely found a gap (a failed a11y check, a lint category that keeps recurring, a Lighthouse/SEO score below target) that the tool specifically addresses — and it's genuinely free (no paid tier activated without the Always-Stop money gate).

Full catalog (frontend, AEO/SEO, quality/dead-code), when to reach for each, and how to add one without it becoming a silent default: `optional-tooling-reference.md`.
