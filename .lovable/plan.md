## Migração de Supabase para Postgres puro + backend próprio

Substituir completamente o Supabase (Auth, Data API, Storage, RLS) por uma stack autônoma: Postgres + Prisma + JWT/bcrypt + disco local. O app continua usando TanStack Start e roda em qualquer servidor Node — local, VPS, Docker — sem nenhuma dependência do Lovable Cloud em produção.

> **Aviso de escopo**: essa é uma reescrita grande, não um ajuste. Praticamente todo arquivo `*.functions.ts`, `use-auth.ts`, `/auth`, upload de imagens e middleware mudam. Estimativa: várias horas de trabalho de IA + tempo seu pra validar fluxo a fluxo. Você perde features prontas (recuperação de senha por e-mail, signed URLs de storage, realtime) que precisam ser reimplementadas se quiser ter.

---

### Fase 1 — Infraestrutura local

1. **Postgres local via Docker** — `docker-compose.yml` com Postgres 16 + volume persistente. Documentado no `README.md` com `docker compose up -d` pra rodar.
2. **Variáveis de ambiente novas** no `.env`:
   - `DATABASE_URL` (Postgres)
   - `JWT_SECRET` e `JWT_REFRESH_SECRET` (gerados via `generate_secret`)
   - `GOOGLE_OAUTH_CLIENT_ID` e `GOOGLE_OAUTH_CLIENT_SECRET` (você obtém no Google Cloud Console)
   - `UPLOAD_DIR` (caminho absoluto pra pasta de uploads)
   - `PUBLIC_APP_URL` (pra callbacks OAuth e links de e-mail)
3. **Remover** todas as `VITE_SUPABASE_*` e `SUPABASE_*` do `.env`.

### Fase 2 — Prisma + schema

1. Instalar `prisma`, `@prisma/client`, `bcryptjs`, `jsonwebtoken`, `zod`, `multer` (uploads), `nodemailer` (reset de senha por e-mail — opcional).
2. Criar `prisma/schema.prisma` traduzindo todas as tabelas atuais:
   - **`users`** (substitui `auth.users`): `id`, `email` único, `password_hash`, `google_id` nullable, `email_verified_at`, `created_at`.
   - `profiles`, `user_roles`, `unidades`, `usuario_unidades`, `solicitacao_tipos`, `solicitacao_campos`, `solicitacoes`, `comunicados`, `contatos`, `ferramentas` — campos idênticos aos atuais, FKs apontando pra `users` (não mais `auth.users`).
   - Enums (`app_role`, `profile_status`, `unidade_status`) viram `enum` Prisma.
3. **Triggers que sobrevivem**: `set_updated_at` continua útil; manter como SQL via `prisma migrate`.
4. **Função `has_role`**: vira função TypeScript no backend (não precisa mais ser SQL, já que não há RLS).
5. **Migração de dados existente**: script `scripts/migrate-from-supabase.ts` que lê do Supabase atual (último uso da chave) e insere no Postgres novo, mapeando `auth.users.id` → novo `users.id` (mantém UUIDs pra não quebrar FKs).

### Fase 3 — Autenticação caseira

1. **Server functions de auth** em `src/lib/auth.functions.ts`:
   - `signUp({ email, password, nome })` — bcrypt hash, cria `users` + `profiles` (status `pendente`), retorna JWT access + refresh token.
   - `signIn({ email, password })` — compara hash, retorna tokens.
   - `signOut()` — invalida refresh token (tabela `refresh_tokens` com revogação).
   - `refreshSession({ refreshToken })` — rotaciona tokens.
   - `requestPasswordReset({ email })` — gera token, envia e-mail (Nodemailer + SMTP que você configurar) ou loga link no console em dev.
   - `resetPassword({ token, newPassword })`.
   - `googleOAuthStart()` — gera URL do Google.
   - `googleOAuthCallback({ code })` — troca code por token, busca user info, cria/loga usuário.
2. **Tabela `refresh_tokens`** no schema (id, user_id, token_hash, expires_at, revoked_at).
3. **Middleware `requireAuth`** próprio (substitui `requireSupabaseAuth`):
   - Lê `Authorization: Bearer` do request.
   - Verifica JWT, busca user, injeta `{ user, userId, roles }` no context.
4. **Middleware `requireRole('admin')`** pra rotas administrativas.
5. **Sessão no cliente**: novo `src/lib/auth-client.ts` com `signIn`, `signOut`, `useAuth` hook que guarda tokens em `localStorage` + cookie httpOnly via endpoint, e renova automaticamente.
6. **`functionMiddleware` cliente** em `src/start.ts`: anexa access token (substitui `attachSupabaseAuth`).
7. **Rotas OAuth**: `src/routes/api/auth.google.callback.ts` (server route) trata callback.

### Fase 4 — Substituição da Data API

