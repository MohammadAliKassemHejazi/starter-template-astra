# Reference: git-workflow-discipline

Deep detail for `git-workflow-discipline.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Branch naming (matches the team's branch protocol)
- `story/NN-short-name` — one story. `epic/NN-name` — a Team Lead's multi-story stream. `epic/lead-x/name` — when multiple Team Leads run in parallel. `fix/NN-name`, `chore/NN-name`, `spike/NN-name` for their kinds.
- Branch from the current integration branch (`develop` if used, else `main`) at its latest green commit — never from another in-flight stream.
- **Never commit to `main`/`develop` directly.** Only `integration-merge` merges to the shared branch.

## Atomic commits
- One logical change per commit — it should be revertable alone without dragging unrelated work.
- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`, `perf:`, `build:` (+ optional scope: `feat(auth): …`). This drives changelog generation.
- Commit messages say WHY, not just what; imperative mood; body for non-obvious decisions.
- Never commit secrets, `node_modules`, build artifacts, or `.env*` — pre-commit scan the diff.
- Commit compiling, non-broken increments — don't commit red on a shared-bound branch.

## PR workflow
- Small PRs (a 2000-line PR was mis-split — flag to Team Lead). One story/concern per PR.
- PR description template: **What / Why (story link) / How verified (tests + screenshot ref for UI) / Risk & rollback**. Ties to `github-ops.md`.
- PR is green before review: `npm run check` (typecheck + lint + tests) + build pass in CI.
- Required reviews before merge: `code-reviewer` (style/pattern/static analysis) always; `security-auditor` if auth/payments/PII/upload/public-endpoint touched; QA PASS from `qa-devops`.
- Author never self-merges to the shared branch — hand to `integration-merge`.

## Merge strategy
- **Squash-merge** feature branches into integration (clean, one changelog entry per story) is the default; preserve full history only when the individual commits carry real value.
- **Rebase to stay current**: long-lived branches rebase from integration daily to shrink conflict surface (`integration-merge` sequences the final merge).
- **No force-push to shared branches**, ever. Force-push only to your own un-reviewed feature branch.
- Delete merged branches; keep the branch list readable.

## Verification
Before opening a PR: re-run checks fresh, confirm the file list is what you intend (`git diff --name-only`), no stray/secret files (`verification-discipline.md`). 

## Common failure modes
Committing to main directly · giant multi-concern PR · secret in a commit (rewrite history + rotate — it's leaked) · force-push clobbering a teammate · branch from an in-flight branch (inherits its churn) · self-merge skipping review · merge conflicts resolved by deleting the other side.
