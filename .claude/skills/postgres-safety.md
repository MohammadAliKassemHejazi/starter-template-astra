# Skill: Postgres Inspection & Migration Safety (MCP)

Load before writing any migration, or when diagnosing DB behavior on a live schema.

**Requires**: Postgres MCP server with a **read-only role** — the connection used for inspection must not be able to write. If absent → fallback: read schema from migration files + `schema.prisma`/models; state that live-DB verification wasn't possible.

Full doctrine, checklists, and failure modes: `postgres-safety-reference.md`.
