# Reference: ui-libraries

Deep detail for `ui-libraries.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Decision first (read this, skip the rest unless integrating)
| If the project is… | Default choice | Why |
|---|---|---|
| React + Tailwind, wants full control of the code | **shadcn/ui** | Copy-in components (you own them), Radix + Tailwind, no runtime dep, hugely popular, themeable — the current default for bespoke client sites |
| React, wants accessible UNSTYLED primitives to style freely | **Radix UI** / **React Aria** | Behavior + a11y done right; you bring the styles (pairs with Tailwind/SCSS) |
| React, wants a batteries-included styled system fast | **MUI (Material UI)** or **Mantine** | Big component set out of the box; faster but more opinionated look + runtime |
| React, headless logic only (tables, combobox, dates) | **Headless UI**, **TanStack Table/Virtual**, **Downshift** | Logic without visuals; combine with your design system |
| Utility-first styling foundation (almost always) | **Tailwind CSS** | The styling substrate most of the above assume |
| Prototyping / marketing pages, pre-built blocks | **Tailwind UI**-style block sets on shadcn | Speed for non-app pages |
| Vue project | **Radix Vue / shadcn-vue**, **PrimeVue**, or **Nuxt UI** | Vue-native equivalents |

**AstraSyntx default for custom client websites: Tailwind + shadcn/ui + Radix primitives** (own-your-code, accessible, no lock-in, top-tier community support), layered with the design system from `web-design-rules.md`/`css-architecture.md` and motion from `motion-design.md`. Deviate only with a recorded reason.

## Why these (selection criteria — how to judge any library)
Popularity + active maintenance (issues closed, recent releases), accessibility built-in (keyboard, ARIA, focus — non-negotiable per our a11y DoD), TypeScript-first types, tree-shakeable / low runtime cost (`performance-benchmarking.md`), themeable with our tokens (no fighting a baked-in look), and license fit. A trendy library failing a11y or unmaintained is disqualified regardless of stars.

## Integration doctrine (when you do adopt one)
- **shadcn/ui**: it's copy-in, not a dependency — components live in the repo (`components/ui`), owned and reviewed like our code (TypeScript-only rule applies). Customize via tokens, not by forking styles ad hoc. Keep the design-system tokens the single source of truth.
- **Radix / Headless / React Aria**: style with our tokens; never ship them unstyled; verify the a11y behavior with `playwright-testing.md` (focus trap, escape, arrow keys).
- **MUI / Mantine**: theme centrally to the client's personality (don't leave default Material blue on a luxury brand — a `web-design-rules.md` violation); watch bundle size; prefer their unstyled/headless escape hatches where the design demands.
- **Any**: one component library per project (mixing two doubles bundle + inconsistency); wrap third-party components behind our own component API so a future swap is contained; motion via `framer-motion-engineer`/`gsap-engineer`, not the library's ad-hoc animations.

## Guardrails
Accessibility and performance gates still apply to library components — an inaccessible or heavy component fails review even if it's "just the library's." No unlicensed/paid-tier component shipped without Founder approval. Adding a UI library is an ADR-worthy decision (it shapes the whole frontend); record it. Don't add a second library "for one component" — build it or use the chosen system (`token-efficiency.md`).

## Common failure modes
Two component libraries in one app (bundle + visual inconsistency) · default library theme left unbranded · inaccessible custom component excused as "library default" · trendy unmaintained lib chosen on stars alone · paid tier used without approval · third-party components used raw (no wrapper) making a later swap a full-repo change · animating via the library instead of the motion engineers.
