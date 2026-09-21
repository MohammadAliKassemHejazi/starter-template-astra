# Skills Index

One line per skill. The Team Lead names skills per task assignment; agents load
ONLY what's named. (MCP) = requires a connected MCP server; each such skill
states its fallback.

Every skill below is two files: `<name>.md` (lean — confirms relevance) and
`<name>-reference.md` (the actual doctrine, tables, and failure modes). Load
the reference file when implementing; the lean file alone is enough to decide
applicability.

## Messaging & Business Automation
| Skill | One-liner | Primary users |
|---|---|---|
| `whatsapp.md` | Cloud API, 24h window, templates, quality rating, opt-in | automation-integrations |
| `brevo.md` | Transactional vs campaign email/SMS, DKIM, suppression | automation-integrations |
| `payment-architecture.md` | Cart checkout + subscriptions, webhook idempotency, row-lock inventory reservation — required before any payment code | backend-node, security-auditor |
| `ecommerce-crm.md` | Payments doctrine, order state machine, lead lifecycle | automation-integrations, backend-node |
| `n8n-workflows.md` | n8n/Make/Zapier: build-vs-platform rule, error workflows, JSON in repo | automation-integrations |
| `cms-platforms.md` | WordPress & Shopify integration — meet the client's platform | automation-integrations, frontend-dev |

## AI Engineering
| Skill | One-liner | Primary users |
|---|---|---|
| `rag-advanced.md` | Chunking, hybrid search, reranking, two-layer evals, index ops | ai-engineer |
| `voice-ai.md` | Voice agents: latency budget, barge-in, call state machines, consent | ai-engineer |
| `scraping-ingestion.md` | Legal-first scraping, idempotent ingestion, provenance | ai-engineer, backend-node |

## Deployment, Launch & Ops
| Skill | One-liner | Primary users |
|---|---|---|
| `production-deployment-gsc.md` | End-to-end launch: build, DNS/SSL, robots/sitemap, GSC verify+submit | qa-devops, growth-seo-specialist |
| `uptime-monitoring-alerting.md` | Synthetic checks, status pages, Slack/Discord alert webhooks | qa-devops |
| `backup-disaster-recovery.md` | DB snapshots, PITR, tested restores, rollback runbook | qa-devops, backend-node/nextjs |
| `conversion-tracking-pixels.md` | GTM/GA4/Meta setup SOP, server-side dedupe, custom conversions | automation-integrations, growth-seo-specialist, data-analytics |
| `cookie-consent-banners.md` | GDPR/CCPA consent, Cookiebot/Klaro, Consent Mode v2 | automation-integrations, security-auditor |

| `finops-cost.md` | Cloud + token cost tracking, budgets, the usual SMB cost sinks, optimization | qa-devops, system-architect |
| `mobile-store-release.md` | EAS/Fastlane, TestFlight, Play tracks, OTA-vs-native, signing/credentials | qa-devops (mobile), frontend-dev |

## Cloud & Deployment
| Skill | One-liner | Primary users |
|---|---|---|
| `cloudflare.md` | Workers, KV/R2/D1 tradeoffs, WAF, wrangler | qa-devops |
| `aws.md` | Lambda/S3/ECS, IAM least-privilege, cost guardrails | qa-devops |
| `heroku.md` | Dynos, release phase, sleeping-dyno traps | qa-devops |
| `vercel.md` | Preview deploys, edge vs serverless, ISR, cron auth | qa-devops, frontend-dev |

## Engineering Craft (MCP-backed where marked)
| Skill | One-liner | Primary users |
|---|---|---|
| `api-design.md` | Versioning, cursor pagination, idempotency, OpenAPI contract | backend-node, backend-nextjs |
| `context7.md` | (MCP) Live version-specific library docs — kills API hallucination | backend-node, backend-nextjs, frontend-dev |
| `playwright-testing.md` | (MCP) Real-browser E2E verification, a11y-tree-first | qa-devops, frontend-dev |
| `github-ops.md` | (MCP) PR/issue/release cycles, Linear/Jira mirroring | all specialists |
| `sentry-triage.md` | (MCP) Production error triage, PII-safe reporting | backend-node, qa-devops |
| `postgres-safety.md` | (MCP) Schema inspection, migration lock analysis, batched backfills | backend-node, data-analytics |
| `mobile-expo.md` | EAS builds, OTA limits, push, store realities | frontend-dev |
| `git-workflow-discipline.md` | Branch naming, atomic/conventional commits, PR + merge strategy | all specialists, code-reviewer |
| `engineering-craft.md` | Understand-before-change, surgical edits, simplicity, root-cause debugging — the standing coding approach | all implementing agents, code-reviewer |
| `test-driven-development.md` | Red-green-refactor, test pyramid, real-DB integration tests | all engineering agents |
| `performance-benchmarking.md` | Core Web Vitals, bundle analysis, k6 load testing | qa-devops, frontend-dev, growth-seo-specialist |
| `website-delivery.md` | Website brief, feature structure, accessible design, CIA controls, evidence | team-lead, frontend-dev, css-scss-developer, threejs-engineer, system-architect, qa-devops, security-auditor |

