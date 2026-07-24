## Objetivo

Transformar o Portal TE em uma aplicação **100% independente do Lovable/Supabase**, empacotada em Docker, com Postgres + Prisma + backend próprio (Node) + frontend React servido pelo mesmo servidor. Instalação: `git clone` → `cp .env.example .env` → `docker compose up -d` → pronto.

A Fase A (Prisma schema, auth caseiro JWT/bcrypt, `db.server.ts`, `auth.functions.ts`, docker-compose do Postgres) já está feita. Este plano é a **Fase B**: trocar toda a camada Supabase por Prisma + disco local, mudar o runtime de Cloudflare Worker para Node, e empacotar tudo em Docker.

---

## Escopo

### 1. Runtime: Cloudflare Worker → Node.js

- Substituir `@lovable.dev/vite-tanstack-config` por config Vite/TanStack Start padrão apontando para preset **`node-server`** (não `cloudflare`).
- Reescrever `src/server.ts` como entry Node (sem `env`/`ctx` do Worker).
- Remover `wrangler`/nitro-cloudflare do build.

### 2. Auth: Supabase Auth → JWT caseiro (já pronto no backend)

- Trocar `src/lib/use-auth.ts` para consumir `getCurrentUser` + `signIn`/`signOut`/`refreshSession` locais.
- Reescrever `src/routes/auth.tsx` (login/signup/reset) chamando as server fns locais.
- Criar `/reset-password` (token por e-mail via SMTP, ou log em dev).
- Em `src/start.ts`, trocar `attachSupabaseAuth` por `attachLocalAuth`.
- Refresh automático em 401 no cliente.
- Trigger de admin (`tecipp@colegiopositivo.com.br` + `joao.duarte@...`) migrado para o `signUp` do `auth.functions.ts`.

### 3. Data layer: PostgREST/`supabase-js` → Prisma

Reescrever todas as `*.functions.ts` para usar Prisma, com autorização explícita no código (substitui RLS):

- `users.functions.ts` — CRUD usuários, aprovar/bloquear, papéis.
- `unidades.functions.ts` — CRUD unidades + vínculos usuário↔unidade.
- Criar: `solicitacoes.functions.ts`, `tipos-solicitacao.functions.ts`, `comunicados.functions.ts`, `ferramentas.functions.ts`, `contatos.functions.ts`, `profiles.functions.ts`.
- Rotas públicas que hoje leem via `supabase` no cliente passam a chamar server fns.
- Helper `requireRole(...)` já existe em `auth-middleware.local.ts`.

### 4. Storage: Supabase Storage → disco local

- Rota `POST /api/upload` (multipart, autenticada, valida mime/tamanho) salva em `UPLOAD_DIR` com nome `uuid.ext`.
- Rota `GET /api/files/:path` serve com checagem de auth (buckets privados) ou público (avatares/imagens de comunicados/ferramentas — a escolher).
- Substituir `StorageImage`/`useSignedUrl` (`src/components/storage-image.tsx`) e `ImageUploadField` pelas novas rotas.
- Buckets viram pastas: `portal-media/`, `portal-avatars/`.

### 5. Migração de dados (Supabase → Postgres local)

Script `scripts/migrate-from-supabase.ts`:

1. Lê tabelas do Supabase via `supabase-js` (URL/anon existentes).
2. Insere no Postgres local via Prisma respeitando ordem de FKs.
3. Baixa arquivos dos buckets e salva em `UPLOAD_DIR`, reescrevendo caminhos.
4. Usuários: cria em `users` sem senha (`password_hash = null`) e força fluxo "definir senha" no primeiro login (token por e-mail).

### 6. Docker & empacotamento

- `Dockerfile` multi-stage (deps → build → runtime Node 20-alpine, non-root, healthcheck em `/api/health`).
- `docker-compose.yml` completo com 3 serviços: `postgres`, `app` (porta 3000), `migrator` (roda `prisma migrate deploy` uma vez).
- Volumes: `pgdata`, `uploads`.
- `.env.example` já existe — completar com `SESSION_SECRET`, `NODE_ENV`, etc.
- `entrypoint.sh`: espera Postgres → `prisma migrate deploy` → `node .output/server/index.mjs`.

### 7. Limpeza final

Remover: `src/integrations/supabase/*`, `supabase/`, dependência `@supabase/supabase-js`, `MIGRACAO_POSTGRES.md` (substituído por `README.md` novo com instrução Docker), `attachSupabaseAuth`, arquivos `.server.ts` do Supabase.

### 8. Documentação

`README.md` novo cobrindo: pré-requisitos (Docker), instalação em 3 comandos, primeiro login admin, backup do volume Postgres, migração a partir de instância Supabase existente, configuração OAuth Google (opcional), SMTP para reset de senha.

---

## Ordem de execução (para não quebrar tudo de uma vez)

```text
1. Runtime Node + Dockerfile + compose (app roda vazio)
2. Auth cliente (use-auth + auth.tsx + start.ts) apontando pro backend local
3. Reescrever functions Prisma módulo a módulo:
   profiles → users → unidades → tipos-solicitacao →
   solicitacoes → comunicados → ferramentas → contatos
4. Rotas de upload/download + trocar StorageImage/ImageUploadField
5. Script de migração de dados Supabase→local
6. Remover código Supabase morto
7. README + smoke test end-to-end via Docker
```

Cada passo mantém o app buildando; passos 3.x são independentes por módulo.

---

## Trade-offs (pontos importantes)

- **Preview do Lovable para de funcionar** a partir do passo 1 (runtime Node ≠ Cloudflare Worker). Desenvolvimento passa a ser 100% local via `docker compose up`.
- **Perde**: realtime do Supabase (não usamos hoje), UI de admin do Supabase, edge global. **Ganha**: autonomia total, `psql`/`prisma studio` direto, deploy em qualquer VPS.
- **Reset de senha por e-mail**: exige SMTP configurado; sem SMTP, o link vai pro log do container (ok em dev).
- **OAuth Google**: opcional, adiciono se você quiser manter — precisa cadastrar redirect URI da URL pública final.
- **Escala**: single-node com disco local. Multi-instância exigiria S3/MinIO no futuro (fácil de trocar depois).

---

## Perguntas antes de começar

1. **URL pública final**: já tem domínio definido (ex.: `portal-te.colegiopositivo.com.br`) ou rodo tudo com placeholder `http://localhost:3000` e você troca depois?
2. **OAuth Google**: mantém no MVP ou fica só e-mail/senha por enquanto?
3. **Migração de dados Supabase**: quer que eu escreva o script pra puxar os dados atuais (comunicados, ferramentas, usuários já cadastrados) ou começa base zerada?
4. **SMTP**: você já tem servidor SMTP (do Colégio) ou uso Mailhog no compose pra desenvolvimento e você pluga o real depois?
