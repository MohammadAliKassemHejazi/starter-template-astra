# Reference: web-design-rules

Deep detail for `web-design-rules.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Step 0 — Pick the personality FIRST (it decides every other choice)
| Personality | Typography | Colors | Images | Shadows / Radius | Industries |
|---|---|---|---|---|---|
| Serious/Elegant | Thin serif (Playfair, Cormorant) | Black, gold, navy, muted pastel | Big full-bleed photography | None; 0px radius | Luxury, jewelry, fashion, real estate |
| Minimalist/Simple | Boxy sans (Inter, Lato) | Mono B/W + 1 accent | Sparse, white bg | None; 0px | Architecture, portfolio |
| Plain/Neutral | Compact sans (Roboto, Arial) | Corporate blues, greys | Dense tables, small imgs | Minimal | Enterprise, legal, banking |
| Bold/Confident | Heavy uppercase sans (Montserrat) | High-contrast saturated blocks | Big punchy graphics | Flat, sharp | Agencies, fitness, tech |
| Calm/Peaceful | Soft serif (Lora, Merriweather) | Warm earthy pastels | Organic illustration, natural light | Soft subtle; gentle radius | Health, yoga, wellness |
| Startup/Upbeat | Modern sans (Inter, Open Sans) | Vibrant gradients, light grey bg | 3D illustration, app mockups | Soft float; 8–16px | SaaS, AI, fintech |
| Playful/Fun | Rounded/handwritten (Quicksand) | Bright multi-color | Hand-drawn, animated | Bouncy; pill/full radius | Kids, pet, food delivery |

## Typography rules
1 or 2 typefaces max per page · normal text 16–32px (long-form 20px+) · headlines 50px+/weight 600+ per personality · never weight < 400 · **< 75 chars per line** · line-height 1.5–2 for body, < 1.5 for big text · decrease letter-spacing on large headings if it looks unnatural · all-caps only for short titles (small, bold, +letter-spacing) · **don't justify**, don't center long blocks (small blocks fine) · use a type scale, don't freehand sizes.

## Color rules
Main color matches personality (colors convey meaning) · never random tones or CSS named colors · minimum palette = 1 main + 1 grey · add accents with a tool · generate tints/shades for depth · main color draws attention to key elements · on dark backgrounds use a tint of the bg for text · body text never pure black (lighten it) · never too light — **check contrast (WCAG 4.5:1 body, 3:1 large 18px+ bold)**.

## Images
Only relevant images (support the message) · prefer original, else original-looking stock (never generic) · show real people for emotion · text-over-image via darken/gradient OR neutral area OR text box · **2x dimensions for retina** · compress for performance · side-by-side images share exact dimensions.

## Icons
One icon pack only · **SVG or icon fonts, never jpg/png** · match personality (roundness/weight/filled-outlined follow typography) · same color as text to stay neutral, different color to draw attention · label action icons · never larger than designed for (enclose in a shape if needed).

## Shadows (optional — only if the personality wants them)
Small doses, never on every element · go light, never too dark · small shadow = small element standout, medium = larger areas, large = floating elements · change on hover/active · bonus: colored glows.

## Border-radius
Increases playfulness/reduces seriousness · **match the typeface's roundness** · apply to buttons, images, around icons, standout sections.

## Whitespace (the #1 amateur tell)
Tons between sections, a lot between groups, some between elements · whitespace instead of lines inside groups · closer = more related (Law of Proximity) · start with too much then remove · big text/icons need more whitespace · **hard rule: all spacing in multiples of 16px** (16/24/32/48/64/80/96/128).

## Visual hierarchy
Important elements near the top · larger images pull more attention · whitespace creates emphasis · for text use size+weight+color+whitespace · emphasize components with bg/shadow/border, or de-emphasize the competitor · things to emphasize: CTAs, testimonials, pricing tables, key rows.

## UX
Don't reinvent layouts — use known patterns · CTA is the most prominent element with descriptive text · **blue + underline reserved for links only** · animations 200–500ms with a purpose · form labels+fields in a single vertical column · feedback for every action (error/success) · action buttons where they take effect (locality) · descriptive keyword headline, no vague/fancy · simple words, no jargon · break long text with sub-headings/images/quotes/bullets.

## The 7-step process (for a new site/redesign brief)
Define (audience + goals) → Plan (sitemap, personality) → Sketch (wireframe before code) → Design & build → Test & optimize (cross-browser, WCAG, compress, Lighthouse) → Launch → Maintain. Sketch before code is non-negotiable on HIGH-tier UI.
