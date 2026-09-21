# Reference: performance-benchmarking

Deep detail for `performance-benchmarking.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Core Web Vitals — targets and how to hit them
| Metric | Good | Common fix |
|---|---|---|
| **LCP** (largest contentful paint) | < 2.5s | `priority` on hero image, preload critical font, no render-blocking JS in head, CDN/cache |
| **CLS** (cumulative layout shift) | < 0.1 | explicit width/height on media, reserve ad/embed space, `next/font` |
| **INP** (interaction to next paint) | < 200ms | break long JS tasks, defer non-critical work, `useTransition`/`useDeferredValue` |

- Measure with **Lighthouse** (lab) AND **field data** (CrUX / `web-vitals` RUM → analytics) — lab and real-user diverge; field is truth. GSC's Core Web Vitals report is the SEO-facing view.
- Profile on mid-tier mobile + throttled network, not a fast laptop (the lab lies about real conditions).

## Bundle analysis
- Run the bundle analyzer (`@next/bundle-analyzer` / rollup-visualizer) every meaningful frontend change; watch for regressions.
- Kill bloat: code-split routes, dynamic-import heavy/below-fold components, tree-shake, drop duplicate deps, prefer lighter libraries; audit what a big dependency actually costs vs. a few lines of code.
- Set a **budget** (e.g. initial JS < Nkb gzipped) and fail CI / flag on breach.

## Load testing
- Tool: **k6** (scriptable, TS-friendly) or Artillery. Model realistic traffic (ramp to expected peak + headroom), not a flat hammer.
- Test the money path (checkout/booking API) and the DB under concurrency — surface pool exhaustion, N+1s (`postgres-safety.md`), and slow queries (`EXPLAIN ANALYZE`) BEFORE launch, not during a traffic spike.
- Establish a baseline; re-run after changes; track p50/p95/p99 latency and error rate under load — not just averages (p99 is where users feel pain).
- **Always-Stop / caution**: load tests generate real load and cost — run against staging, never a shared prod-adjacent resource without approval; live-data safety applies (`verification-discipline.md`).

## Verification
Benchmarks are re-run and read from the actual tool output, never quoted from a prior run or estimated — a "feels fast" is not a number. Attach the Lighthouse/k6 summary as evidence.

## Common failure modes
Optimizing lab score while field CWV stays poor · profiling on a fast machine · bundle regression shipped unnoticed (no budget) · load test as a flat hammer (unrealistic) · averages hiding a bad p99 · load testing prod by accident · animating layout properties causing CLS/jank.
