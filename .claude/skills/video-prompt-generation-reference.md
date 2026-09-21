# Reference: video-prompt-generation

Deep detail for `video-prompt-generation.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Prompt anatomy (image elements + the time dimension)
Start from the image anatomy (`image-prompt-generation.md`: subject, composition, style, lighting, palette, mood), then add:
1. **Camera motion** — static / slow dolly-in / pull-back / pan L-R / orbit / crane / handheld drift / tracking. Name the move and its speed ("slow," "smooth").
2. **Subject motion** — what moves and how (a person turns and smiles; product rotates; particles drift; liquid pours).
3. **Duration** — target length (Veo clips are short — plan 4–8s beats; loops for hero backgrounds).
4. **Pacing / energy** — calm and slow vs fast and dynamic (match personality).
5. **Shot sequence** (for multi-beat) — a short shot list: Shot 1 (establishing) → Shot 2 (detail) → Shot 3 (payoff), each with its own framing + motion.
6. **Transitions** — cut / dissolve / match-cut / whip-pan between beats (if multi-shot).
7. **Loop requirement** — for ambient hero video, specify "seamless loop, first and last frame match."
8. **Lighting continuity + color grade** — consistent across the clip; the brand palette as a grade.
9. **Ambience / audio note** — mood of sound if relevant (though often muted for web hero; note it).
10. **Aspect ratio** — 16:9 (hero/landscape), 9:16 (reels/stories/TikTok), 1:1 (feed).
11. **Negative / avoid** — flicker, morphing artifacts, warping faces/hands, jarring cuts, text distortion.

## Web-usability constraints (so the clip actually ships)
- Hero background video: short, **seamless loop**, muted, subtle motion (not distracting), able to sit behind text — say "space/low-contrast area for headline," and it must respect `motion-design.md` (a static poster fallback always exists; `prefers-reduced-motion` shows the poster).
- Keep motion GPU-friendly and file size reasonable (`performance-benchmarking.md`): note target that the Founder exports compact MP4 + WebM.

## Brand consistency
Same style spine as images (`STYLE-GUIDE.md`) — palette, mood, medium — so video matches the stills. Reference it in every prompt.

## Output file (what you hand the Founder)
Write to `company/media/video/prompts/<name>.md`:
- **Goal / usage** (e.g. "hero ambient loop behind headline")
- **Generator:** Gemini / Veo · **Aspect ratio:** … · **Target duration:** … · **Loop:** yes/no
- **SHOT LIST** (if multi-beat): Shot 1 … Shot 2 …
- **PROMPT:** the full paste-ready text (subject + composition + style + lighting + palette + camera motion + subject motion + pacing)
- **Avoid:** artifacts/negatives
- **Brand notes:** style spine refs
- **Variations:** 2–3 alternates (different camera move / pacing)
- **Export + save as:** `company/media/video/generated/<filename>` (+ note: also export WebM, compress) so the `asset-manifest.md` resolves; and the coded fallback (poster/gradient) if not produced.

## Guardrails
No real public figures / trademarked characters / copyrighted footage or music. No fabricated claims in any on-screen text. Generated video is the Founder's to review; coded fallback stands if not produced. Isolation per client.

## Common failure modes
No camera/subject motion specified → static or random result · duration unrealistic for the generator · hero loop not seamless (visible jump) · motion too busy behind text · face/hand warping (add to negatives) · no poster fallback planned · wrong aspect ratio for the platform · video that ignores reduced-motion.
