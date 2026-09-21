# Reference: documents

Deep detail for `documents.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Which format
| Deliverable | Format | Why |
|---|---|---|
| Proposal, report, audit, SOW | .docx | Client edits + comments; executive formatting |
| Pricing model, ROI calc, budget | .xlsx | LIVE formulas — the client changes an input and totals update |
| Invoice, contract, final signed doc | .pdf | Immutable, print-ready |
| Internal draft, content piece | .md | Repo-versioned, reviewable |

## xlsx rules (the ones that get violated)
- **Formulas, never hardcoded results** — `=SUM(B2:B13)`, not `4820`. A model with pasted numbers is a screenshot, not a model.
- Inputs / calculations / outputs on separate, clearly labeled areas; inputs visually distinct (the client should know what's safe to touch).
- Validate before delivery: recalc pass, zero `#REF!`/`#VALUE!`/`#DIV/0!`, sensible edge behavior (0 quantity, empty rows).

## docx rules
Styles, not manual formatting (Heading 1/2, body style) so client edits don't break layout · client's name/logo placeholder consistency · executive summary first page · page numbers + TOC on 5+ page docs.

## Universal rules
Every number traces to a source (research citation or client-provided figure) · client branding from `business-context.md` · file naming `YYYY-MM-DD-client-deliverable.ext` · output to a `deliverables/` folder, path logged in the daily log · nothing with pricing/legal terms goes out without Founder review (it's client-facing = the Founder sends it, not the team).
