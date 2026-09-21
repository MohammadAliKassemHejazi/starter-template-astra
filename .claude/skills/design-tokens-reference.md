# Reference: design-tokens

Deep detail for `design-tokens.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## The core problem this solves
Design values (color, type, spacing) drift between Figma and code when they're maintained twice. Tokens make the design decisions data — defined once, consumed everywhere — so a brand change is one edit, not a hunt through stylesheets.

## Token tiers (structure them, don't dump a flat list)
1. **Primitive / global** tokens: the raw palette + scale (`--lime-500: #c8f230`, `space-4: 16px`, `font-size-lg`). No semantic meaning.
2. **Semantic / alias** tokens: role-based, referencing primitives (`--color-accent`, `--color-bg`, `--text-primary`, `--focus-ring`). Components use THESE, never raw primitives — so re-theming swaps the alias, not every component.
3. **Component** tokens (optional): per-component overrides (`--button-bg`) referencing semantic tokens.
This indirection is what makes theming + dark mode + client re-brand a small change.

## Figma → code pipeline
- **W3C Design Tokens format** (`tokens.json`) as the interchange; Figma variables/Tokens Studio plugin export → the JSON.
- **Style Dictionary** (or similar) transforms `tokens.json` → CSS custom properties, Tailwind theme config, and/or TS constants — one source, many targets. Run in build so code never drifts from the token file.
- Round-trip discipline: the token file is the source of truth; neither Figma nor code edits values independently. Ties to `css-architecture.md` (tokens are the "no magic numbers" rule realized).

## Tailwind / CSS integration
- Map semantic tokens into `tailwind.config` theme (colors/spacing/typography reference the tokens) so utilities and tokens agree.
- CSS custom properties for anything runtime-themeable (dark mode, per-client white-label): `:root` + `[data-theme]` swap semantic aliases.
- With `ui-libraries.md` (shadcn/Radix): theme the library via the same CSS variables — the library, Tailwind, and Figma all read one token set.

## Accessibility baked into tokens
Contrast pairs validated at the token level (a `--text-on-accent` token must pass 4.5:1 on `--color-accent`) so the design system can't ship an inaccessible combination. Ties to `a11y-auditor`.

## Governance
- Token changes are reviewed like code (`code-reviewer`); a new primitive needs a reason (don't grow the palette ad hoc).
- Document the token system (`docs-sync` keeps it current); name tokens by ROLE not appearance (`--color-accent` not `--color-green` — survives a rebrand).

## Guardrails
One source of truth (the token file) — no parallel hardcoded values (a raw hex in a component is a review reject, per `css-architecture.md`). No inaccessible token pairs. A rebrand/theme is a token edit, not a component rewrite.

## Common failure modes
Values maintained twice (Figma + code drift) · components using raw primitives (re-theme touches everything) · tokens named by color not role (rebrand breaks names) · contrast not validated at token level (inaccessible combos ship) · Tailwind theme + tokens disagreeing · no build-time sync (manual copying).
