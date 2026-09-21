# Reference: css-architecture

Deep detail for `css-architecture.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Three Pillars (never forget)
**Responsive · Maintainable & scalable · Web performant.** Every CSS decision serves these; a clever style that hurts maintainability or performance is wrong.

## How CSS actually resolves (know this before debugging specificity)
Cascade order: importance → **specificity** → source order. Specificity weight `(inline, id, class/pseudo-class/attr, element)`. Rules: never rely on source order to fight specificity; keep specificity FLAT and LOW so overrides stay sane; `!important` is a last resort and a code smell, not a tool.

## BEM (the naming law)
`.block { }` · `.block__element { }` · `.block--modifier { }`.
- **Block**: standalone component (`.card`, `.btn`, `.nav`).
- **Element**: a part that has no meaning alone (`.card__title`, `.nav__link`).
- **Modifier**: a variant flag (`.btn--primary`, `.card--featured`).
Rules: no nesting of real selectors deeper than the block (BEM keeps specificity flat by design) · never style by tag or id for components · never reach into another block's internals · a component's styles are self-contained and portable.

## 7-1 SCSS pattern (file structure)
```
sass/
├── abstracts/   _variables.scss _mixins.scss _functions.scss  (no CSS output)
├── base/        _reset.scss _base.scss _typography.scss
├── components/  _button.scss _card.scss …            (one file per BEM block)
├── layout/      _header.scss _grid.scss _footer.scss
├── pages/       _home.scss …                          (page-specific only)
├── themes/      _default.scss …
└── main.scss    (imports everything, the only compiled entry)
```
One BEM block = one partial. Partials are `_name.scss`, imported into `main.scss`.

## SCSS features — use with discipline
- **Variables**: design tokens (`$color-primary`, `$bp-tablet`, spacing scale) in `abstracts/_variables.scss` — the single source of truth. In greenfield work prefer CSS custom properties for anything themeable at runtime; SCSS vars for build-time constants.
- **Nesting**: ONLY for pseudo-classes, `&:hover`, and BEM `&__el`/`&--mod` — never mirror the DOM tree (deep nesting = specificity bombs). Max ~2 levels.
- **Mixins** for reusable rule groups (`@mixin flex-center`, responsive `@mixin respond($bp)`); **functions** for computed values; **placeholders** `%name` + `@extend` for shared skeletons — but prefer mixins over @extend when unsure (@extend can bloat/scatter output).
- **Partials + `@use`/`@forward`** (modern) over deprecated `@import`.

## Responsive strategy (decide once, per project)
- **Mobile-first** (min-width queries, progressive enhancement) is the default for content sites; **desktop-first** (max-width) only when the design demands it — state which in the project's `_variables.scss`.
- Breakpoints in em (respond to user font-size), centralized as variables, named by intent not device (`$bp-large`, `$bp-medium`), driven through a `respond()` mixin — never scatter raw `@media` queries.
- **rem for layout** sizing with the `html { font-size: 62.5% }` trick (1rem = 10px) so users' browser font settings scale the whole UI; px only for tiny fixed details (borders).
- Fluid where possible: `%`, `vw/vh`, `clamp()`, `min()/max()`, `minmax()` in Grid — over fixed pixel widths.

## Flexbox vs Grid (the css-scss-developer + frontend-dev decision)
**Flexbox = 1 dimension** (a row OR a column: navbars, button groups, centering, distributing items along one axis). **Grid = 2 dimensions** (rows AND columns together: page layouts, card galleries, any real 2D structure). Rule of thumb: content-driven one-axis flow → Flexbox; layout-driven two-axis structure → Grid. They compose — Grid for the page skeleton, Flexbox inside cells.

## Performance
Fewer, flatter selectors · avoid expensive reflows in animation (animate `transform`/`opacity`, not `top`/`width`) · `will-change`/`backface-visibility` only where jitter is real · one compiled stylesheet, minified · critical CSS inlined for above-the-fold on content sites.

## Modern CSS worth reaching for
CSS custom properties (runtime theming), `clamp()` for fluid type, container queries for true component responsiveness, logical properties for RTL, `:is()/:where()` to keep specificity low. Use when they simplify — never novelty for its own sake (Three Pillars still rule).
