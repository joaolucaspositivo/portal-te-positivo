## Objetivo

Finalizar o Portal TE como aplicação 100% standalone (Node + Postgres + Prisma), desvinculada do Lovable/Supabase. O código da aplicação já foi migrado; falta remover as referências remanescentes, corrigir os erros de build e validar o Docker.

## Estado atual (verificado)

- Todas as rotas e server functions já usam Prisma + auth local (`auth.functions.ts`, `auth-middleware.local.ts`, `auth-attacher.local.ts`).
- O package.json não depende mais de `@supabase/supabase-js`.
- Ainda existem arquivos/funções quebrando o build:
  - `src/integrations/supabase/client.ts` (e outros) importam `@supabase/supabase-js`, que não está instalado.
  - `src/start.ts` ainda registra `attachSupabaseAuth` junto com `attachLocalAuth`.
  - `supabase/config.toml` ainda existe.
  - `.env` e `.env.example` ainda trazem variáveis `SUPABASE_URL`/`VITE_SUPABASE_URL`.
  - Alguns `map()` têm parâmetros com tipo `any` implícito (`auth.google.callback.ts`, `index.tsx`, `solicitacoes.$slug.tsx`).
- Erro de runtime no preview: `Cannot find module '@supabase/supabase-js' imported from '/dev-server/src/integrations/supabase/client.ts`.
- `README.standalone.md` e `MIGRACAO_POSTGRES.md` ainda listam passos da Fase B como pendentes.

## Escopo aprovado

- Build standalone primeiro (sem migração de dados do Supabase nesta rodada).
- E-mail de admin inicial continua: `tecipp@colegiopositivo.com.br`.
- Desvincular totalmente do preview Lovable: apagar todo código Supabase restante.

## Etapa 1 — Remover referências Supabase remanescentes

- Apagar `src/integrations/supabase/` (client.ts, client.server.ts, auth-middleware.ts, auth-attacher.ts, types.ts).
- Apagar `supabase/config.toml` e a pasta `supabase/` se ficar vazia.
- Atualizar `src/start.ts`: usar apenas `attachLocalAuth` (remover import e registro de `attachSupabaseAuth`).
- Limpar `.env` e `.env.example`: remover `SUPABASE_URL`, `VITE_SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PUBLISHABLE_KEY` e quaisquer outras chaves Supabase. Manter `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `UPLOAD_DIR`, `SMTP_*`, `GOOGLE_OAUTH_*`, `PUBLIC_APP_URL`.

## Etapa 2 — Corrigir erros de tipo (parâmetros implícitos `any`)

- `src/routes/api/auth.google.callback.ts` (linha 65): tipar o parâmetro do `map()`.
- `src/routes/index.tsx` (linhas 54, 169, 219): tipar os parâmetros dos `map()`.
- `src/routes/solicitacoes.$slug.tsx` (linha 49): tipar o parâmetro do `map()`.

## Etapa 3 — Validar build standalone

- Rodar `npx prisma generate`.
- Rodar `npx vite build --config vite.config.node.ts`.
- Garantir que `.output/server/index.mjs` seja gerado sem erros.
- Rodar `npx tsgo --noEmit` e confirmar zero erros de TypeScript.

## Etapa 4 — Validar Docker

- Rodar `docker compose up -d --build`.
- Confirmar que o container `app` fica saudável e responde em `http://localhost:3000`.
- Verificar logs de erro de inicialização (`docker compose logs -f app`).
- Validar fluxo básico: homepage carrega, `/auth` carrega, `/api/auth/google` redireciona (se configurado).

## Etapa 5 — Atualizar documentação

- `README.standalone.md`: marcar todos os passos da Fase B como concluídos, remover avisos de "preview do Lovable ainda funciona com Supabase".
- `MIGRACAO_POSTGRES.md`: atualizar seção 7 (próximos passos) para refletir que a Fase B está concluída; adicionar nota sobre o script de migração de dados opcional (`scripts/migrate-from-supabase.ts`) para rodada futura.
- `.lovable/plan.md`: arquivar/após aprovação, este plano será concluído.

## Fora do escopo deste plano

- Script de migração de dados do Supabase para Postgres local (será feito em rodada futura, conforme prioridade escolhida).
- Novas funcionalidades no portal (somente a finalização da migração standalone).
- Publicação no Lovable (o app será standalone; publicação no Lovable deixará de refletir o backend real).
