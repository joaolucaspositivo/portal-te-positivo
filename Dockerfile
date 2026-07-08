FROM node:22.13.1-bookworm-slim AS deps

WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY certs ./certs

RUN find ./certs -type f \( -name "*.crt" -o -name "*.cer" -o -name "*.pem" \) \
  -exec sh -c 'for cert do base=$(basename "$cert"); cp "$cert" "/usr/local/share/ca-certificates/${base%.*}.crt"; done' sh {} + \
  && update-ca-certificates

ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

RUN npm config set cafile /etc/ssl/certs/ca-certificates.crt
RUN npm install -g npm@11 --no-audit --no-fund

RUN npm install -g npm@11

COPY package.json package-lock.json ./
COPY prisma ./prisma


RUN npm ci --no-audit --no-fund
RUN npx prisma generate


FROM node:22.13.1-bookworm-slim AS builder

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build


FROM node:22.13.1-bookworm-slim AS runner

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