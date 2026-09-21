# Reference: optional-tooling

Deep detail for `optional-tooling.md`. Read this when a review has ALREADY
found a specific gap and you're choosing which free tool closes it — not when
scoping a project (the default stack + `ui-libraries.md` + the existing skills
already cover the default path).

## Frontend
| Tool | Reach for it when... | Notes |
|---|---|---|
| `eslint-plugin-jsx-a11y` | `a11y-auditor` keeps finding the same class of markup issue lint could catch pre-review | Free, npm, add to existing ESLint config — no new infra |
| `eslint-plugin-react-hooks` | Hooks-rule bugs (stale closures, missing deps) show up in review more than once | Usually already in Next.js defaults — confirm before adding |
| Stylelint | `css-scss-developer`'s BEM/architecture rules (`css-architecture.md`) are being violated repeatedly and review alone isn't catching it fast enough | Adds a lint step, not a design decision — doesn't replace the design skill |
| `size-limit` / `bundlesize` | `performance-benchmarking.md`'s bundle budget was breached and needs an enforced CI gate, not just a one-off check | Fails CI on regression — confirm the Team Lead wants that gate before adding |
| Knip | Suspect dead code/unused exports are accumulating (a code-reviewer finding, not a guess) | Read-only detector; never auto-deletes |
| depcheck | Suspect unused npm dependencies are bloating install/bundle size | Read-only; verify a flagged dep before removing (some are used indirectly) |
| Storybook | A component library (`ui-libraries.md`) has grown past a handful of shared components and visual review is getting hard without isolation | Real setup cost — HIGH-tier grooming item, not a quick add |

## AEO / SEO
| Tool | Reach for it when... | Notes |
|---|---|---|
| `next-sitemap` | Manual sitemap generation (`production-deployment-gsc.md`) is error-prone or the route set changed structurally | Automates what the skill already requires — doesn't change the requirement |
| `schema-dts` | Structured data (`aeo-seo.md`) keeps shipping with type errors caught late | TypeScript types for JSON-LD, catches schema mistakes at compile time |
| Google Rich Results Test / PageSpeed Insights | Verifying structured data or Core Web Vitals AFTER a `growth-seo-specialist` finding — not a tool to install, a web check to run | Not a dependency — a manual verification step, mention here because it's the natural next reach |
| Broken-link checker (e.g. `linkinator`) | `docs-sync` or `growth-seo-specialist` suspects link rot on a content-heavy site | Read-only crawl; run against staging, not prod |

## When NOT to reach for one of these
The default toolchain (`css-architecture.md`, `a11y-auditor`, `performance-benchmarking.md`, `aeo-seo.md`) already covers the standard path — these are for when a SPECIFIC, ALREADY-OBSERVED gap needs closing faster than manual review alone. Adding one "just in case" is scope creep, not optimization (`token-efficiency.md`).

## Adding a tool (so it doesn't become a silent default)
1. Name the specific finding that motivated it (which review, which gate, which recurring issue).
2. Confirm it's free / no paid tier — if a paid tier would help more, that's a `finops-cost.md` decision, not this skill's.
3. Team Lead logs the addition in the daily log with the reason (MEDIUM tier — not Always-Stop, but not silent either).
4. It stays a targeted fix for the finding that motivated it — don't quietly promote it into every project's default stack without a real recurring pattern across MULTIPLE clients (that's a `docs/CONVENTIONS.md` change, a deliberate decision, not a one-off tool add creeping into the default).

## Guardrails
Never installed by default, never used for an Always-Stop or architectural call (those stay with `system-architect`/`security-auditor`/the Founder). No paid tier activated without the money gate. A tool that starts appearing in every project's setup is a signal to formalize it into the default stack deliberately (ADR) — not to keep adding it ad hoc project by project.
