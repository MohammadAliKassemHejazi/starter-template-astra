# Skill: Engineering Craft (how to change a codebase well)

> Load for every non-trivial coding task, by every implementing agent. This is
> the standing approach to writing and changing code — the discipline that
> keeps a codebase coherent as many agents work in it across many sprints.

Four rules that carry most of the weight:
1. **Understand before changing.** Read the surrounding code and trace the real path before editing. A change made without understanding is a guess wearing the costume of a fix.
2. **Surgical edits.** Change what the story requires and nothing else. Opportunistic rewrites, drive-by reformatting, and unrequested "improvements" inflate review, blast radius, and merge conflicts.
3. **Simplicity beats cleverness.** The simplest thing that satisfies the acceptance criteria and the conventions wins. Abstractions are earned by a third real use, not anticipated.
4. **Fix root causes, not symptoms.** A patch that makes the error disappear without explaining WHY it happened is a deferred incident.

Full doctrine, the pre-edit checklist, debugging method, and failure modes: `engineering-craft-reference.md`.
