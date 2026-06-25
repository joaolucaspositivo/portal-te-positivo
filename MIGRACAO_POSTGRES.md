# Migração Supabase → Postgres puro (Fase A)

Esta fase entrega a **fundação** para sair do Supabase:
camada de banco (Prisma), auth caseiro (JWT + bcrypt) e infra local (Docker).

O app **ainda continua usando Supabase** para Storage e para as tabelas existentes
até a Fase B (migração de dados + troca das `*.functions.ts`). Os erros de
TypeScript em `src/lib/auth.server.ts`, `db.server.ts`, etc. **desaparecem**
depois que você rodar `prisma generate` (passo 4 abaixo).

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
- `GOOGLE_OAUTH_*` — só se for ativar login Google (opcional na Fase A)

## 3) Instale dependências

Já estão no `package.json` desta fase:
`prisma`, `@prisma/client`, `bcryptjs`, `jsonwebtoken`.

```bash
bun install
```

## 4) Gere o cliente Prisma e aplique o schema

```bash
# Gera os tipos TypeScript do Prisma (isso elimina os erros TS)
npx prisma generate

# Cria as tabelas no Postgres a partir de prisma/schema.prisma
npx prisma migrate dev --name init
```

Pra inspecionar visualmente:

```bash
npx prisma studio
```

## 5) Estrutura entregue nesta fase

| Arquivo | Função |
|---|---|
| `docker-compose.yml` | Postgres 16 local |
| `prisma/schema.prisma` | Schema completo (users, profiles, roles, unidades, solicitações, ferramentas, comunicados, contatos) |
| `src/lib/db.server.ts` | Singleton do Prisma Client |
| `src/lib/auth.server.ts` | Hash bcrypt, sign/verify JWT, refresh tokens com rotação |
| `src/lib/auth.functions.ts` | `signUp`, `signIn`, `signOut`, `refreshSession`, `getCurrentUser` |
| `src/lib/auth-middleware.local.ts` | `requireAuth` / `requireRole` para server functions |
| `src/lib/auth-attacher.local.ts` | Cliente: anexa `Authorization: Bearer <jwt>` automaticamente |

## 6) Diferenças importantes vs Supabase

| Supabase | Postgres puro |
|---|---|
| `auth.users` (gerenciado) | tabela `users` própria, com `password_hash` |
| `auth.uid()` em RLS | checagem no **código** via `requireAuth` + Prisma `where` |
| RLS policies | filtros explícitos no código (Prisma) |
| Service role key | acesso direto ao Postgres via Prisma |
| Trigger `handle_new_user` | feito em `signUp` (promove tecipp@... a admin) |
| Storage buckets | disco local em `UPLOAD_DIR` (implementado na Fase B) |
| `supabase.auth.getUser()` | `getCurrentUser()` server fn |
| `supabase.auth.signInWithPassword` | `signIn` server fn |

## 7) Próximos passos (Fase B — quando esta estiver validada)

1. Trocar `src/lib/use-auth.ts` para consumir `getCurrentUser` + tokens locais
2. Reescrever `src/routes/auth.tsx` para chamar `signIn`/`signUp` locais
3. Substituir `attachSupabaseAuth` em `src/start.ts` por `attachLocalAuth`
4. Reescrever `users.functions.ts`, `unidades.functions.ts`, etc. com Prisma
5. Trocar Storage: rota `POST /api/upload` salvando em `UPLOAD_DIR`; rota `GET /api/files/:path` servindo com checagem de auth
6. Script de migração de dados: exportar tabelas do Supabase (`pg_dump`) e importar no Postgres local
7. Remover `supabase/`, `@supabase/supabase-js`, `src/lib/supabase*.ts`

## 8) Como o auth caseiro funciona (resumo)

1. **Login**: `signIn(email, senha)` valida com bcrypt → devolve `accessToken` (JWT 15min) + `refreshToken` (opaco, 30 dias).
2. Cliente guarda `accessToken` em `localStorage` (`portal-te.accessToken`) e o `refreshToken` em cookie `httpOnly` (a configurar na Fase B; por ora, também em localStorage).
3. A cada server fn, o middleware `attachLocalAuth` injeta `Authorization: Bearer <jwt>`.
4. No servidor, `requireAuth` valida o JWT e popula `context.userId / roles`.
5. Quando o JWT expira (401), o cliente chama `refreshSession(refreshToken)` que **rotaciona** o refresh (revoga o antigo, emite novo) — proteção contra replay.
6. Logout: `signOut(refreshToken)` revoga o refresh; cliente limpa localStorage.

## 9) Avisos

- Os erros TS atuais somem após `prisma generate`.
- **Não rode `prisma migrate` em produção sem backup.**
- O preview do Lovable continua funcionando com Supabase até concluirmos a Fase B.