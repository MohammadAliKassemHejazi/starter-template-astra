# Reference: cms-platforms

Deep detail for `cms-platforms.md`. Read this when actually implementing — not to decide whether the skill applies (the lean file + `skills/INDEX.md` answer that).

## Prime directive
Meet the client's platform where it is. "Rebuild it properly in Next.js" is a HIGH-tier proposal for the Founder, never a default. Most agency value: bolt AI/automation ONTO the existing store/site.

## WordPress
- Integration surface: REST API (`/wp-json/wp/v2/`) with Application Passwords, or WPGraphQL for headless reads.
- Custom code ships as a **plugin** (versioned in our repo, deployable), never edits to theme `functions.php` (dies on theme update) and never core edits (dies on WP update).
- Headless pattern: WP stays the editor, Next.js renders (revalidate on WP webhook) — best of both when performance matters.
- Ops honesty: plugin/WP updates and backup posture are part of any WP engagement scope; an unpatched WP is a breach schedule.

## Shopify
- **Custom app** (per-store, Admin API token) is the agency default; public apps only for productized offerings (HIGH-tier: review process, billing API).
- Admin API (GraphQL preferred; REST is legacy-bound) for products/orders/customers; Storefront API for custom frontends (Hydrogen/Next.js).
- **Webhooks**: verify `X-Shopify-Hmac-Sha256` on the RAW body; mandatory GDPR webhooks (customer data request/erasure) must be implemented for any app touching customer data.
- Rate limits are cost-based (GraphQL points) — bulk operations API for large exports, never pagination loops.
- Theme work: sections/blocks in Liquid for small changes; checkout is locked (Plus only) — set client expectations early.

## Common failure modes
functions.php edit lost on update · webhook without HMAC verify · REST pagination loop hitting rate limits mid-sync · headless build without on-publish revalidation (stale content) · app installed with write-everything scopes it never needed.
