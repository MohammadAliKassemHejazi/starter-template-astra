# Website Build Brief

> Use for every MEDIUM or HIGH website task. Keep it decision-oriented. Link supporting wireframes, ADRs, contracts, and security reviews instead of duplicating them.

## 1. Outcome

| Field | Decision |
|---|---|
| Project / story | `<identifier and title>` |
| User problem | `<what user problem this work solves>` |
| Primary audience | `<who uses it and any role distinctions>` |
| Primary journey | `<entry → key action → success state>` |
| Success signal | `<measurable or observable outcome>` |
| Scope in | `<included routes, features, integrations>` |
| Scope out | `<explicit non-goals>` |
| Constraints | `<brand, technical, legal, performance, content, accessibility>` |

## 2. Information architecture and journeys

| Route / surface | User intent | Primary action | Data needed | States to design | Owner |
|---|---|---|---|---|---|
| `/example` | `<intent>` | `<action>` | `<data contract>` | Loading / empty / error / denied | `<agent>` |

Describe the happy path, one expected failure path, and one unauthorized or unavailable path in plain language. State what happens after each primary action.

## 3. Component and content map

| Area | Reusable primitive | Feature component | Content source | Responsive behavior | Accessibility notes |
|---|---|---|---|---|---|
| `<page section>` | `<existing / new>` | `<component>` | `<CMS / API / static>` | `<mobile behavior>` | `<semantics, keyboard, announcements>` |

## 4. Design-system contract

| Decision | Selected value | Reason / evidence | Exception owner |
|---|---|---|---|
| Personality | `<e.g., calm editorial, high-trust utility>` | `<brand or brief reference>` | `<name>` |
| Tokens | `<existing token set / additions>` | `<why needed>` | `<name>` |
| Type and hierarchy | `<scale / roles>` | `<readability and hierarchy>` | `<name>` |
| Layout | `<Grid/Flex and breakpoint approach>` | `<content behavior>` | `<name>` |
| Motion | `<purpose, duration, reduced-motion behavior>` | `<user benefit>` | `<name>` |

## 5. Technical blueprint

| Concern | Decision | Boundary / owner | Evidence needed |
|---|---|---|---|
| Route composition | `<thin route + feature>` | `<route / feature>` | `<test or screenshot>` |
| Data contract | `<schema and source>` | `<feature / backend>` | `<contract test>` |
| State | `<server, URL, local client>` | `<feature>` | `<interaction test>` |
| Error model | `<user-safe message + typed error>` | `<feature / API>` | `<negative test>` |
| Observability | `<events/logs/health>` | `<backend / QA>` | `<safe log evidence>` |

## 6. Security and CIA impact

| Question | Answer / linked review |
|---|---|
| Data classification and retention | `<public / internal / confidential / restricted; retention need>` |
| Roles and authorization rule | `<who may do what, enforced where>` |
| New trust boundary or third party | `<yes/no; link contract and security review>` |
| CIA control impact | `<confidentiality / integrity / availability controls affected>` |
| Threats and residual risks | `<link templates/security-design-review.md or explain why not required>` |
| Always-Stop decision needed | `<yes/no; link decision request>` |

## 7. Acceptance and proof plan

| Requirement | Test or review | Owner | Passing evidence |
|---|---|---|---|
| `<user outcome>` | `<unit/integration/E2E/manual>` | `<agent>` | `<command, artifact, or recorded result>` |
| `<accessibility>` | `<keyboard, a11y tree, screen-reader-oriented check>` | `<agent>` | `<result>` |
| `<responsive UI>` | `<agreed viewport screenshots>` | `<agent>` | `<artifact path>` |
| `<security requirement>` | `<authorization/validation/rate-limit test>` | `<agent>` | `<result>` |
| `<availability/failure path>` | `<dependency-failure or recovery test>` | `<agent>` | `<result>` |

## 8. Approvals and handoff

| Item | Status | Owner | Reference |
|---|---|---|---|
| Scope and acceptance criteria | `<draft / approved>` | `<name>` | `<link>` |
| Design-system decisions | `<draft / approved>` | `<name>` | `<link>` |
| Security design review | `<not needed / complete / escalated>` | `<name>` | `<link>` |
| QA verification plan | `<draft / approved>` | `<name>` | `<link>` |
