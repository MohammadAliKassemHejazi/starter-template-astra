# ADR-NNNN — <decision title>

**Status:** Proposed / Accepted / Superseded by ADR-MMMM / Deprecated
**Date:** YYYY-MM-DD
**Deciders:** <system-architect + who approved — Founder for cost/security/data-implicating decisions>
**Tier:** HIGH (architecturally significant decisions are HIGH by definition)

> Append-only. To change a decision, write a NEW ADR that supersedes this one and
> flip this one's status to "Superseded by ADR-MMMM" — never edit the decision away.
> Technical decisions live here (docs/adr/); business decisions live in
> company/decision-log.md. docs-sync keeps the cross-references intact.

## Context
<The forces at play: the problem, constraints (from business-context.md), non-functional requirements (scale, latency, consistency, security, cost), and what makes this decision necessary now. State assumptions explicitly.>

## Options Considered
### Option A — <name>
- Pros:
- Cons:
- Cost / complexity:
### Option B — <name>
- Pros:
- Cons:
- Cost / complexity:
### Option C — <name> (if any)
- …

## Decision
<The option chosen and the reasoning — why this trade-off is right for THIS client. Tie back to the Three Pillars / non-functionals / business context.>

## Consequences
- **Positive:** <what this enables>
- **Negative / accepted trade-offs:** <what we give up, what debt we take on>
- **Follow-up work / new boundaries or contracts introduced:** <impact on services, `@project/shared` contracts, other ADRs>
- **Always-Stop items triggered:** <new paid infra, PII data flow, external trust — routed to Founder>

## Verification
<How we'll know the decision was right — the signal to watch, and when we'd revisit.>
