# Portal TE — Colégio Positivo

Portal interno da equipe de Tecnologia Educacional: centraliza comunicados,
ferramentas, contatos, unidades e solicitações/chamados.

Aplicação **standalone**: roda em Docker, com Postgres próprio, backend
próprio (TanStack Start em Node), Prisma como camada de dados, autenticação
própria (JWT + bcrypt + Google OAuth opcional) e uploads em disco local.

---

## 1. Stack

| Camada | Tecnologia |
|---|---|
| Front-end | React 19 + TanStack Start/Router + Tailwind v4 + shadcn/ui |
| Back-end | Server functions do TanStack Start (Node, preset `node-server`) |
| Banco | PostgreSQL 16 |
| ORM | Prisma 6 |
| Auth | JWT (access 15min) + refresh token rotativo + bcrypt; Google OAuth opcional |
| Arquivos | Disco local (`UPLOAD_DIR`), servidos por `/api/files/*` |
| E-mail | SMTP via Nodemailer |

## 2. Requisitos

**Para rodar (recomendado):**
- Docker 24+ e Docker Compose v2
- Portas livres: `3000` (app) e `5432` (Postgres)

**Para desenvolver:**
- Node 22+ ou Bun 1.3+
- Um Postgres acessível (pode ser o do `docker compose up -d postgres`)

---

## 3. Instalação com Docker (produção / homologação)

```bash
# 1. Clone e entre no projeto
git clone <url-do-repositorio> portal-te
cd portal-te

# 2. Crie o arquivo de ambiente a partir do exemplo
cp .env.example .env

# 3. Gere os segredos JWT e cole no .env
openssl rand -base64 64   # JWT_SECRET
openssl rand -base64 64   # JWT_REFRESH_SECRET

# 4. Suba tudo
docker compose up -d --build
```

O `docker/entrypoint.sh` roda `prisma migrate deploy` automaticamente antes de
iniciar o servidor, então o banco é criado/atualizado sozinho.

**Verificação:**

```bash
docker compose ps                 # app deve ficar "healthy"
docker compose logs -f app        # acompanha o boot
curl -I http://localhost:3000     # deve responder 200
```

Acesse http://localhost:3000 e crie a primeira conta em `/auth`.

> No compose, `DATABASE_URL` e `UPLOAD_DIR` são sobrescritos para apontar para
> o container do Postgres e para o volume `portal_uploads`. Não adianta mudar
> essas duas no `.env` quando estiver usando Docker — mude no
> `docker-compose.yml`.

---

## 4. Instalação para desenvolvimento

```bash
# Postgres local (só o banco)
docker compose up -d postgres

cp .env.example .env
mkdir -p /var/lib/portal-te/uploads   # ou aponte UPLOAD_DIR pra outra pasta

bun install                # ou: npm install
npx prisma generate        # gera os tipos do Prisma (obrigatório)
npx prisma migrate dev     # aplica as migrações no banco

bun run dev                # http://localhost:8080
```

Comandos úteis:

| Comando | O que faz |
|---|---|
| `bun run dev` | Servidor de desenvolvimento com HMR |
| `bun run build:node` | Build standalone Node (`.output/server/index.mjs`) |
| `bun run lint` | ESLint |
| `npx prisma studio` | Interface visual do banco |
| `npx prisma migrate dev --name <nome>` | Cria nova migração a partir do schema |
| `npx prisma migrate deploy` | Aplica migrações existentes (produção) |

---

## 5. Variáveis de ambiente

Todas ficam no `.env` (nunca versione esse arquivo). Modelo: `.env.example`.

