# Build context MUST be the repo root (workspace @project/shared). See docker-compose.yml.
FROM node:20-bookworm-slim
ENV NODE_ENV=development
WORKDIR /app
RUN chown node:node /app
USER node

# Layer-cache friendly: manifests + lockfile first
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node client/package.json client/package.json
COPY --chown=node:node server/package.json server/package.json
COPY --chown=node:node packages/shared/package.json packages/shared/package.json
RUN npm ci -w server -w @project/shared --include-workspace-root && npm cache clean --force

COPY --chown=node:node tsconfig.base.json ./
COPY --chown=node:node packages/shared packages/shared
COPY --chown=node:node server server

EXPOSE 4000
CMD ["npm", "run", "start", "-w", "server"]
