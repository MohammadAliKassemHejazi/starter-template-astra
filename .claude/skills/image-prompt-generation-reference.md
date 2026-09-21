# Reference: image-prompt-generation

Deep detail for `image-prompt-generation.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Prompt anatomy (include every relevant element)
A strong image prompt is a stack of specific decisions, not a sentence:
1. **Subject** — exactly what, with defining details (age/wardrobe/expression for people; make/material/state for objects). Specific beats generic.
2. **Composition & framing** — shot type (close-up / medium / wide / aerial), angle (eye-level / low / high / dutch), focal point, rule-of-thirds or centered, negative space (e.g. space for text overlay on a hero).
3. **Style / medium** — photorealistic / 3D render / flat illustration / isometric / cinematic still — MATCHED to the site personality (`web-design-rules.md`). Name it explicitly.
4. **Lighting** — source + quality + mood (soft diffused / hard dramatic / neon rim / golden hour / studio softbox / volumetric). Lighting sets the emotion.
5. **Color palette** — the client's brand colors by feel and hex reference (e.g. "electric lime #c8f230 accents on near-black"); dominant + accent.
6. **Environment / background** — setting, depth, foreground/background elements, or clean seamless backdrop.
7. **Mood / atmosphere** — the feeling (confident, calm, energetic, premium).
8. **Camera / lens** (for photoreal) — e.g. "35mm, f/1.8, shallow depth of field," "macro," "wide-angle."
9. **Detail & quality cues** — "highly detailed, sharp focus, high resolution" where appropriate.
10. **Aspect ratio** — matched to use (hero 16:9, card 4:3, square 1:1, story 9:16, portrait 4:5).
11. **Negative prompt** — what to exclude (text artifacts, extra fingers, watermark, distortion, clutter, wrong colors).

## Brand consistency (the style spine)
Every prompt in a project shares a look. Pull from `company/media/images/STYLE-GUIDE.md` (create it first from personality + brand): the medium, palette, lighting mood, and any recurring motif. A set of assets must read as ONE brand — reference the spine in each prompt.

## Writing for Imagen specifically
- Natural-language, descriptive sentences work well; front-load the most important elements.
- Be explicit about text: models struggle with rendered text — prefer to add real text in code/overlay, and in the prompt say "no text" (or accept it's approximate). For a logo/wordmark, generate the scene and overlay type in the build.
- Photoreal people: describe without naming real individuals (never a real public figure). Diverse, consistent casting described explicitly if a series.
- Iterate: provide 2–3 **variations** (e.g. different angle / lighting / composition) so the Founder picks the best generation.

## Output file (what you hand the Founder)
Write to `company/media/images/prompts/<feature>-<slot>.md`:
- **Goal / usage** (where it appears, e.g. "hero background, space on left for headline")
- **Generator:** Gemini / Imagen · **Aspect ratio:** …
- **PROMPT:** the full paste-ready text
- **Negative prompt:** …
- **Brand notes:** palette + style spine refs
- **Variations:** 2–3 alternates to try
- **Save output as:** `company/media/images/generated/<filename>` (so the `asset-manifest.md` resolves)

## Guardrails
No real public figures, trademarked characters, or copyrighted art styles ("in the style of <living artist>"). No fabricated brand claims in any text. Generated images are the Founder's to review before use; the site's coded fallback stands if an asset isn't produced. Isolation: a client's style guide/prompts aren't reused elsewhere.

## Common failure modes
Vague prompt → generic stock-looking result · palette not specified → off-brand colors · no aspect ratio → wrong crop · relying on the model for rendered text · no negative prompt → artifacts · one-off prompts with no shared style spine (inconsistent set) · naming a real person/brand.
