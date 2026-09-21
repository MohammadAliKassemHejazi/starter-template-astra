# Reference: finops-cost

Deep detail for `finops-cost.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Principle: cost is a design property, not an afterthought
Every HIGH-tier architecture states its cost shape (fixed monthly + per-unit + what scales with traffic) in the grooming report. A design nobody costed is a surprise invoice.

## Track before you optimize
- **Budgets + alerts first**: AWS Budgets, Cloudflare/Vercel/Heroku spend alerts configured per client account BEFORE resources run. Tag every resource `client` + `project` for attribution.
- **Cost per unit that matters**: per 1k LLM interactions, per GB egress, per 1M requests, per active user — the number the Founder can reason about.

## The usual SMB cost sinks (check these)
- **Egress/bandwidth**: cross-cloud/CDN transfer; large unoptimized media (tie to `performance-benchmarking.md` — compressed assets cut bandwidth AND cost). Cloudflare R2 (zero egress) vs S3 egress.
- **Always-on for spiky load**: provisioned concurrency, idle dynos, NAT gateways for one cron — fixed cost nobody planned. Prefer scale-to-zero where latency allows.
- **LLM/API tokens**: model choice per task (the tier→model map already does this — haiku for LOW, opus only for HIGH), caching of embeddings/responses, prompt/context size (`token-efficiency.md`), batch where possible. Log cost per feature.
- **Over-provisioned DB/instances**: right-size to real usage; dev-tier for staging; watch connection-limit upgrades.
- **Logs/retention**: unset retention = infinite = cost; set it (`aws.md`, `heroku.md`).
- **Zombie resources**: unused indexes (write cost), orphaned buckets/volumes, forgotten preview envs.

## Optimization workflow
1. Attribute (tags) → 2. Find the top 3 cost drivers (not micro-optimize the trivial) → 3. Propose changes with $ impact + any trade-off (latency, resilience) → 4. Founder approves → 5. Verify the spend actually dropped (re-check the bill, don't assume — `verification-discipline.md`).

## Token FinOps (the agency's own runner cost)
On-demand skill loading (never bulk-inject the catalog), compact agent handoffs (bullets/JSON not prose), targeted file reads over full dumps, fresh short sessions per task, model-by-tier. These are `token-efficiency.md`'s rules — this skill frames them as cost control.

## Guardrails
Provisioning paid resources, plan upgrades, reserved capacity = Always-Stop (prepare the IaC/plan + $ estimate, Founder buys). Never optimize cost by weakening backups, security, or a11y. Cost reports use real billing numbers, re-pulled.

## Common failure modes
No budget alert → runaway bill · optimizing a $2/mo line while a $400 NAT gateway runs · provisioned concurrency for spiky traffic · uncompressed media inflating egress · opus for LOW tasks · retention unset · preview envs never torn down · "we saved money" without checking the next invoice.
