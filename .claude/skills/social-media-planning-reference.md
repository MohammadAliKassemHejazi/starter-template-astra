# Reference: social-media-planning

Deep detail for `social-media-planning.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Division of labor
- `content-marketing`: pillars, voice, trends, the copy itself.
- `media-prompt-director` (this skill): the **calendar**, the per-post **spec**, and the **generation prompts** for each post's image/video (via `image-prompt-generation.md` / `video-prompt-generation.md`).

## The calendar (`company/social/calendar.md`)
A dated plan: `date · platform · pillar · format · hook/angle · media (image/video + prompt ref) · copy ref · status`. Cadence from client capacity (sustainable beats ambitious); batch by pillar; balance formats. Plan in weeks; leave room for trend-jacking (a slot for timely content).

## Per-platform native specs (respect these)
- **Instagram**: feed 4:5 (portrait) or 1:1; Reels/Stories 9:16; carousel 1:1 or 4:5, one idea per slide, last slide = CTA.
- **TikTok / Reels / Shorts**: 9:16 vertical video, hook in first 1–3s, 15–45s.
- **LinkedIn**: 1:1 or 4:5 image, or native video; document/carousel PDF for B2B; professional voice.
- **X**: 16:9 image or short video; hook tweet stands alone.
- **Facebook**: 1:1 / 4:5; video 9:16 for reels.
Match aspect ratio + length to the platform in every post's media prompt.

## Per-post spec (`company/social/posts/<date>-<platform>-<slug>.md`)
- **Platform · date/time · pillar · format**
- **Hook** (the scroll-stop — first line/frame)
- **Copy** (from content-marketing, in brand voice) + hashtags + CTA
- **Media**: what asset + a reference to its generation prompt in `company/social/prompts/`
- **Status**: idea / prompt-ready / media-generated / copy-approved / scheduled (Founder posts)

## Media prompts for posts
Each post needing an image/video gets a prompt file in `company/social/prompts/` following the image/video prompt skills — on-brand (shared style spine), correct aspect ratio for the platform, ready for the Founder to run in Gemini and drop into `generated/`.

## Content system (with content-marketing)
One source → many posts (`content-engine.md`): a case study becomes a carousel + a reel + a LinkedIn post + an X thread, each platform-native, not the same text pasted. Ideas live in `company/social/` as an appendable backlog; trends verified via search (`viral-trends.md`), no fabricated stats.

## Guardrails
Scheduling/publishing to real channels + paid boosting = Always-Stop (Founder posts). No fabricated claims/stats in captions; no real public figures or copyrighted media in generated assets. Consent/disclosure for any client customer featured. Isolation: one client's content/calendar never reused for another.

## Common failure modes
Same text pasted across platforms (not native) · wrong aspect ratio per platform · no hook (dies in feed) · calendar with no trend slack · publishing without Founder approval · fabricated stats in a caption · media prompts off-brand (no shared spine) · planning posts with no owner for the copy.
