#!/usr/bin/env bash
# Creates the per-client media/social/product/feedback folder trees + seed files.
# Idempotent. Called by bootstrap.sh or directly by the CEO/media-prompt-director.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
C="$ROOT/.claude/company"

mkdir -p "$C/media/images/prompts" "$C/media/images/generated" \
         "$C/media/video/prompts" "$C/media/video/generated" \
         "$C/social/posts" "$C/social/prompts" \
         "$C/product" "$C/feedback"

seed(){ [ -f "$1" ] || printf '%s\n' "$2" > "$1"; }

seed "$C/media/images/STYLE-GUIDE.md" "# Visual Style Guide (the brand spine)

> Filled by media-prompt-director on the first media task, from the website
> personality (web-design-rules.md) + business-context.md. Every image/video
> prompt references this so all generated assets look like ONE brand.

## Personality: (from business-context)
## Palette: (primary + accent hex, e.g. electric lime #c8f230 on near-black)
## Medium/style: (photoreal / 3D render / illustration)
## Lighting & mood:
## Recurring motif / signature:
## Do / Don't:"

seed "$C/media/README.md" "# Media assets

- images/prompts/ — one prompt file per needed image (run in Gemini/Imagen)
- images/generated/ — drop Gemini output here (filename referenced by asset-manifest)
- video/prompts/ — shot list + Veo prompt per clip
- video/generated/ — drop exported clips here (MP4 + WebM, compressed)
Workflow: media-prompt-director writes prompts -> Founder generates in Gemini ->
Founder saves output to generated/ with the given filename -> asset-manifest resolves."

seed "$C/social/calendar.md" "# Social Media Calendar

> Planned by media-prompt-director with content-marketing. Publishing is
> Always-Stop — the Founder posts. Statuses: idea / prompt-ready /
> media-generated / copy-approved / scheduled.

| Date | Platform | Pillar | Format | Hook/angle | Media (prompt ref) | Copy ref | Status |
|------|----------|--------|--------|-----------|--------------------|----------|--------|
"

seed "$C/social/README.md" "# Social content

- calendar.md — the dated plan
- posts/ — one file per post (copy + media ref + status)
- prompts/ — image/video generation prompts per post (run in Gemini)"

seed "$C/feedback/feedback-log.md" "# Feedback Log (clustered)

> Maintained by support-triage. Clustered issues with counts + status. No raw
> PII — reference ticket IDs. Bugs -> Team Lead; feature needs -> product-manager.

| Cluster / issue | Type | Count | Severity | Status | Routed to |
|-----------------|------|-------|----------|--------|-----------|
"

seed "$C/jules-lessons.md" "# Jules Lessons

> Read automatically by run-jules-task.mjs create and appended to every new
> prompt sent to Jules. Written by whichever specialist reviews a Jules PR
> and fixes an issue — mandatory, not optional. Cap ~150 lines; roll old
> entries into a dated summary when exceeded.

*(no lessons recorded yet)*"

seed "$C/product/README.md" "# Product specs

PRDs, user-journey maps, wireframe specs — authored by product-manager BEFORE
code, feeding team-lead grooming. One file per feature: prd-<feature>.md."

echo "Folders scaffolded under $C (media/, social/, product/, feedback/)"
