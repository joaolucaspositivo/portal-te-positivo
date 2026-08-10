# Revisão da documentação de instalação do Portal TE

## Situação atual

- Não existe `README.md` na raiz — só `README.standalone.md` e `MIGRACAO_POSTGRES.md`.
- `MIGRACAO_POSTGRES.md` mistura histórico da migração (Fase A/B) com instruções de instalação, tem duas seções numeradas "8" e mantém avisos desatualizados sobre o preview do Lovable.
- `README.standalone.md` repete boa parte do conteúdo (Docker, SMTP, Google OAuth, backup) e ainda traz uma tabela de status da migração que não interessa a quem só quer instalar.
- Ainda existem `supabase/config.toml` (não usado) e `scripts/migrate-from-supabase.ts` (válido, usa `@supabase/supabase-js` em devDependencies).
- O build documentado é `npx vite build --config vite.config.node.ts`; já existe o script equivalente `bun run build:node`.

## O que será feito

### 1. Criar `README.md` na raiz (documento principal)

Documento único e completo de instalação, em português, com:

- Visão geral do Portal TE e stack (TanStack Start + Node, Postgres 16, Prisma, auth próprio JWT/bcrypt, uploads em disco).
- Requisitos (Docker + Compose, ou Node/Bun + Postgres para desenvolvimento).
- **Instalação rápida com Docker** — copiar o arquivo de ambiente de exemplo, editar segredos, `docker compose up -d --build`, checagem de saúde e primeiro acesso.
- **Instalação para desenvolvimento** — `bun install`, `npx prisma generate`, `npx prisma migrate dev`, `bun run dev`.
- **Tabela completa de variáveis de ambiente**: nome, se é obrigatória, exemplo e para que serve (banco, segredos JWT, URL pública, diretório de uploads, SMTP, Google OAuth, variáveis de migração).
- **Primeiro admin** — o cadastro com `tecipp@colegiopositivo.com.br` vira admin; onde alterar (`src/lib/auth.functions.ts`).
- **Login com Google** — passo a passo no Google Cloud e a redirect URI correta.
- **SMTP** — comportamento quando o host não está configurado (link cai no log do container).
- **Build de produção** — `bun run build:node` / `node .output/server/index.mjs` e o que o `entrypoint.sh` faz (`prisma migrate deploy`).
- **Operação** — backup do banco e do volume de uploads, restauração, atualização da aplicação, comandos úteis (`logs`, `restart`, `prisma studio`).
- **Estrutura do projeto** — tabela de pastas e arquivos-chave.
- **Solução de problemas** — porta ocupada, app não sobe por falta da URL do banco, migrações pendentes, uploads sumindo (volume), 401 no login após troca dos segredos JWT.

### 2. Reescrever `MIGRACAO_POSTGRES.md`

Focar apenas na migração de dados vinda do Supabase: pré-requisitos, variáveis de migração, como rodar o script dentro e fora do Docker, o que é migrado (usuários, perfis, papéis, unidades, solicitações, arquivos dos buckets) e o que fazer depois. Remover as seções de instalação (movidas para o README), corrigir a numeração duplicada e os avisos desatualizados.

### 3. Remover `README.standalone.md`

Como o README principal passa a cobrir a instalação standalone, esse arquivo sai para evitar documentação duplicada e divergente. O conteúdo útil (backup, OAuth, SMTP, build Node) é absorvido pelo README.

### 4. Atualizar o arquivo de exemplo de ambiente

Comentários mais explícitos por variável, marcando o que é obrigatório e o que é opcional, alinhados à tabela do README.

## Fora do escopo

- Nenhuma mudança em código da aplicação, schema Prisma, Dockerfile ou compose.
- Remoção da pasta `supabase/` e do script de migração (posso fazer depois, se quiser).