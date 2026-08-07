# Finalizar Portal TE como aplicação standalone (Node + Postgres + Prisma)

## Estado atual (verificado em 07/08/2026)

- Rotas e server functions já usam Prisma + auth local (`auth.functions.ts`, `auth-middleware.local.ts`, `auth-attacher.local.ts`).
- `package.json` ainda depende de `@supabase/supabase-js` (usado pelo script de migração e pelos arquivos de integração).
- `src/integrations/supabase/` ainda existe (client.ts, client.server.ts, auth-middleware.ts, auth-attacher.ts, types.ts) — importa `@supabase/supabase-js`.
- `src/start.ts` ainda registra `attachSupabaseAuth` junto com `attachLocalAuth`.
- `supabase/config.toml` ainda existe.
- `.env` ainda contém `SUPABASE_URL`, `VITE_SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, `SUPABASE_PROJECT_ID`.
- `.env.example` já está limpo (só `MIGRATE_*` para o script de migração).
- `README.standalone.md` e `MIGRACAO_POSTGRES.md` já dizem "Fase B concluída".
- Docker: `Dockerfile`, `docker-compose.yml`, `docker/entrypoint.sh` já criados; ainda não validados.

## Escopo

- Build standalone (sem migração de dados do Supabase nesta rodada).
- E-mail de admin inicial: `tecipp@colegiopositivo.com.br`.
- Desvincular totalmente do Lovable/Supabase: apagar código Supabase restante.

## Etapa 1 — Remover referências Supabase remanescentes

- Apagar `src/integrations/supabase/` (client.ts, client.server.ts, auth-middleware.ts, auth-attacher.ts, types.ts).
- Apagar `supabase/config.toml` e a pasta `supabase/` se ficar vazia.
- Atualizar `src/start.ts`: remover import e registro de `attachSupabaseAuth`; manter apenas `attachLocalAuth`.
- Mover `@supabase/supabase-js` de `dependencies` para `devDependencies` em `package.json` (ainda é necessário para o script `scripts/migrate-from-supabase.ts`).
- Limpar `.env`: remover `SUPABASE_URL`, `VITE_SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, `SUPABASE_PROJECT_ID`. Manter `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `UPLOAD_DIR`, `SMTP_*`, `GOOGLE_OAUTH_*`, `PUBLIC_APP_URL`, `MIGRATE_SUPABASE_*`.

## Etapa 2 — Corrigir erros de tipo (parâmetros implícitos `any`)

Verificar e tipar parâmetros `any` implícitos em:
- `src/routes/api/auth.google.callback.ts` (linha ~67: `user.roles.map`)
- `src/routes/index.tsx` (linhas ~104, ~134: `quickCards.map`, `teRoles.map`)
- `src/routes/solicitacoes.$slug.tsx` (linha ~195: `minhasUnidades.map((u: any)`)

Confirmar com `tsgo --noEmit` que não há erros.

## Etapa 3 — Validar build standalone

- Rodar `npx prisma generate`.
- Rodar `npx vite build --config vite.config.node.ts`.
- Garantir que `.output/server/index.mjs` seja gerado sem erros.
- Rodar `npx tsgo --noEmit` e confirmar zero erros de TypeScript.

## Etapa 4 — Validar Docker

- Rodar `docker compose up -d --build`.
- Confirmar que o container `app` fica saudável e responde em `http://localhost:3000`.
- Verificar logs de erro de inicialização (`docker compose logs app`).
- Validar fluxo básico: homepage carrega, `/auth` carrega, `/api/auth/google` redireciona (se configurado).

## Etapa 5 — Documentação (já concluída)

`README.standalone.md` e `MIGRACAO_POSTGRES.md` já estão atualizados. Sem ação necessária.

## Fora do escopo

- Script de migração de dados do Supabase para Postgres local (rodada futura).
- Novas funcionalidades no portal (somente a finalização da migração standalone).
- Publicação no Lovable (o app será standalone; publicação no Lovable deixará de refletir o backend real).
