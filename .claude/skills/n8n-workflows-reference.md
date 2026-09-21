# Reference: n8n-workflows

Deep detail for `n8n-workflows.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Platform choice
- **n8n** (default for AstraSyntx): self-hostable (client owns it, no per-task fees), 400+ nodes, code nodes for gaps. Cloud when the client won't host.
- **Make/Zapier**: only when the client already lives there — meet them where they are, note the per-operation pricing in estimates.

## The build-vs-platform rule
Workflow platform when: client staff must edit it later · glue between SaaS tools · < ~15 nodes of logic. Custom code when: core product logic · heavy data transformation · needs tests and types. A 40-node n8n spaghetti is worse than 80 lines of TypeScript — flag it in grooming.

## n8n doctrine
- Trigger → nodes → error workflow. EVERY production workflow has an attached error workflow (alert + context), never silent failures.
- Credentials in n8n's credential store only — never hardcoded in node parameters or Code nodes. Code nodes run in TypeScript mode; complex logic graduates to a typed webhook service instead of growing inside a Code node.
- Webhook nodes: respond immediately, process after (same async doctrine as code webhooks); validate payloads before acting.
- Idempotency: dedupe by external event ID in a first node — platforms retry.
- **Version control**: export workflow JSON into the repo (`automations/n8n/`) on every change; the n8n instance is runtime, the repo is truth.
- Rate limits: batch + wait nodes on any loop over contacts/records; never raw-loop a 5k-row sheet into an API.

## Guardrails
Activating a workflow that reaches real customers or moves money = Always-Stop (build inactive, Founder flips it). Client platform credentials handled per the isolation guardrail.
