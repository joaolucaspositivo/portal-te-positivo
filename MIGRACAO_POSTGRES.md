# Migração Supabase → Postgres puro (Fase A)

Esta fase entrega a **fundação** para sair do Supabase:
camada de banco (Prisma), auth caseiro (JWT + bcrypt) e infra local (Docker).

A **Fase B** foi concluída: o app agora roda 100% standalone, usando Prisma
para todas as queries, armazenamento local de arquivos e autenticação própria.
Os arquivos e pastas do Supabase foram removidos.

---

## 1) Suba o Postgres local

```bash
docker compose up -d
# verifica
docker compose ps
```

Postgres ficará em `localhost:5432`, usuário `portal`, senha `portal_dev_password`,
banco `portal_te`. Credenciais e volume estão em `docker-compose.yml`.

## 2) Copie o `.env`

```bash
cp .env.example .env
```

Edite `.env` e ajuste:
- `DATABASE_URL` — já vem apontando pro Docker acima
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — gere com `openssl rand -base64 64`
- `UPLOAD_DIR` — crie o diretório (`mkdir -p /var/lib/portal-te/uploads`)
- `GOOGLE_OAUTH_*` — só se for ativar login Google (opcional)

## 3) Instale dependências

```bash
bun install
```

## 4) Gere o cliente Prisma e aplique o schema

```bash
# Gera os tipos TypeScript do Prisma
npx prisma generate

# Cria/atualiza as tabelas no Postgres a partir de prisma/schema.prisma
npx prisma migrate dev --name init
```

Pra inspecionar visualmente:

```bash
npx prisma studio
```

## 5) Estrutura entregue

| Arquivo | Função |
|---|---|
| `docker-compose.yml` | Postgres 16 local + app Node |
| `Dockerfile` / `docker/entrypoint.sh` | Build e startup do app standalone |
| `prisma/schema.prisma` | Schema completo (users, profiles, roles, unidades, solicitações, ferramentas, comunicados, contatos) |
| `prisma/migrations/` | Migrações versionadas |
| `src/lib/db.server.ts` | Singleton do Prisma Client |
| `src/lib/auth.server.ts` | Hash bcrypt, sign/verify JWT, refresh tokens com rotação |
| `src/lib/auth.functions.ts` | `signUp`, `signIn`, `signOut`, `refreshSession`, `getCurrentUser` |
| `src/lib/auth-middleware.local.ts` | `requireAuth` / `requireRole` para server functions |
| `src/lib/auth-attacher.local.ts` | Cliente: anexa `Authorization: Bearer <jwt>` automaticamente |
| `src/lib/auth-client.ts` | Gerência de tokens no navegador (memória + localStorage) |
| `src/lib/storage.server.ts` | Salva/leitura de arquivos em disco local |
| `src/routes/api/upload.ts` | Endpoint de upload autenticado |
| `src/routes/api/files.$.ts` | Endpoint de leitura pública de arquivos |

## 6) Diferenças importantes vs Supabase

| Supabase | Postgres puro |
|---|---|
| `auth.users` (gerenciado) | tabela `users` própria, com `password_hash` |
| `auth.uid()` em RLS | checagem no **código** via `requireAuth` + Prisma `where` |
| RLS policies | filtros explícitos no código (Prisma) |
| Service role key | acesso direto ao Postgres via Prisma |
| Trigger `handle_new_user` | feito em `signUp` (promove tecipp@... a admin) |
| Storage buckets | disco local em `UPLOAD_DIR` |
| `supabase.auth.getUser()` | `getCurrentUser()` server fn |
| `supabase.auth.signInWithPassword` | `signIn` server fn |

## 7) Script de migração de dados do Supabase

Criado em `scripts/migrate-from-supabase.ts`. Ele lê do Supabase atual
(auth.users, public.profiles, public.user_roles, public.unidades, etc.) e
faz `upsert` no Postgres local, respeitando FKs. Também baixa os arquivos dos
buckets `portal-media` e `portal-avatars` para `UPLOAD_DIR`.

Preencha em `.env`:
```
MIGRATE_SUPABASE_URL="https://<ref>.supabase.co"
MIGRATE_SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

Rode (fora do Docker, com o Postgres local acessível):
```bash
npx prisma generate
npx tsx scripts/migrate-from-supabase.ts
```

Ou, dentro do container:
```bash
docker compose exec app bunx tsx scripts/migrate-from-supabase.ts
```

Após concluir, remova as variáveis `MIGRATE_*` do `.env`.

## 8) Próximos passos

- **Testes end-to-end** do Docker em ambiente de staging.
- **Customização da identidade visual** (cores, logos, domínio) — ajuste
  `src/styles.css` e `PUBLIC_APP_URL`.

## 8) Como o auth caseiro funciona (resumo)

1. **Login**: `signIn(email, senha)` valida com bcrypt → devolve `accessToken` (JWT 15min) + `refreshToken` (opaco, 30 dias).
2. Cliente guarda `accessToken` em memória e `refreshToken` em `localStorage` (`portal-te.refreshToken`).
3. A cada server fn, o middleware `attachLocalAuth` injeta `Authorization: Bearer <jwt>`.
4. No servidor, `requireAuth` valida o JWT e popula `context.userId / roles`.
5. Quando o JWT expira (401), o cliente chama `refreshSession(refreshToken)` que **rotaciona** o refresh (revoga o antigo, emite novo).
6. Logout: `signOut(refreshToken)` revoga o refresh; cliente limpa localStorage.

## 9) Avisos

- **Não rode `prisma migrate` em produção sem backup.**
- O preview do Lovable não reflete mais o backend real; use o Docker local para validar.
- Para ajustar o primeiro admin, edite `src/lib/auth.functions.ts` na função `signUp`.
