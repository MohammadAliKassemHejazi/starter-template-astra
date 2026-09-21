# AstraSyntx AI Team Template — Enhanced Edition

Copy this `.claude/` folder into a client repository, then follow the **Per-Client Fork Protocol** at the end of `CLAUDE.md`. The team’s operating rules stay in this folder so product code remains focused on the client application.

```text
.claude/
├── CLAUDE.md          ← operating protocol, routing, gates, quality bar
├── README.md          ← adoption guide
├── settings.json      ← reviewed project-local safety hook configuration
├── hooks/             ← deterministic, version-controlled hook scripts
├── agents/            ← role definitions and separation of duties
├── skills/            ← task-specific guidance, loaded only when assigned
├── company/           ← per-client context, decisions, and sprint records
├── templates/         ← decision-ready working artifacts
└── docs/              ← binding engineering conventions and MCP/hook setup

.mcp.json              ← optional, reviewed project MCP configuration at repository root
```

## What this edition enforces

| Objective | Where it is enforced | Result |
|---|---|---|
| **Structured websites** | `skills/website-delivery.md`, `templates/website-build-brief.md`, `docs/CONVENTIONS.md` | Websites are planned from user journeys, route/feature boundaries, design tokens, states, and proof—not from a disconnected component list. |
| **Secure-by-design CIA controls** | `templates/security-design-review.md`, `agents/security-auditor.md`, `agents/system-architect.md` | Confidentiality, Integrity, and Availability requirements are designed, assigned, tested, and reviewed at relevant trust boundaries. |
| **Consistent, understandable code** | `docs/CONVENTIONS.md`, `agents/code-reviewer.md`, `agents/frontend-dev.md` | Feature-oriented structure, clear naming, typed boundaries, predictable errors, and deliberate reuse make code easier to navigate and maintain. |
| **Design quality and accessibility** | `agents/css-scss-developer.md`, `agents/threejs-engineer.md`, `skills/web-design-rules.md`, QA protocol | Design-system decisions, responsive behavior, accessible interaction states, rendered evidence, and safe 3D fallbacks become part of Done. |
| **Token-efficient collaboration** | `skills/token-efficiency.md`, `CLAUDE.md`, `agents/team-lead.md` | The team uses just-in-time context, exact response shapes, focused handoffs, and concise evidence without skipping gates or verification. |
| **Structural awareness (project graph)** | `skills/project-graph.md`, `agents/team-lead.md`, `agents/system-architect.md` | Before changing shared code, contracts, or an unfamiliar area, the team derives the real import/feature/contract graph and blast radius from code, and checks for cycles and boundary violations. |
| **UI library selection** | `skills/ui-libraries.md` | The most popular, well-maintained, accessible component libraries are chosen once per project (default Tailwind + shadcn/ui + Radix), recorded in an ADR, and loaded only when the choice is made. |
| **Optional MCP and hooks** | Root `.mcp.json`, `.claude/settings.json`, `.claude/hooks/safety-guard.mjs`, `docs/MCP_AND_HOOKS.md` | A public documentation MCP is available for approval, while a narrow local hook blocks only defined destructive commands and secret-file writes. |

## Start a client project

1. Copy `.claude/` into the client repository.
2. In the first session, have the CEO complete `company/business-context.md` with the client, scope, stack, users, constraints, and known decisions.
3. Keep `company/ceo-memory.md`, `company/decision-log.md`, and the sprint records client-specific. Do not copy them across projects.
4. Ask the CEO for a project outcome. The Team Lead classifies it, assigns only the required roles and skills, and names an expected response shape.
5. For MEDIUM or HIGH website work, complete `templates/website-build-brief.md` before implementation. Complete `templates/security-design-review.md` whenever the work crosses a security trigger. For real-time 3D work, also define the asset manifest, Three.js/R3F boundary, quality tiers, reduced-motion path, and non-WebGL fallback before build.
6. Review the final result against `docs/CONVENTIONS.md`, the Definition of Done in `CLAUDE.md`, and the fresh QA/security evidence.
7. Start Claude Code in the repository, review and approve the public project MCP if you want it, then use `/mcp` to verify its state. Review `docs/MCP_AND_HOOKS.md` before adding any server, credential, write capability, or extra hook.

## How the work remains token-efficient

The team does not shorten work by omitting essential controls. Instead, it removes waste: no needless skill preloading, duplicate research, full-file dumps, raw command logs, overlapping specialist work, or long explanations of settled decisions. MEDIUM and HIGH assignments include the `token-efficiency.md` policy, a compact handoff, and a precise response shape; LOW work remains direct and terse.

> **Non-negotiable:** Founder gates, CIA controls, accessibility, independent review, and fresh verification are never reduced to save tokens.

## Claude Code compatibility

If the installed Claude Code version automatically reads only a root-level `CLAUDE.md`, create a one-line root stub:

```md
Read .claude/CLAUDE.md and follow it.
```

Then treat `.claude/CLAUDE.md` as the binding routing hub for every session.
