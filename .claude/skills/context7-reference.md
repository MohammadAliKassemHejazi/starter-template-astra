# Reference: context7

Deep detail for `context7.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Workflow
1. Read the exact version from `package.json` / lockfile — never assume latest.
2. Resolve the library ID via Context7, then fetch docs scoped to that version and the specific API surface the task touches.
3. Code against the fetched docs, not memory. If fetched docs contradict what you "know," the docs win — log the discrepancy.

## When it's mandatory (not optional)
- Any API that has changed across majors (Next.js App Router APIs, Prisma client methods, Expo SDK modules).
- Any error suggesting a signature mismatch ("X is not a function", unexpected-argument type errors) — check current docs BEFORE trial-and-error edits.
- Writing integration code for a library added to the repo less than ~18 months ago.

## Token economy
Fetch only the pages for the APIs in play — never whole-library dumps. Quote the 2–5 relevant lines into the daily log for reviewers, link the rest.
