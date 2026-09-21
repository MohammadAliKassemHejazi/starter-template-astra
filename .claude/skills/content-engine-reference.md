# Reference: content-engine

Deep detail for `content-engine.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## One source → many outputs
From a single source (report, transcript, feature launch, case study), produce platform-native variants — never copy-paste the same text everywhere:
| Output | Native norms |
|---|---|
| Executive brief | 1 page, decision-first, numbers up front |
| Blog post | 800–1500 words, AEO-structured (see `aeo-seo.md`), one idea per H2 |
| LinkedIn post | 150–250 words, line breaks every 1–2 sentences, hook line stands alone |
| X thread | Hook tweet self-contained; 5–9 tweets; each tweet readable in isolation |
| Newsletter | Personal open, one core idea, one CTA |
| Short-video script | Hook (3s) → payoff structure → CTA; timecoded beats |
| Slide outline | Title + 5–9 content slides + CTA slide; one claim per slide |

## Brand voice
- Per-client voice profile lives in `company/content-voice.md` (create on first content task: tone, banned words, emoji policy, reading level, example paragraphs).
- Every draft is checked against it before delivery. Voice drift across assets = review fail.

## Content calendar
- Cadence per platform from client capacity (sustainable beats ambitious); map weeks × pillars × formats; batch production days.
- Calendar lives in `company/content-calendar.md`: date · platform · pillar · idea-card ref · status (idea/drafted/approved/scheduled).

## File deliverables
Drafts are files, not chat text: markdown in `content/` (repo), or client-ready .docx/slides via `documents.md` when the Founder will forward them. Naming: `YYYY-MM-DD-platform-slug.md`.

## Guardrails
Scheduling/publishing to live channels and any paid distribution = Always-Stop. Every factual claim keeps its source from the research phase.
