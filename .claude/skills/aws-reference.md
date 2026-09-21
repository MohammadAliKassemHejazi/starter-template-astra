# Reference: aws

Deep detail for `aws.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Platform facts
- **Lambda**: 15-min max, memory 128MB–10GB (CPU scales with memory), cold starts matter for user-facing paths (provisioned concurrency = paid = Always-Stop). Node runtime: handler exports, bundle small (esbuild), no native deps without layers.
- **S3**: private-by-default buckets ALWAYS (`BlockPublicAccess` on); presigned URLs for client upload/download; lifecycle rules for cost (IA/Glacier transitions); versioning on buckets holding anything irreplaceable.
- **ECS**: Fargate over EC2 for agency work (no host management); task definitions are versioned JSON in the repo; service + ALB for HTTP; secrets from SSM Parameter Store / Secrets Manager, never env-in-taskdef.
- **IAM least privilege**: one role per function/service; no `*` actions or resources; permission boundaries on anything the team automates. IAM changes are reviewable JSON in the repo.
- **CloudWatch**: structured JSON logs (searchable with Logs Insights); metric filters → alarms on error rates; retention set explicitly (default = forever = cost).
- **Cost guardrails**: Budgets alarm configured per client account before anything else runs; every resource tagged `client` + `project`; anything that scales (provisioned capacity, NAT gateways, data transfer) named in the grooming report.

## Integration doctrine
- Everything infra-as-code in the repo (CDK/Terraform/SAM per client convention) — the console is for reading, not creating.
- Resource creation of ANY paid resource = Always-Stop: generate the IaC, output the plan/diff, halt for Founder approval.
- Region pinned per client (data residency — EU clients stay in eu-central-1/eu-west-1); noted in business-context.
- Local dev against LocalStack or mocks; real-account credentials never in `.env.example`.

## Common failure modes
Lambda timeout < downstream API timeout (zombie retries) · public bucket from a copied policy · IAM `*` "temporarily" · CloudWatch retention unset (silent cost growth) · NAT gateway for one cron job (fixed monthly cost nobody planned).
