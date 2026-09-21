# Reference: vercel

Deep detail for `vercel.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Platform facts
- **Preview deploys per PR** are automatic — the review URL goes in the PR description; env vars are scoped per environment (Development/Preview/Production) — a preview accidentally using production keys is a real incident, audit the scoping.
- **Functions**: serverless (Node, regional, longer limits) vs edge (V8 isolates, global, fast, restricted APIs — same constraints as Cloudflare Workers). Duration/payload limits vary by plan — check before designing long tasks; anything > limits goes to a queue + worker elsewhere.
- **ISR/revalidation**: `revalidate` per route or on-demand `revalidatePath/Tag` — the cache model for content sites; stale content bugs are almost always missing revalidation calls after CMS writes.
- **Cron**: `vercel.json` crons hit route handlers — idempotent handlers, auth the endpoint (cron routes are public URLs; verify the `CRON_SECRET` header).
- **Monorepo**: root directory + build settings per project; shared packages need transpilation config.

## Doctrine
`vercel.json` + env var NAMES documented in the repo; values via dashboard (Founder) · domains/DNS changes are client-visible → coordinate · production deploys and plan changes = Always-Stop (preview deploys are fine — they're the point) · logs are short-retention → drain to a target for production.

## Common failure modes
Preview using prod database (env scoping) · function timeout on a task that needed a queue · missing revalidation after content update · cron endpoint unauthenticated · build passing locally, failing on Vercel's case-sensitive filesystem.
