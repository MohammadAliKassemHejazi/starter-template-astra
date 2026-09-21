#!/usr/bin/env bash
# Connects a credentialed MCP server WITHOUT ever committing a secret.
# The CEO runs this on the Founder's behalf after confirming which server and
# why. Credentialed servers go to PERSONAL scope (~/.claude.json), never
# project scope (.mcp.json) — personal config isn't shared across client
# forks or committed to git. See docs/MCP_AND_HOOKS.md for the full policy.
#
# Usage: bash connect-mcp.sh <server>
#   server: postgres | github
set -uo pipefail
SERVER="${1:-}"

case "$SERVER" in
  postgres)
    echo "==> Connecting a read-only Postgres MCP server (personal scope)."
    echo "    You will be prompted for the connection string — it is stored in"
    echo "    your personal Claude config, never in this repo's .mcp.json."
    read -rsp "Postgres connection string (read-only role recommended): " PGCONN
    echo ""
    claude mcp add --scope local postgres -- npx -y @modelcontextprotocol/server-postgres "$PGCONN"
    echo "==> Connected at personal scope. Verify with: claude mcp list"
    ;;
  github)
    echo "==> Connecting the GitHub MCP server (personal scope, OAuth preferred)."
    echo "    Prefer OAuth over a token where the server supports it."
    claude mcp add --scope local github -- npx -y @modelcontextprotocol/server-github
    echo "==> Follow the OAuth/token prompt in your terminal. Verify with: claude mcp list"
    echo "    If a token is required, set it as an env var in your own shell profile —"
    echo "    never paste it into a file inside this repo."
    ;;
  *)
    echo "Usage: bash connect-mcp.sh <postgres|github>"
    echo "Sentry, database/filesystem, and other credentialed servers follow the"
    echo "same pattern — see the candidate table in docs/MCP_AND_HOOKS.md and run:"
    echo "  claude mcp add --scope local <name> -- <command> <args>"
    exit 1
    ;;
esac
