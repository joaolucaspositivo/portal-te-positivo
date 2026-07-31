#!/bin/sh
set -e

echo "[portal-te] rodando prisma migrate deploy..."
npx --yes prisma migrate deploy

echo "[portal-te] iniciando servidor Node em :$PORT ..."
exec node .output/server/index.mjs
