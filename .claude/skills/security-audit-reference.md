# Reference: security-audit

Deep detail for `security-audit.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Audit sequence
1. **Scope in writing**: systems in scope, test environment (NEVER production without explicit written Founder+client approval — Always-Stop), timebox.
2. **Recon**: dependency audit (`npm audit`, lockfile review), secret scan (gitleaks over history — leaked-then-deleted keys are still leaked), exposed-surface map (routes, buckets, subdomains from config).
3. **OWASP Top 10 pass**: access control (the big one — see below), crypto usage, injection, misconfig (headers via securityheaders-style check, CORS, cookies), SSRF on any URL-fetching feature.
4. **AuthZ matrix testing**: table of role × resource × action; test every "deny" cell actually denies — IDOR (user A reading user B's data by ID swap) is the most common critical finding in agency codebases.
5. **AI-specific** (when in scope): prompt injection via user content, data exfiltration through tool calls, RAG access-control bypass (retrieval returning chunks the user shouldn't see).

## Rules of engagement
Proof-of-concept only — demonstrate, never exploit further, never touch real user data · findings are confidential (report to Founder, isolation guardrail applies) · anything discovered actively exploited → immediate escalation, audit pauses.

## Report format (per finding)
`ID · title · severity (Critical/High/Medium/Low — impact × exploitability) · evidence (repro steps/PoC) · affected component · fix recommendation · effort (S/M/L)`. Executive summary up top: posture in 5 lines + top 3 actions. Retest pass after fixes closes each finding explicitly.
