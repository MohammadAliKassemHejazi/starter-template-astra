# Reference: site-uniqueness-research

Deep detail for `site-uniqueness-research.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Why this exists
The difference between a forgettable site and a memorable one is a deliberate
"signature" — a coherent set of distinctive choices, not random flair. This
skill is the research + decision step that produces that signature before code.

## Research workflow (evidence-based, not guesswork)
1. **Study the field** (via web search/fetch): the client's top competitors + 3–5 award-tier sites (Awwwards, FWA, Godly, Land-book, Httpster) in an adjacent aesthetic. Note what makes the standout ones memorable — and what the competitors ALL do (so we don't blend in).
2. **Find the white space**: where is everyone in this niche identical (same stock hero, same layout, same blue)? The signature lives in deliberately breaking one or two of those conventions — tastefully, per personality.
3. **Extract patterns, never copy**: identify the TECHNIQUE (e.g. "editorial oversized type + horizontal scroll gallery"), then express it in the client's own brand — never clone a specific site.
4. **Anchor to personality + brand** (`web-design-rules.md` + `business-context.md`): the signature must fit who the client is; unique-but-off-brand is worse than safe.

## The signature system (decide and document these)
A memorable site usually has 2–4 deliberate signature elements — not more (too many = chaos). Choose from:
- **A signature motion** — the hero moment / scroll behavior people remember (e.g. a reveal, a pinned story, kinetic type).
- **A distinctive layout move** — broken grid, asymmetry, overlap, horizontal scroll section, oversized editorial type.
- **A visual motif** — a recurring shape/line/gradient/texture/illustration style that threads through sections (the "connective tissue").
- **An interaction texture** — custom cursor, magnetic buttons, hover states with character, page-transition style.
- **A color/type signature** — an unexpected but on-brand palette or a characterful type pairing (still following the rules: contrast, readability, ≤2 families).

## Section-by-section concept (the deliverable)
For each page section, decide and write down: its **purpose**, its **layout idea**, its **motion** (from `motion-design.md`), its **illustration/visual treatment**, and the **assets it needs** (→ `asset-manifest.md`). This turns "make it feel alive" into a concrete, buildable, per-section plan the designer + motion engineers + frontend execute against.

## Cohesion check (uniqueness without incoherence)
- The signature elements share a logic (all sharp, or all organic — not half-and-half).
- Motion, shape motif, type, and color tell ONE story (the personality).
- Distinctive ≠ hard to use — UX patterns stay familiar (`web-design-rules.md` UX rules); we innovate on feel, not on where the nav is.
- Performance + a11y hold regardless of how unique (`motion-design.md`).

## Output (feeds grooming, motion plan, asset list)
1. Competitor/field scan summary (what's generic, what's exceptional — with source links, real not invented — `verification-discipline.md`).
2. The chosen signature system (2–4 elements + rationale tied to personality/brand).
3. The section-by-section concept table.
4. A first pass at the asset manifest (what images/SVGs/videos each section needs).

## Guardrails
Never clone a specific site (legal + reputation); extract techniques, express originally. Distinctiveness serves the client's goal — no artiness that hurts conversion or clarity. Research claims cite real sources.

## Common failure modes
"Unique" = random unrelated effects (no cohesion) · copying a specific award site too closely · signature that fights the brand personality · innovating on navigation/UX (confuses users) · so many signature elements the page is chaos · uniqueness that tanks performance or a11y.
