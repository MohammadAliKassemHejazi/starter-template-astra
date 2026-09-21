# Business Context

> The stable, business-model-level truth of THIS client project. The CEO fills
> this during onboarding (fork protocol) and checks every new Founder idea
> against it. Updated only when the business itself changes (Founder-approved).
> Never copied between client repos.

## Client & Project
- Internal (AstraSyntx) — a reusable **starter template**, not a client build. Every future client project forks from it.

## Target Customers
- Our own team: developers who fork this to start client projects fast.

## Value Proposition
- Skip re-building auth/roles/permissions on every project: a working, secure, tested baseline on day one.

## Product Scope — IN
- Backend: Node.js + Express + TypeScript (strict).
- Frontend: Next.js + TypeScript (strict).
- Authentication: register, login, logout, session refresh, protected routes.
- Authorization: roles, permissions, users management (admin CRUD), role/permission assignment.
- Frontend: login/register pages, auth state, route guards, permission-aware UI, basic admin users/roles screens.
- Working local setup, env example, README, tests for auth/RBAC.

## Product Scope — explicitly OUT
- Payments (Stripe/PayPal), AI/RAG, WhatsApp/email campaigns, multi-tenancy, social login, mobile, deployment.

## Stack Deviations from Template Default
- Default stack retained (Express + Sequelize + PostgreSQL + Zod + cookie-JWT; Next.js + Redux Toolkit + Axios; shared Zod package).
- Payment/Stripe/PayPal parts of the default are OUT for this template.

## Optional Execution Tiers (DeepSeek, Jules)
- Client data may be sent to DeepSeek: **no**
- Client data may be sent to Jules: **no**

## Platforms in Use
- None.

## Constraints (budget, timeline, tech, legal, data residency)
- TypeScript only. No paid services. No deploys.
- **Docker is the build/run path (Founder, 2026-09-21):** the whole project (Postgres + server + client) builds and runs via Docker Compose (`docker compose up --build`), and tests run in containers too. Dockerfiles for `server/` and `client/`, compose with healthchecks, migrations/seed on start, `.dockerignore`, no secrets baked into images. Local dev only — no registry pushes or deploys. This also settles the Postgres-availability risk.
- Auth/session/permission model is an Always-Stop decision (Founder approves the design once, before code).

## Standing Founder Preferences
- Founder gives goals in plain language; the team translates to technical work.
- LOW/MEDIUM work proceeds autonomously; HIGH work and Always-Stop items come back for approval.
- **~90% of effort on code, ~10% on reports.** Reports: one-liners, short paragraphs only.
