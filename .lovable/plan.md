## Objetivo

Concluir a migração standalone: nenhuma rota deve mais importar o cliente Supabase. A camada de dados (Prisma + auth local + storage local) já está pronta; falta ligar as telas nela e apagar o que sobrou do Supabase.

## Estado atual (verificado)

- Prontos: `auth.functions.ts`, `users.functions.ts`, `unidades.functions.ts`, `conteudo.functions.ts` (ferramentas, comunicados, contatos), `solicitacoes.functions.ts` (tipos, campos, criação pública, gestão), `authz.server.ts`, `storage.server.ts`, `/api/upload`, `/api/files/$`, `image-upload-field`, `storage-image`, `user-avatar`.
- Ainda importam Supabase: 18 rotas (`index`, `comunicados`, `contatos`, `ferramentas`, `solicitacoes.index`, `solicitacoes.$slug`, e todas as `area-te.*`), além de `src/start.ts` e `src/integrations/supabase/`.
- Falta uma função de "perfil próprio" (ler/atualizar dados e avatar do usuário logado) para a tela `area-te.perfil`.

## Etapa 1 — Perfil próprio

Adicionar em `src/lib/profile.functions.ts` (com middleware de auth local):
- `getMeuPerfil` — dados do usuário logado + papéis.
- `updateMeuPerfil` — nome, cargo, unidade, telefone, bio, avatar (caminho do storage local). Status e papéis não são editáveis pelo próprio usuário.
- `changeMinhaSenha` — senha atual + nova, com bcrypt.

## Etapa 2 — Rotas públicas

Substituir chamadas `supabase.from(...)` por `useSuspenseQuery`/`useQuery` sobre as server functions já existentes:
- `index.tsx` → `listComunicadosPublic`, `listFerramentasPublic`
- `comunicados.tsx` → `listComunicadosPublic`
- `ferramentas.tsx` → `listFerramentasPublic`
- `contatos.tsx` → `listContatosPublic` (e-mail/telefone continuam ocultos para anônimos)
- `solicitacoes.index.tsx` → `listTiposPublic`
- `solicitacoes.$slug.tsx` → `getTipoBySlug` + `listUnidades` + `createSolicitacao`

## Etapa 3 — Rotas administrativas (`area-te.*`)

- `area-te.tsx` (layout/guarda) → usar `useAuth` local em vez de sessão Supabase.
- `area-te.index.tsx` (dashboard/KPIs) → contagens vindas de `listSolicitacoes` e listas de conteúdo.
- `area-te.solicitacoes.tsx` / `.$id.tsx` → `listSolicitacoes`, `getSolicitacao`, `updateSolicitacao`, `listEquipeTE`.
- `area-te.tipos-solicitacao.tsx` / `.$id.tsx` → `listTiposAdmin`, `getTipo`, `saveTipo`, `deleteTipo`, `listCampos`, `saveCampo`, `deleteCampo`, `swapCamposOrdem`.
- `area-te.comunicados.tsx`, `.ferramentas.tsx`, `.contatos.tsx` → funções CRUD de `conteudo.functions.ts` + `listProfileOptions`.
- `area-te.usuarios.tsx` → funções de `users.functions.ts`.
- `area-te.perfil.tsx` → funções da Etapa 1.

Sem mudanças de layout ou visual: só a origem dos dados.

## Etapa 4 — Remoção do Supabase

- Apagar `src/integrations/supabase/` inteiro e `supabase/config.toml`.
- Limpar `src/start.ts` (só `attachLocalAuth`) e as variáveis `VITE_SUPABASE_*` do `.env.example`.
- Remover `@supabase/supabase-js` do `package.json`.
- Rodar typecheck e build para confirmar que nada mais referencia o Supabase.

## Notas técnicas

- Todos os DTOs continuam em snake_case via `prisma-helpers.server.ts`, então os componentes de tela quase não mudam — troca-se apenas a função de busca.
- Mutations passam a usar `useMutation` + `invalidateQueries`, mantendo os toasts atuais.
- Após esta etapa o portal roda 100% no Docker (Node + Postgres + Prisma), sem dependência do Lovable/Supabase; o preview do Lovable deixa de refletir o backend real.
