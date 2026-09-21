# Build context MUST be the repo root (workspace @project/shared). See docker-compose.yml.
# Targets: runtime (default, next start) | e2e (Playwright, matches @playwright/test in package-lock)
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
RUN chown node:node /app
USER node

COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node client/package.json client/package.json
COPY --chown=node:node server/package.json server/package.json
COPY --chown=node:node packages/shared/package.json packages/shared/package.json
RUN npm ci -w client -w @project/shared --include-workspace-root && npm cache clean --force

COPY --chown=node:node tsconfig.base.json ./
COPY --chown=node:node packages/shared packages/shared
COPY --chown=node:node client client

# next.config.ts rewrites are evaluated at build: API_ORIGIN is baked in here.
ARG API_ORIGIN
ENV API_ORIGIN=${API_ORIGIN}
ENV NEXT_TELEMETRY_DISABLED=1
RUN test -n "$API_ORIGIN" && npm run build -w client

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "exec", "-w", "client", "--", "next", "start", "-H", "0.0.0.0", "-p", "3000"]

FROM mcr.microsoft.com/playwright:v1.63.0-noble AS e2e
WORKDIR /app
RUN chown pwuser:pwuser /app
USER pwuser
COPY --chown=pwuser:pwuser package.json package-lock.json ./
COPY --chown=pwuser:pwuser client/package.json client/package.json
COPY --chown=pwuser:pwuser server/package.json server/package.json
COPY --chown=pwuser:pwuser packages/shared/package.json packages/shared/package.json
RUN npm ci -w client -w @project/shared --include-workspace-root && npm cache clean --force
COPY --chown=pwuser:pwuser tsconfig.base.json ./
COPY --chown=pwuser:pwuser packages/shared packages/shared
COPY --chown=pwuser:pwuser client client
CMD ["npm", "run", "e2e", "-w", "client"]