## Data & Analytics
| Skill | One-liner | Primary users |
|---|---|---|
| `data-pipelines.md` | ELT layering, incremental idempotent loads, quality gates | data-analytics |
| `dashboards-kpis.md` | KPI trees, metric definitions doc, 5-second dashboards | data-analytics |

## Architecture & Structure
| Skill | One-liner | Primary users |
|---|---|---|
| `project-graph.md` | Graphify: import/feature/route/contract graph, impact & blast-radius analysis, cycle & boundary checks (madge/dependency-cruiser/ts-morph) | team-lead, system-architect (any specialist for impact analysis) |

## Discipline & Reliability
| Skill | One-liner | Primary users |
|---|---|---|
| `verification-discipline.md` | Re-run don't quote, anti-fabrication, live-data safety, async hygiene | ALL — load before self-reporting |
| `token-efficiency.md` | Just-in-time context, minimal sufficient workflow, focused output and handoffs | ALL — Team Lead names for MEDIUM/HIGH work |

## Security & Compliance
| Skill | One-liner | Primary users |
|---|---|---|
| `security-audit.md` | Audit sequence, authz matrix/IDOR testing, report format | security-auditor |
| `gdpr-compliance.md` | Data map, consent, DSRs in code, DPAs, breach path | security-auditor, ceo |
| `compliance-extended.md` | HIPAA / SOC 2 / CCPA / OSS-license scanning — controls + evidence | security-auditor, ceo |

## Design & Styling
| Skill | One-liner | Primary users |
|---|---|---|
| `web-design-rules.md` | Personalities, typography, color, spacing, hierarchy, UX — the design bible | css-scss-developer, frontend-dev |
| `css-architecture.md` | Three Pillars, BEM, 7-1 SCSS, specificity, responsive, Flexbox-vs-Grid | css-scss-developer, frontend-dev |
| `motion-design.md` | Personality-matched motion, timing/easing, per-section strategy, 3D/WebGL coordination, perf + reduced-motion | framer-motion-engineer, gsap-engineer, threejs-engineer, css-scss-developer |
| `site-uniqueness-research.md` | Signature-feel research, competitor scan, per-section concept, asset planning | framer-motion-engineer, gsap-engineer, threejs-engineer, css-scss-developer, content-marketing |
| `ui-libraries.md` | Popular UI component libraries (shadcn/Radix/MUI/Mantine…) — pick ONE per project; lean decision table | frontend-dev, css-scss-developer, system-architect (load only when choosing a library) |
| `design-tokens.md` | Figma↔code token pipeline (Style Dictionary, semantic tiers, theming, a11y-safe pairs) | css-scss-developer, frontend-dev |
| `shared-contracts.md` | zod-first shared request/response types, dual validation, one contract both sides import | backend-node, backend-nextjs, frontend-dev |
| `jules-delegation.md` | OPTIONAL async cloud execution tier — Jules clones the repo, may ask questions, opens its own PR; auto-detected + live-validated via JULES_API_KEY | team-lead (classification), every implementing specialist |
| `deepseek-delegation.md` | OPTIONAL execution tier — Claude architects + writes the implementation brief, DeepSeek implements it, Claude reviews every line; auto-active when DEEPSEEK_API_KEY is set | team-lead (classification), every implementing specialist |
| `optional-tooling.md` | Free frontend/AEO/SEO plugins — REACTIVE only, reach for after a review finds a specific gap | frontend-dev, css-scss-developer, growth-seo-specialist, qa-devops, code-reviewer |

## Media & Creative
| Skill | One-liner | Primary users |
|---|---|---|
| `image-prompt-generation.md` | Detailed Imagen prompt anatomy (subject/comp/style/light/palette/AR/negatives) for the Founder to run in Gemini | media-prompt-director |
| `video-prompt-generation.md` | Veo prompt anatomy (+ camera/subject motion, duration, shot list, seamless loops) | media-prompt-director |
| `social-media-planning.md` | Calendars, per-platform native specs, per-post specs + media prompts | media-prompt-director, content-marketing |

## Content & Growth
| Skill | One-liner | Primary users |
|---|---|---|
| `viral-trends.md` | Trend research + scoring, hooks, idea-card batches (/viral) | content-marketing |
| `content-engine.md` | One source → 7 platform-native formats, voice, calendar | content-marketing |
| `aeo-seo.md` | Answer-first structure, schema, LLM-citation optimization | content-marketing |
| `paid-ads.md` | Campaign structure, server-side tracking, UTM — never spend | content-marketing, data-analytics |
| `deep-research.md` | Cross-verified multi-source dossiers with citations | ceo, content-marketing, team-lead |
| `documents.md` | Client-grade docx/xlsx/pdf, formulas-not-hardcoded | ceo, content-marketing, data-analytics |
