#!/bin/sh
set -e

echo "[portal-te] aguardando Postgres..."
# Prisma migrate deploy já falha rápido se DB indisponível; healthcheck do compose garante que estará up.
echo "[portal-te] rodando prisma migrate deploy..."
npx --yes prisma migrate deploy

echo "[portal-te] iniciando servidor Node em :$PORT ..."
exec node dist/server/index.mjs