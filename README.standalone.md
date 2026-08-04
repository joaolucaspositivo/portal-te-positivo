# Portal TE — Deploy standalone (Docker)

> Este README cobre a **versão standalone** (Postgres + Node + disco local),
> destinada a rodar fora do Lovable. A Fase B de migração foi concluída: o app
> não depende mais do Supabase.

## Pré-requisitos

- Docker + Docker Compose
- Porta 3000 (app) e 5432 (Postgres) livres na máquina host

## Instalação em 3 passos

```bash
cp .env.example .env
# edite .env — troque JWT_SECRET, JWT_REFRESH_SECRET, SMTP_*, GOOGLE_OAUTH_*

docker compose up -d --build
```

O `entrypoint.sh` roda `prisma migrate deploy` automaticamente antes de subir o
servidor. Após o container ficar saudável:

- App: http://localhost:3000
- Postgres: `psql postgresql://portal:portal_dev_password@localhost:5432/portal_te`

## Primeiro admin

O primeiro usuário que se cadastrar com o e-mail
`tecipp@colegiopositivo.com.br` é promovido automaticamente a **admin**
(regra em `src/lib/auth.functions.ts`, função `signUp`). Ajuste no código
se precisar trocar.

## Login com Google (opcional)

1. Console Google Cloud → APIs & Services → Credentials → **OAuth Client ID**
   (Application type: **Web application**).
2. Authorized redirect URI: `${PUBLIC_APP_URL}/api/auth/google/callback`
   (ex.: `http://localhost:3000/api/auth/google/callback` em dev).
3. Copie **Client ID** e **Client Secret** para `.env`
   (`GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`).
4. Reinicie o container: `docker compose restart app`.

## SMTP

Preencha `SMTP_*` no `.env`. O envio real é usado para:
- reset de senha (`/reset-password`)
- notificações de solicitação (opcional, configurável)

Se `SMTP_HOST` ficar vazio, o link cai no log do container (dev-only).

## Migração de dados do Supabase → Postgres local

Script disponível: `scripts/migrate-from-supabase.ts`.
Ele lê do Supabase atual (via service role) e insere no Postgres local
respeitando FKs; baixa arquivos dos buckets pra `UPLOAD_DIR`.

Preencha em `.env`:
```
MIGRATE_SUPABASE_URL="https://<ref>.supabase.co"
MIGRATE_SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

Rode dentro do container:
```bash
docker compose exec app bunx tsx scripts/migrate-from-supabase.ts
```

Após concluído, remova essas duas variáveis do `.env`.

## Backup

```bash
# Dump do banco
docker compose exec postgres pg_dump -U portal portal_te > backup-$(date +%F).sql

# Backup do volume de uploads
docker run --rm -v portal-te_portal_uploads:/data -v $(pwd):/backup alpine \
  tar czf /backup/uploads-$(date +%F).tgz -C /data .
```

## Status da migração (Fase B)

| Passo | Estado |
|---|---|
| 1. Runtime Node + Dockerfile + compose | ✅ |
| 2. Auth cliente (use-auth + auth.tsx + start.ts) | ✅ |
| 3. Reescrita das `*.functions.ts` p/ Prisma | ✅ |
| 4. Upload/download em disco local | ✅ |
| 5. Remoção de código Supabase | ✅ |
| 6. Script de migração de dados | ✅ `scripts/migrate-from-supabase.ts` |

## Build standalone (Node)

O `vite.config.ts` padrão é o do editor (alvo Cloudflare). Para rodar fora do
Lovable, use o config Node:

```bash
npx prisma generate
npx vite build --config vite.config.node.ts
node .output/server/index.mjs
```

O `Dockerfile` já usa esse config; o container inicia com
`prisma migrate deploy` + `node .output/server/index.mjs`.