| Variável | Obrigatória | Exemplo | Para que serve |
|---|---|---|---|
| `DATABASE_URL` | Sim | `postgresql://portal:portal_dev_password@localhost:5432/portal_te?schema=public` | Conexão com o Postgres. No Docker é sobrescrita para o host `postgres`. |
| `JWT_SECRET` | Sim | string aleatória de 64+ chars | Assina o access token (15 min). |
| `JWT_REFRESH_SECRET` | Sim | string aleatória, **diferente** da acima | Assina/valida o refresh token (30 dias). |
| `PUBLIC_APP_URL` | Sim | `http://localhost:3000` | Base para callbacks OAuth e links enviados por e-mail. |
| `UPLOAD_DIR` | Sim | `/var/lib/portal-te/uploads` | Pasta onde ficam avatares e mídias. No Docker é um volume. |
| `GOOGLE_OAUTH_CLIENT_ID` | Não | `123...apps.googleusercontent.com` | Login com Google. Vazio = botão não funciona. |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Não | `GOCSPX-...` | Par do client ID. |
| `SMTP_HOST` | Não | `smtp.office365.com` | Servidor de e-mail. Vazio = e-mails caem no log. |
| `SMTP_PORT` | Não | `587` | Porta SMTP. |
| `SMTP_SECURE` | Não | `false` | `true` apenas para a porta 465. |
| `SMTP_USER` | Não | `no-reply@colegiopositivo.com.br` | Usuário SMTP (vazio = sem autenticação). |
| `SMTP_PASS` | Não | — | Senha SMTP. |
| `SMTP_FROM` | Não | `Portal TE <no-reply@colegiopositivo.com.br>` | Remetente exibido. |
| `MIGRATE_SUPABASE_URL` | Não | `https://<ref>.supabase.co` | Só para a migração de dados única (ver `MIGRACAO_POSTGRES.md`). |
| `MIGRATE_SUPABASE_SERVICE_ROLE_KEY` | Não | — | Idem. Remova após migrar. |

> Trocar `JWT_SECRET` ou `JWT_REFRESH_SECRET` invalida todas as sessões ativas:
> os usuários precisarão entrar de novo.

---

## 6. Primeiro acesso e administrador

1. Acesse `/auth` e crie a conta com **`tecipp@colegiopositivo.com.br`**.
2. Esse e-mail é promovido automaticamente a `admin` e já entra ativo.
3. Demais cadastros entram como `usuario` com status `pendente` e precisam ser
   aprovados em **Área TE → Usuários**.

Para mudar o e-mail do admin inicial, edite a função `signUp` em
`src/lib/auth.functions.ts`.

Papéis disponíveis: `admin`, `equipe_te`, `editor`, `usuario`.

---

## 7. Login com Google (opcional)

1. Google Cloud Console → **APIs & Services → Credentials → Create OAuth client ID**
   (Application type: **Web application**).
2. Em *Authorized redirect URIs*, adicione:
   `${PUBLIC_APP_URL}/api/auth/google/callback`
   (ex.: `http://localhost:3000/api/auth/google/callback`).
3. Copie **Client ID** e **Client Secret** para `GOOGLE_OAUTH_CLIENT_ID` e
   `GOOGLE_OAUTH_CLIENT_SECRET` no `.env`.
4. `docker compose restart app` (ou reinicie o `bun run dev`).

---

## 8. E-mail (SMTP)

Usado para recuperação de senha (`/forgot-password` → `/reset-password`) e
notificações. Se `SMTP_HOST` estiver vazio, nada é enviado: o conteúdo do
e-mail (incluindo o link de reset) é impresso no log — útil em desenvolvimento,
**não use assim em produção**.

```bash
docker compose logs -f app | grep "\[mail:dev\]"
```

---

## 9. Build de produção sem Docker

```bash
npx prisma generate
npx prisma migrate deploy
bun run build:node            # = vite build --config vite.config.node.ts
node .output/server/index.mjs # respeita PORT (padrão 3000)
```

`vite.config.ts` é o config do editor; **para servidor use sempre
`vite.config.node.ts`** (é o que o Dockerfile usa).

---

## 10. Operação

### Atualizar a aplicação

```bash
git pull
docker compose up -d --build   # migrações rodam sozinhas no boot
```

### Backup

```bash
# Banco
docker compose exec -T postgres pg_dump -U portal portal_te > backup-$(date +%F).sql

# Uploads
docker run --rm -v portal-te_portal_uploads:/data -v "$(pwd)":/backup alpine \
  tar czf /backup/uploads-$(date +%F).tgz -C /data .
```

### Restauração

