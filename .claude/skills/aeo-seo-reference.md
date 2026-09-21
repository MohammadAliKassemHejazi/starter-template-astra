# Reference: aeo-seo

Deep detail for `aeo-seo.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## AEO structure (optimize for being quoted)
- **Question-based H2s** phrased exactly as users ask ("How much does X cost in 2026?").
- **Direct answer in the first 40–60 words under each H2** — answer first, elaborate after. LLMs quote the tight paragraph, not the essay.
- **Standalone quotable paragraphs**: each key claim readable with zero surrounding context (engines extract fragments).
- **Entity clarity**: full names on first mention (company, product, person + role); consistent terminology throughout — engines resolve entities, ambiguity kills citations.
- **Citable data**: specific numbers with source + year beat vague claims; original data (client's own stats) is citation gold.
- **Freshness signals**: dated updates ("Updated January 2026"), current-year references, updated stats.

## Schema (structured data)
- `Article` + `author` + `datePublished/dateModified` on every post; `FAQPage` for Q&A sections; `HowTo` for step guides; `Organization` sitewide.
- Validate in Google's Rich Results test before shipping.

## Classic SEO still applies
- Match search intent (informational vs commercial vs transactional) before writing a word.
- Title < 60 chars with primary keyword; meta description < 160 chars with the answer's hook.
- Internal links with descriptive anchors; one H1; heading hierarchy never skips levels.
- Core Web Vitals are ranking signals — coordinate with frontend-dev on LCP/CLS budgets.

## Measurement
Track: classic rankings AND llm-citation spot checks (ask the major engines the target questions monthly; log which sources they cite). Adjust structure toward what gets quoted.
