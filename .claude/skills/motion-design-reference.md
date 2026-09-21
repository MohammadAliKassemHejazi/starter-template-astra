# Reference: motion-design

Deep detail for `motion-design.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## First principle — motion serves meaning, never decoration
Every animation answers "what does this communicate?": guide attention, show
relationship (this came from that), give feedback (it worked), establish
hierarchy, or express brand personality. Motion with no answer is deleted.

## Personality dictates motion (from web-design-rules.md)
| Personality | Motion character |
|---|---|
| Serious/Elegant | Slow, minimal, refined fades & subtle parallax; nothing bouncy |
| Minimalist | Almost none; a single deliberate reveal, crisp easing |
| Bold/Confident | Fast, punchy, big entrances, kinetic type, sharp cuts |
| Calm/Peaceful | Gentle, organic, slow drifts, soft ease-in-out |
| Startup/Upbeat | Smooth springs, playful float, staggered reveals |
| Playful/Fun | Bouncy, elastic, characterful, surprise-and-delight |
Match the motion to the personality — a bouncy spring on a luxury jewelry site is a bug, not a feature.

## Timing & easing (the craft)
- Durations: micro-interactions 150–300ms · entrances/reveals 300–600ms · page/section transitions 400–800ms · never past ~1s for functional motion (feels sluggish). Ties to the UX rule (200–500ms for functional feedback).
- Easing: natural motion accelerates and decelerates — use `ease-out` for entrances (fast in, settle), `ease-in-out` for moves, custom cubic-bezier/springs for personality. Linear only for continuous loops (marquee, spinner).
- **Stagger** children (40–80ms apart) so groups feel choreographed, not simultaneous — the single highest-impact "premium feel" technique.

## Section-by-section motion strategy (plan the whole page)
Every section gets an intentional entrance, planned as a system so the page has rhythm, not random effects:
- **Hero**: the signature moment — kinetic headline, layered parallax, an animated illustration/gradient, or a looping ambient background. This sets the tone in the first 2 seconds.
- **Feature/cards**: staggered reveal on scroll-into-view; hover micro-interactions.
- **Stats/numbers**: count-up on reveal.
- **Storytelling/steps**: scroll-driven sequence (pin + progress) where each beat animates as you scroll.
- **Testimonials/logos**: gentle marquee or fade-carousel.
- **CTA**: a subtle attention pull (glow, breathe) without being annoying.
- **Transitions between sections**: overlap/clip/wave dividers, color shifts on scroll.
Document the plan per section BEFORE building (feeds the grooming report + asset manifest).

## Scroll animation doctrine
- Trigger on scroll-into-view (IntersectionObserver / library scroll triggers), animate once by default (re-animating on every scroll is nauseating).
- Scroll-driven (progress-linked) for hero/storytelling; scroll-triggered (fire-once) for reveals.
- Respect reading — content is readable WITHOUT waiting for animation (never gate content behind a slow reveal); works if JS is slow.

## Performance (non-negotiable — janky motion is worse than none)
- Animate ONLY `transform` and `opacity` (GPU-composited) — never `top/left/width/height/margin` (trigger layout/paint → jank). This is the #1 rule.
- 60fps target; test on mid-tier mobile, not a fast laptop.
- `will-change`/`translateZ(0)` sparingly on genuinely animated elements; overuse eats memory.
- Lazy-init below-fold animations; don't run offscreen work.
- Heavy hero (WebGL/canvas/large video) must not block LCP — poster/fallback first, enhance after.

## Accessibility (mandatory, not optional)
- **`prefers-reduced-motion: reduce` is honored everywhere** — provide a reduced variant (instant or minimal fade), never just disable and break layout. A motion-heavy site with no reduced-motion path is an a11y failure and can trigger vestibular illness.
- No seizure risks (nothing flashing >3x/sec); parallax/auto-motion has a stop or is subtle; focus states never hidden by motion.

## Engine choice (Framer Motion, GSAP, or Three.js/R3F — decide with the designer)
- **Framer Motion**: React-native, declarative, component/state-driven — default for UI micro-interactions, mount/unmount transitions, layout animations, gesture/hover, shared-element transitions in React apps. Lives inside the component tree.
- **GSAP**: imperative, timeline-based, framework-agnostic — the tool for complex scroll-driven sequences (ScrollTrigger), pinned storytelling, SVG morphing/drawing, precise multi-step choreography, and anything where you need a master timeline. Reach for it when Framer Motion gets awkward.
- **Three.js / React Three Fiber**: real-time 3D/WebGL — use only when spatial form, interaction, or storytelling is materially clearer in 3D. Three.js fits imperative scene control; React Three Fiber fits feature-local React composition. Plan a poster/DOM fallback, reduced-motion path, quality tiers, asset bounds, cleanup, and no-WebGL behavior before building.
- They compose: Framer Motion for the app's interaction layer, GSAP for the showpiece scroll/SVG sequences, and Three.js/R3F for intentional real-time 3D. The choice per effect is logged (like the Flexbox/Grid decision). A 3D scene has one scroll owner; do not let GSAP and the renderer compete for camera or scroll updates.
- TypeScript-first: all animation code is `.ts`/`.tsx`, typed.

## Verification
Motion is pixel-and-motion verified — a recorded/screenshotted before/after of the animation (Playwright), reduced-motion variant checked, 60fps confirmed on throttled mobile. Real-time 3D additionally verifies no-WebGL/asset-failure fallback, keyboard/touch alternatives where interaction matters, route cleanup, and constrained-device behavior. Never "it animates" from code inspection (`verification-discipline.md`).

## Common failure modes
Animating layout props (jank) · no reduced-motion variant · content gated behind slow reveals · everything animates at once (no stagger) · bouncy motion on a serious brand · hero animation blocking LCP · re-animating on every scroll (nausea) · motion tested only on a fast machine · autoplay motion with no stop · a 3D scene without a DOM/poster fallback, cleanup, asset bounds, or a defined scroll owner.