```bash
cat backup-2026-01-01.sql | docker compose exec -T postgres psql -U portal -d portal_te

docker run --rm -v portal-te_portal_uploads:/data -v "$(pwd)":/backup alpine \
  tar xzf /backup/uploads-2026-01-01.tgz -C /data
```

> Os nomes dos volumes têm o prefixo do diretório do projeto. Confirme com
> `docker volume ls`.

---

## 11. Estrutura do projeto

| Caminho | Conteúdo |
|---|---|
| `prisma/schema.prisma` | Schema do banco (users, profiles, roles, unidades, solicitações, ferramentas, comunicados, contatos) |
| `prisma/migrations/` | Migrações versionadas |
| `src/routes/` | Rotas (arquivo = URL). `index.tsx` = home, `area-te.*` = área administrativa, `api/*` = endpoints HTTP |
| `src/lib/*.functions.ts` | Server functions (auth, usuários, perfil, conteúdo, solicitações, unidades) |
| `src/lib/db.server.ts` | Singleton do Prisma Client |
| `src/lib/auth.server.ts` | bcrypt, assinatura/verificação de JWT, refresh com rotação |
| `src/lib/auth-middleware.local.ts` | `requireAuth` / `requireRole` nas server functions |
| `src/lib/auth-client.ts` | Tokens no navegador (memória + localStorage) |
| `src/lib/storage.server.ts` | Gravação/leitura de arquivos em disco |
| `src/components/` | Componentes (upload de imagem, editor rich text, avatar, header/footer) |
| `docker/entrypoint.sh` | `prisma migrate deploy` + start do servidor |
| `scripts/migrate-from-supabase.ts` | Migração única de dados vindos do Supabase |

### Como o auth funciona

1. `signIn(email, senha)` valida com bcrypt → devolve `accessToken` (JWT, 15 min)
   e `refreshToken` (opaco, 30 dias).
2. O cliente guarda o access em memória e o refresh em
   `localStorage['portal-te.refreshToken']`.
3. Cada chamada de server function passa pelo `attachLocalAuth`, que injeta
   `Authorization: Bearer <jwt>`.
4. No servidor, `requireAuth` valida o JWT e popula `userId` / `roles`.
5. Ao receber 401, o cliente chama `refreshSession`, que **rotaciona** o refresh
   (revoga o antigo, emite um novo).
6. `signOut` revoga o refresh e limpa o localStorage.

Não há RLS: as regras de acesso vivem no código, via `requireAuth`/`requireRole`
e filtros explícitos do Prisma.

---

## 12. Solução de problemas

| Sintoma | Causa provável / solução |
|---|---|
| `bind: address already in use` | Porta 3000 ou 5432 ocupada. Mude o mapeamento em `docker-compose.yml`. |
| App reinicia em loop, log cita `DATABASE_URL` | `.env` ausente ou sem `DATABASE_URL`. `cp .env.example .env`. |
| `P1001: Can't reach database server` | Postgres ainda subindo ou host errado (dentro do compose o host é `postgres`, não `localhost`). |
| Erros de tipo `has no exported member 'AppRole'` | Falta rodar `npx prisma generate`. |
| `The table ... does not exist` | Migrações não aplicadas: `npx prisma migrate deploy`. |
| Uploads somem ao recriar o container | `UPLOAD_DIR` fora do volume. Mantenha `/var/lib/portal-te/uploads`. |
| Todos os usuários deslogados de repente | `JWT_SECRET`/`JWT_REFRESH_SECRET` mudaram. Comportamento esperado. |
| Imagens retornam 404 em `/api/files/...` | Arquivo ausente no `UPLOAD_DIR` (volume novo ou backup não restaurado). |
| E-mail de reset não chega | `SMTP_HOST` vazio → link no log; ou credenciais SMTP incorretas. |
| Login com Google dá erro de redirect | Redirect URI no Google Cloud diferente de `${PUBLIC_APP_URL}/api/auth/google/callback`. |

---

## 13. Migração de dados do Supabase

Se você está vindo da versão hospedada com Supabase, veja
[`MIGRACAO_POSTGRES.md`](./MIGRACAO_POSTGRES.md).