FROM node:22.12.0-bookworm-slim AS deps

WORKDIR /app

ENV NPM_CONFIG_STRICT_SSL=false
ENV npm_config_strict_ssl=false
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN npm config set strict-ssl false
RUN npm ci --no-audit --no-fund
RUN npx prisma generate


FROM node:22.12.0-bookworm-slim AS builder

WORKDIR /app

ENV NODE_ENV=production
ENV NPM_CONFIG_STRICT_SSL=false
ENV npm_config_strict_ssl=false
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build


FROM node:22.12.0-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN groupadd --system appgroup && useradd --system --gid appgroup --create-home appuser

COPY package.json package-lock.json ./
COPY production-server.mjs ./
COPY prisma ./prisma
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

CMD ["npm", "run", "start"]