Cada chamada `supabase.from(...).select/insert/update/delete` precisa virar uma server function. Hoje o app faz isso em ~12 arquivos. Estratégia:

1. **Criar `src/lib/<dominio>.functions.ts`** por domínio: `unidades`, `solicitacoes`, `comunicados`, `contatos`, `ferramentas`, `tipos-solicitacao`, `profiles`, `users`.
2. Cada uma com CRUD + queries específicas usando Prisma, com `requireAuth` + checagem de role explícita no início do handler (substitui RLS).
3. **Substituir todas as chamadas diretas** no frontend: remover `import { supabase } from "@/integrations/supabase/client"` e trocar por `useServerFn(...)`. Componentes afetados: todos os de `src/routes/area-te.*`, `solicitacoes.*`, `comunicados.tsx`, `contatos.tsx`, `ferramentas.tsx`, `auth.tsx`.
4. **Realtime**: o app hoje usa `onAuthStateChange`. Substituído por evento local após `signIn`/`signOut`. Se houver outros usos de realtime (subscriptions a tabelas), precisam virar polling ou WebSocket próprio — verificar caso a caso.

### Fase 5 — Storage em disco local

1. **Estrutura de pastas**: `<UPLOAD_DIR>/avatars/<user_id>/<filename>` e `<UPLOAD_DIR>/media/<filename>`.
2. **Server route `/api/upload`** (POST, autenticado, multipart): valida tipo/tamanho, gera nome único, grava no disco, retorna URL.
3. **Server route `/api/files/$`** (GET): serve arquivos com checagem de permissão básica (autenticado pra avatars privados, público pra media se aplicável).
4. **Substituir `StorageImage` e `ImageUploadField`** pra falar com os novos endpoints (sem signed URLs do Supabase).
5. **Migração de arquivos**: script que baixa todos os arquivos dos buckets atuais e move pro disco novo.

### Fase 6 — Limpeza

1. **Remover arquivos auto-gerados do Supabase**: `src/integrations/supabase/client.ts`, `client.server.ts`, `auth-middleware.ts`, `auth-attacher.ts`, `types.ts`.
2. **Remover dependências**: `@supabase/supabase-js`.
3. **Remover `supabase/migrations/*`** após confirmar que tudo está no Prisma.
4. **Atualizar `.gitignore`**, `README.md` com instruções de setup local (docker, prisma migrate, seed admin).
5. **Script de seed** pra criar usuário admin inicial (substitui o trigger `handle_new_user` que dava admin pro `tecipp@colegiopositivo.com.br`).

### Fase 7 — Deploy autônomo

Documentação no `README.md` cobrindo:
- Subir num VPS com Node + Postgres + nginx (reverse proxy + servir uploads).
- Variante Docker Compose pra produção (app + Postgres + nginx).
- Backup do Postgres (`pg_dump` agendado).
- HTTPS via Let's Encrypt.

---

### Detalhes técnicos importantes

- **Prisma e Cloudflare Workers**: o template atual roda em Workers (Edge). Prisma puro **não funciona bem** em Workers sem `Prisma Accelerate` (pago) ou driver custom. Pra ter autonomia total, o deploy passa a ser **Node tradicional** (VPS, Docker), não Edge. Isso é uma mudança de plataforma — `vite.config.ts` muda pra target Node, perdemos otimização de edge. Se quiser manter compatibilidade com Workers, troque Prisma por **Kysely** ou **Drizzle** (que rodam em Edge).
- **RLS → autorização em código**: cada server function precisa checar manualmente "esse usuário pode ler/escrever esse registro?". Mais propenso a bug que RLS. Vou criar helpers `assertCanReadUnidade(userId, unidadeId)` etc.
- **OAuth Google manual**: você precisa criar credenciais no Google Cloud Console, configurar `redirect_uri` autorizado, e tratar refresh tokens do Google.
- **Sem Lovable Cloud**: depois da migração, o Lovable continua sendo só editor. Build e deploy passam a ser responsabilidade sua (CI/CD próprio, ou `git pull && npm run build && pm2 restart`).
- **Sem realtime**: confirmar se algum lugar usa `supabase.channel(...).on('postgres_changes', ...)`. Se sim, precisa de WebSocket próprio ou polling.

---

### Recomendação honesta

Pelo escopo, sugiro fazer em **fases separadas**, não tudo de uma vez:
- **Fase A** (1 turno): Fases 1–3 — infra, Prisma, auth caseiro funcionando, mas app ainda usando Supabase pros dados. Validar login/signup primeiro.
- **Fase B** (1–2 turnos): Fase 4 — migrar Data API domínio por domínio.
- **Fase C** (1 turno): Fases 5–7 — storage, limpeza, deploy.

Quer aprovar esse plano integral ou prefere começar só pela **Fase A** pra validar a abordagem antes de comprometer com o resto?
