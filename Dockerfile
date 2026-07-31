# ============================================================
# Portal TE — imagem Node standalone (multi-stage)
# ============================================================
# O build usa vite.config.node.ts (preset Nitro "node-server"),
# gerando .output/server/index.mjs — 100% independente do Lovable/Cloudflare.

FROM oven/bun:1.3-alpine AS deps
WORKDIR /app
COPY package.json bun.lock* bun.lockb* ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile

FROM oven/bun:1.3-alpine AS build
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# DATABASE_URL placeholder — prisma generate só lê o schema
RUN DATABASE_URL="postgresql://placeholder@localhost/placeholder" \
    bunx prisma generate
RUN bunx vite build --config vite.config.node.ts

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
RUN addgroup -S portal && adduser -S portal -G portal \
 && mkdir -p /var/lib/portal-te/uploads \
 && chown -R portal:portal /var/lib/portal-te
COPY --from=build --chown=portal:portal /app/.output ./.output
COPY --from=build --chown=portal:portal /app/node_modules ./node_modules
COPY --from=build --chown=portal:portal /app/prisma ./prisma
COPY --from=build --chown=portal:portal /app/package.json ./package.json
COPY --chown=portal:portal docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
USER portal
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/ >/dev/null 2>&1 || exit 1
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]