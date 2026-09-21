# Sprint Backlog — 01 Auth + RBAC
| ID | Task | Acceptance criteria | Assignee | Review |
|---|---|---|---|---|
| S0 | Monorepo scaffold: workspaces, tsconfig strict, lint, `npm run check` per package, .env.example | `npm install && npm run check` green in all 3 pkgs | qa-devops | code-reviewer |
| S1 | shared: envelope ApiResponse, auth/user/role Zod schemas, enums, permission keys | shared typecheck+tests pass, zero backend deps | backend-node | code-reviewer |
| S2 | server auth core: User/RefreshToken models+migrations, argon2id, JWT cookies, refresh rotation+reuse detection, CSRF, tiered rate limit, ALLOW_REGISTRATION | register/login/logout/refresh/me integration tests pass on real Postgres | backend-node | code-reviewer + security-auditor |
| S3 | server RBAC: Role/Permission models, seeders, requirePermission middleware, admin users/roles/assignment API | 401/403/allow matrix tests pass; last-admin protected | backend-node | code-reviewer + security-auditor |
| S4 | server Swagger + Winston + response-standardizer + error handler | openapi valid; envelope on every route | backend-node | code-reviewer |
| S5 | client auth: Axios+CSRF, Redux auth slice, login/register pages, route guards | component/unit tests pass; keyboard-usable forms | frontend-dev | code-reviewer + a11y-auditor |
| S6 | client admin: users + roles/permissions screens, permission-aware UI | tests pass; a11y ok | frontend-dev | code-reviewer + a11y-auditor |
| S7 | Playwright e2e: register→login→admin→logout, forbidden path | e2e green | qa-devops | qa |
| S8 | README (run steps, password-reset gap flagged), docs sync | README commands verified | docs-sync | code-reviewer |
