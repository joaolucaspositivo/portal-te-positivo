## Passo 2 — Runtime Node + Auth cliente Prisma (standalone completo)

Esta é a virada definitiva: o preview do Lovable **para de funcionar** depois deste passo. A partir daqui todo desenvolvimento acontece via `docker compose up`.

### 1. Runtime: Cloudflare Worker → Node

- `vite.config.ts`: trocar preset nitro para `node-server`; remover `src/server.ts` (wrapper Worker) e apontar entry padrão do TanStack Start.
- `package.json`: script `start` = `node .output/server/index.mjs`; ajustar `Dockerfile`/entrypoint pra rodar `node` ao invés de wrangler/worker.
- Remover dependências e código Cloudflare (`@lovable.dev/vite-tanstack-config` mantém, mas o target vira Node).

### 2. Auth do cliente — trocar Supabase por JWT local

Substituir todo `supabase.auth.*` no frontend:

- **Novo `src/lib/auth-client.ts`**: guarda `accessToken` em memória + `refreshToken` em `localStorage`; funções `signIn/signUp/signOut/refresh/getCurrentUser` chamando as `createServerFn` já existentes em `src/lib/auth.functions.ts`.
- **Reescrever `src/lib/use-auth.ts`**: usar o novo client (sem `@supabase/supabase-js`), retorno igual (`user`, `roles`, `profile`, `isAdmin`, etc.) pra não quebrar as telas.
- **Reescrever `src/routes/auth.tsx`**: form chama `signIn/signUp` locais.
- **`src/start.ts`**: trocar `attachSupabaseAuth` por middleware novo `attachLocalAuth` (já existe em `src/lib/auth-attacher.local.ts`) que injeta `Authorization: Bearer <accessToken>`.
- **Refresh automático**: interceptar 401 do server function, chamar `refreshSession`, repetir a chamada uma vez.

### 3. Data layer — reescrever `*.functions.ts` para Prisma

Trocar cliente Supabase por Prisma nos arquivos:

- `src/lib/users.functions.ts` (list/approve/block/edit user, gerir roles e unidades)
- `src/lib/unidades.functions.ts` (CRUD + link usuário-unidade)
- Criar `src/lib/solicitacoes.functions.ts`, `src/lib/comunicados.functions.ts`, `src/lib/ferramentas.functions.ts`, `src/lib/contatos.functions.ts`, `src/lib/tipos-solicitacao.functions.ts` e `src/lib/perfil.functions.ts` cobrindo o que hoje é query Supabase direto nas rotas.
- Reescrever cada rota (`src/routes/area-te.*.tsx`, `src/routes/index.tsx`, `/comunicados`, `/contatos`, `/ferramentas`, `/solicitacoes.*`) pra consumir as server functions via TanStack Query (não mais `supabase.from(...)` no cliente).
- Autorização: middleware `requireAuth` + checagem de `roles` dentro de cada handler (equivalente às RLS antigas).

### 4. Upload/download em disco local

- **Nova rota** `src/routes/api/upload.ts` (POST multipart, auth obrigatória, valida mime/tamanho, salva em `UPLOAD_DIR/<bucket>/<uuid>-<nome>`).
- **Nova rota** `src/routes/api/files/$.ts` (GET, checa permissão conforme bucket: `portal-avatars` público-autenticado, `portal-media` público, retorna arquivo via stream Node).
- Tabela `uploads` (id, path, mime, size, ownerId, bucket) via nova migração Prisma.
- Trocar `src/components/image-upload-field.tsx` e `src/components/storage-image.tsx` para usar `/api/upload` e `/api/files/...` (sem signed URLs).
- Coluna `avatar_url`/`imagem_url` passa a guardar path relativo (`/api/files/portal-media/<id>`).

### 5. Google OAuth manual

- Rotas `src/routes/api/auth/google.ts` (redirect) e `src/routes/api/auth/google/callback.ts` (troca `code` por token, busca perfil, faz upsert em `User`, emite JWT/refresh e redireciona pro app).
- Botão "Entrar com Google" em `/auth` aponta pra `/api/auth/google`.
- Usa `GOOGLE_OAUTH_CLIENT_ID`/`SECRET` do `.env` (já existem).

### 6. Limpeza Supabase

- Remover `@supabase/supabase-js`, `@lovable.dev/cloud-auth-js` do `package.json`.
- Deletar `src/integrations/supabase/*`, `supabase/config.toml`.
- Remover `attachSupabaseAuth`/`requireSupabaseAuth` do código.
- Remover `.env` vars `VITE_SUPABASE_*`.

### 7. Script de migração de dados

- `scripts/migrate-from-supabase.ts` (tsx): lê `MIGRATE_SUPABASE_URL`/`SERVICE_ROLE_KEY`, copia tabelas na ordem correta de FKs (users → profiles → user_roles → unidades → usuario_unidades → solicitacao_tipos/campos → solicitacoes → comunicados → ferramentas → contatos), baixa arquivos dos buckets `portal-media`/`portal-avatars` pra `UPLOAD_DIR` e reescreve as URLs.
- Documentado em `README.standalone.md` (seção já existe, será finalizada).

### 8. Validação final

- `docker compose up -d --build` → app sobe em `localhost:3000`.
- Fluxo E2E: signup → login → criar unidade → aprovar usuário → abrir solicitação → upload de imagem em comunicado → logout.

---

### Aviso importante

Depois deste passo o **preview do Lovable não abre mais** (o runtime Cloudflare é substituído por Node). Todo desenvolvimento futuro vira `docker compose up` local + edição manual — a experiência "editar no Lovable e ver o preview" acaba. Confirma que quer seguir assim antes de eu implementar?
