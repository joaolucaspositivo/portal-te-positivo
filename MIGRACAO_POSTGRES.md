# Migração de dados: Supabase → Postgres local

Este documento cobre **apenas a migração única dos dados** da versão antiga
(hospedada no Supabase) para a instalação standalone em Postgres.

Para instalar e operar o Portal TE, veja o [README](./README.md).

---

## 1. Quando usar

Só se você tinha o Portal TE rodando no Supabase e quer trazer usuários,
conteúdos e arquivos para a nova instalação. Instalações novas podem ignorar
este documento (e o script `scripts/migrate-from-supabase.ts`).

## 2. Pré-requisitos

- Nova instalação já no ar, com as migrações aplicadas (`prisma migrate deploy`).
- Acesso ao projeto Supabase antigo: URL e **service role key**.
- Banco de destino idealmente vazio (o script faz `upsert`, mas é mais seguro).
- Backup do banco de destino antes de rodar.

## 3. Configuração

No `.env` da nova instalação, preencha temporariamente:

```
MIGRATE_SUPABASE_URL="https://<ref>.supabase.co"
MIGRATE_SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

Confirme também que `DATABASE_URL` aponta para o Postgres de destino e que
`UPLOAD_DIR` existe (é para lá que os arquivos serão baixados).

## 4. Execução

Fora do Docker (com o Postgres acessível pela máquina):

```bash
npx prisma generate
npx tsx scripts/migrate-from-supabase.ts
```

Dentro do container:

```bash
docker compose exec app bunx tsx scripts/migrate-from-supabase.ts
```

O script é idempotente: pode ser executado novamente em caso de falha no meio
do caminho.

## 5. O que é migrado

| Origem (Supabase) | Destino (Postgres) |
|---|---|
| `auth.users` | tabela `users` |
| `public.profiles` | `profiles` (nome, telefone, cargo, status, avatar) |
| `public.user_roles` | `user_roles` |
| `public.unidades` / `usuario_unidades` | `unidades` / `usuario_unidades` |
| `public.solicitacao_tipos` / `solicitacao_campos` | tipos e campos dos formulários |
| `public.solicitacoes` | `solicitacoes` (inclui responsável e unidade) |
| `public.ferramentas`, `comunicados`, `contatos` | tabelas equivalentes |
| Buckets `portal-media` e `portal-avatars` | arquivos em `UPLOAD_DIR/<bucket>/` |

A ordem respeita as chaves estrangeiras (usuários → perfis → papéis → unidades
→ solicitações → conteúdos).

## 6. O que **não** é migrado

- **Senhas.** O Supabase não expõe os hashes por API. Cada usuário precisa usar
  "Esqueci minha senha" (exige SMTP configurado) ou entrar com Google, ou o
  admin define uma senha nova em Área TE → Usuários.
- Sessões e refresh tokens ativos.
- Políticas de RLS — na versão standalone o controle de acesso é feito no
  código (`requireAuth` / `requireRole` + filtros do Prisma).

## 7. Depois de migrar

1. Confira contagens de registros:
   `docker compose exec postgres psql -U portal -d portal_te -c "select count(*) from users;"`
2. Valide login, avatares, imagens de comunicados/ferramentas e uma solicitação.
3. **Remova `MIGRATE_SUPABASE_URL` e `MIGRATE_SUPABASE_SERVICE_ROLE_KEY` do `.env`**
   e reinicie o app.
4. Opcional: remova `scripts/migrate-from-supabase.ts`, a pasta `supabase/` e a
   devDependency `@supabase/supabase-js`.

## 8. Equivalências Supabase → standalone

| Supabase | Standalone |
|---|---|
| `auth.users` (gerenciado) | tabela `users` com `password_hash` |
| `auth.uid()` em RLS | `requireAuth` + filtros no Prisma |
| Service role key | acesso direto ao Postgres via Prisma |
| Trigger `handle_new_user` | lógica dentro de `signUp` |
| Storage buckets | disco local em `UPLOAD_DIR` |
| `supabase.auth.signInWithPassword` | server fn `signIn` |
| `supabase.auth.getUser()` | server fn `getCurrentUser` |

## 9. Avisos

- Nunca rode `prisma migrate` em produção sem backup.
- A service role key dá acesso total ao projeto antigo: use-a apenas durante a
  migração e remova em seguida.
