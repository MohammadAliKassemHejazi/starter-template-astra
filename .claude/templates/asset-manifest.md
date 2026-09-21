# Asset Manifest — <client / project>

**Prepared by:** <animation/design agent> | **Date:** YYYY-MM-DD | **Status:** 🔲 Draft / ⏳ Awaiting Founder / ✅ Complete

> Purpose: list EVERY visual asset the site needs, section by section. For each,
> the agent states whether it can **produce/source it itself** (generate SVG,
> code a CSS/canvas effect, use a licensed placeholder) or whether the **Founder
> must provide it** — with an exact spec so what you deliver drops straight in.
> Nothing vague. An asset the agent can't make becomes a precise shopping-list
> item, not a surprise mid-build.

## Legend — "Source"
- **AGENT-GENERATE** — agent creates it (inline SVG, CSS/Framer/GSAP effect, generated gradient/pattern, animated canvas). No action from you.
- **AGENT-SOURCE (placeholder)** — agent uses a royalty-free/licensed placeholder now; you may swap later. License noted.
- **FOUNDER-PROVIDE** — agent cannot/should not create it (real photos of the client's product/team/space, brand logo, licensed video, proprietary imagery). **You provide; spec is below.**
- **DESIGNER-DECIDE** — needs a human design call before it can be specced.

---

## Global / brand assets
| Asset | Source | Spec (format · dimensions · notes) | Status |
|---|---|---|---|
| Logo (primary) | FOUNDER-PROVIDE | SVG preferred (or PNG @3x, transparent); light + dark variants | 🔲 |
| Favicon / app icons | AGENT-GENERATE from logo | SVG + 512/192/apple-touch PNG | 🔲 |
| Brand fonts | FOUNDER-PROVIDE or AGENT-SOURCE | licensed webfont files or Google Fonts name; ≤2 families | 🔲 |
| Color tokens | DESIGNER-DECIDE | from personality + brand (`web-design-rules.md`) | 🔲 |
| OG/social share image | AGENT-GENERATE | 1200×630 PNG, on-brand | 🔲 |

## Section-by-section assets
> One block per section, mirroring the uniqueness research concept + motion plan.

### Section: <Hero>
- **Concept/motion:** <from site-uniqueness-research + motion-design>
| Asset | Source | Spec | Status |
|---|---|---|---|
| Hero background (video) | FOUNDER-PROVIDE | MP4 (H.264) + WebM, 1920×1080+, <8s loop, <5MB, muted; poster frame | 🔲 |
| — fallback if no video | AGENT-GENERATE | animated gradient / canvas ambient (no asset needed) | — |
| Hero product/scene photo | FOUNDER-PROVIDE | JPG/PNG, ≥2400px wide, 2x retina, real client product/space (not stock) | 🔲 |
| Decorative shapes/blobs | AGENT-GENERATE | inline animated SVG | — |
| Kinetic headline | AGENT-GENERATE | code (Framer/GSAP), no asset | — |

### Section: <Features / Cards>
| Asset | Source | Spec | Status |
|---|---|---|---|
| Feature icons | AGENT-GENERATE / AGENT-SOURCE | SVG, one consistent icon set (`web-design-rules.md`: SVG only, one pack) | 🔲 |
| Feature illustrations | AGENT-GENERATE (simple) / FOUNDER-PROVIDE (brand-specific) | SVG or 2x PNG, consistent style | 🔲 |

### Section: <Storytelling / How it works>
| Asset | Source | Spec | Status |
|---|---|---|---|
| Step illustrations | DESIGNER-DECIDE → AGENT/FOUNDER | consistent series; SVG preferred for scroll-animation/morph | 🔲 |
| Scroll-sequence frames (if used) | FOUNDER-PROVIDE | image sequence or video; dimensions + count TBD | 🔲 |

### Section: <Testimonials / Social proof>
| Asset | Source | Spec | Status |
|---|---|---|---|
| Customer photos/avatars | FOUNDER-PROVIDE | real headshots, square ≥400px, with usage consent | 🔲 |
| Client/partner logos | FOUNDER-PROVIDE | SVG/PNG transparent, permission to display | 🔲 |

### Section: <Gallery / Product / Portfolio>
| Asset | Source | Spec | Status |
|---|---|---|---|
| Product/work photos | FOUNDER-PROVIDE | JPG, 2x retina, IDENTICAL dimensions across the set (`web-design-rules.md`) | 🔲 |

### Section: <CTA / Footer>
| Asset | Source | Spec | Status |
|---|---|---|---|
| Background texture/pattern | AGENT-GENERATE | SVG/CSS | — |
| Social icons | AGENT-GENERATE | SVG set | — |

---

## ⚠️ Founder action list (the shopping list)
> Everything marked FOUNDER-PROVIDE, consolidated — hand this to the client.
| # | Asset | Exact spec | Why the agent can't make it |
|---|---|---|---|
| 1 | <logo SVG> | <format/size> | brand-owned, must be authentic |
| 2 | <hero product video> | MP4+WebM, <5MB, <8s loop, 1920×1080, muted | real product footage, not generatable |
| 3 | <team/customer photos> | <specs> + usage consent | real people, consent required |
| … | | | |

**If an item can't be provided:** the agent will fall back to the listed AGENT-GENERATE alternative (e.g. animated gradient instead of hero video) and note the downgrade — the site still ships, just without that specific asset.

## Licensing note
Every AGENT-SOURCE placeholder records its license (source + terms). Nothing unlicensed ships. Founder-provided media is assumed cleared by the client; flag anything that looks like it needs a release (recognizable people, third-party brands).

## Verification
Asset list is complete against the final section plan (every section audited), and each "Status" reflects reality — not assumed delivered (`verification-discipline.md`).
