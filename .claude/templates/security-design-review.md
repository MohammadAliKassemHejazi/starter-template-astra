# Security Design Review — CIA Control Matrix

> Use before implementation for authentication, authorization, PII, payments, file uploads, public write endpoints, webhooks, third-party integrations, multi-tenancy, admin functions, AI retrieval over customer data, data migrations, or a new production data flow. This is a concise engineering artifact, not a compliance claim.

## 1. Scope and decision status

| Field | Value |
|---|---|
| Project / story | `<identifier and title>` |
| Reviewer(s) | `<system-architect, security-auditor, owners>` |
| Environment | `<local / test / preview / production proposal>` |
| Data sensitivity | `<public / internal / confidential / restricted>` |
| Security objective | `<what must be protected and from whom>` |
| In scope | `<components, routes, APIs, integrations>` |
| Out of scope | `<explicit exclusions>` |
| Decision required | `<none / Founder approval required; link request>` |

## 2. Data and trust boundaries

| Asset or data | Classification | Origin | Storage / transit | Allowed readers / writers | Retention / deletion rule |
|---|---|---|---|---|---|
| `<asset>` | `<class>` | `<user/system/partner>` | `<where/how>` | `<role + server-side rule>` | `<rule>` |

| Boundary | Untrusted input or dependency | Validation / authorization point | Failure-safe behavior | Owner |
|---|---|---|---|---|
| `<browser → server>` | `<form/API input>` | `<schema + authz>` | `<reject safely>` | `<owner>` |

## 3. Threat and control register

Write threats in terms of a realistic misuse or failure. Do not claim a control exists until its implementation and test are identified.

| Scenario / threat | CIA impact | Likelihood | Impact | Required control | Implementation location | Verification | Residual risk / owner |
|---|---|---:|---:|---|---|---|---|
| `<e.g., user changes resource ID>` | C / I | `<L/M/H>` | `<L/M/H>` | `<object-level authorization>` | `<service/policy>` | `<cross-user denial test>` | `<risk + owner>` |

## 4. CIA baseline decisions

| Objective | Design decision | Required control | Evidence | Status |
|---|---|---|---|---|
| Confidentiality | `<minimum data exposure>` | `<classification, authz, secret/log controls>` | `<test/review>` | `<planned / verified>` |
| Integrity | `<trusted state transition>` | `<schema, CSRF/output handling, idempotency, audit>` | `<test/review>` | `<planned / verified>` |
| Availability | `<expected failure behavior>` | `<timeouts, bounds, rate/size limits, health, recovery>` | `<test/review>` | `<planned / verified>` |

## 5. Authorization matrix

Authorization must be enforced in server-side code or infrastructure policy, not merely hidden in the UI.

| Role / actor | Resource / action | Allowed condition | Enforcement point | Negative test |
|---|---|---|---|---|
| `<anonymous/user/admin/service>` | `<resource + verb>` | `<explicit policy>` | `<service/middleware/policy>` | `<test>` |

## 6. Secure implementation checklist

| Area | Decision / evidence | Status |
|---|---|---|
| Authentication and session lifecycle | `<provider, token/session storage, expiry, revocation, MFA decision>` | `<planned / verified / N/A>` |
| Input and output handling | `<schemas, output encoding, file type/size/storage rules>` | `<planned / verified / N/A>` |
| Secrets and configuration | `<server-only secret path, rotation owner, no client exposure>` | `<planned / verified / N/A>` |
| Data protection | `<transport, storage, client exposure, backups>` | `<planned / verified / N/A>` |
| Abuse resistance | `<rate/size/concurrency limits, anti-automation controls>` | `<planned / verified / N/A>` |
| Dependencies and supply chain | `<lockfile, scanning, update/remediation owner>` | `<planned / verified / N/A>` |
| Logging and detection | `<events, redaction, alerting, incident path>` | `<planned / verified / N/A>` |
| Failure and recovery | `<timeouts, fallback, health, restore/rollback>` | `<planned / verified / N/A>` |

## 7. Approval and follow-through

| Item | Owner | Required before | Status / reference |
|---|---|---|---|
| Architecture decision / ADR | `<owner>` | `<build>` | `<link>` |
| Founder decision request, if required | `<CEO>` | `<build or release>` | `<link>` |
| Security findings fixed and retested | `<owner + auditor>` | `<Done>` | `<link>` |
| QA evidence attached | `<qa-devops>` | `<Done>` | `<link>` |
| Residual risks accepted or scheduled | `<Founder / owner>` | `<release>` | `<link>` |

## References

[1] [OWASP Application Security Verification Standard 5.0.0](https://owasp.org/www-project-application-security-verification-standard/)

[2] [NIST Secure Software Development Framework](https://csrc.nist.gov/projects/ssdf)

[3] [CISA Secure by Design](https://www.cisa.gov/securebydesign)
