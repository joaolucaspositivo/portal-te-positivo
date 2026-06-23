## Plano: Gestão de Usuários, Perfis e Solicitações Dinâmicas

Grande conjunto de mudanças, organizado em 4 módulos. Tudo respeitando RLS, sem expor service role no cliente.

---

### 1. Perfis de usuário + foto

**Banco:**
- Tabela `profiles` (1:1 com `auth.users`): `id`, `nome_completo`, `cargo`, `unidade`, `telefone`, `avatar_url`, `bio`, `status` (`pendente`/`ativo`/`bloqueado`), `created_at`, `updated_at`.
- Trigger `handle_new_user` atualizado: cria linha em `profiles` com `status='pendente'` para todo cadastro (exceto `tecipp@…`, que entra ativo + admin).
- RLS: cada usuário lê/edita o próprio perfil; admin lê/edita todos; equipe_te lê todos (para ver autor de chamados); leitura pública apenas dos campos seguros via view (`profiles_public`: id, nome, cargo, unidade, avatar_url) — usada em Contatos.
- Bucket `portal-avatars` (privado) com signed URLs, políticas: usuário sobe/atualiza só o próprio arquivo; admin gerencia tudo.

**Rotas/UI:**
- `/area-te/perfil` — formulário de edição do próprio perfil + upload de avatar (reaproveita `ImageUploadField`).
- Avatar do usuário logado no header (substitui texto de e-mail).

**Contatos:**
- Adicionar coluna `user_id` opcional em `contatos` (vincula contato a um perfil).
- Lista pública: quando `user_id` presente, exibe `avatar_url` do `profiles_public`; caso contrário, iniciais.

---

### 2. Gestão de Usuários (admin)

**Papéis** (enum `app_role` ampliado):
- `admin` — tudo.
- `equipe_te` — recebe atribuição de chamados, gerencia solicitações.
- `editor` — gerencia comunicados/ferramentas/contatos.
- `usuario` — padrão (abre solicitações logado).

**Fluxo de cadastro:** auto-cadastro em `/auth` → perfil criado com `status='pendente'` → admin aprova em `/area-te/usuarios`.

**Servidor (server functions com `requireSupabaseAuth` + check `has_role('admin')`):**
- `listUsers` — junta `auth.users` + `profiles` + `user_roles` (via `supabaseAdmin` dentro do handler).
- `approveUser`, `blockUser`, `updateUserProfile`, `setUserRoles`, `sendPasswordReset` (Auth Admin API: gera link de recuperação).
- `inviteUser` opcional (admin pode criar direto sem esperar auto-cadastro).

**UI `/area-te/usuarios`** (admin only — gate `_authenticated` + check no componente):
- Tabela: avatar, nome, e-mail, unidade, papéis (chips), status, ações.
- Filtros: status (pendente/ativo/bloqueado), papel, busca.
- Drawer de edição: dados do perfil + multi-select de papéis + botão "Enviar link de redefinição de senha" + bloquear/aprovar.
- Banner no topo de `/area-te` com nº de pendentes de aprovação.

**Bloqueio de login:** `/area-te/route.tsx` (layout) lê `profiles.status` do usuário logado; se `pendente` mostra tela "Aguardando aprovação"; se `bloqueado`, faz signOut.

---

### 3. Solicitações: construtor visual de formulários

**Banco (nova modelagem, mantendo `solicitacoes` existente):**

- `solicitacao_tipos`: `id`, `nome`, `slug`, `descricao`, `icone`, `responsavel_padrao_id` (FK profiles, opcional para sugestão), `ativo`, `ordem`, `created_at`, `updated_at`.
- `solicitacao_campos`: `id`, `tipo_id` (FK), `chave`, `label`, `tipo_campo` (`text`/`textarea`/`select`/`multiselect`/`date`/`number`/`email`/`url`/`file`/`checkbox`), `obrigatorio`, `opcoes` (jsonb — para selects), `placeholder`, `help_text`, `ordem`, `validacao` (jsonb: min/max/regex).
- Tabela `solicitacoes` adaptada:
  - Adicionar `tipo_id` (FK `solicitacao_tipos`), `respostas` (jsonb — armazena os campos dinâmicos), `responsavel_id` (FK `profiles`), `solicitante_id` (FK `profiles`, nullable para anônimos).
  - Manter campos atuais como fallback/legacy; novos chamados usam `respostas` + campos base (titulo, urgência, status).
- `solicitacao_comentarios` (opcional, fica para depois — não pedido agora).

**RLS:**
- `solicitacao_tipos`/`campos`: leitura pública (anon+auth) dos ativos; escrita só admin.
- `solicitacoes`: 
  - INSERT: autenticados criam para si (`solicitante_id = auth.uid()`); anônimos só se tipo permitir (campo `permite_anonimo` no tipo).
  - SELECT: próprio solicitante; equipe_te e admin tudo; responsável vê o seu.
  - UPDATE: admin + equipe_te.

**UI Admin:**
- `/area-te/tipos-solicitacao` — CRUD de tipos + drag-and-drop dos campos (formato simples: lista + botão "+ adicionar campo" com modal por tipo de campo).
- `/area-te/solicitacoes` — adiciona coluna "Tipo" + "Responsável", filtro por responsável, atribuição inline (select de equipe_te) na tela de detalhe.

**UI Público:**
- `/solicitacoes` — substituído por galeria de cards (um por tipo ativo) → clique abre `/solicitacoes/$slug` com o formulário gerado dinamicamente a partir de `solicitacao_campos`.
- Renderer dinâmico (`<DynamicForm fields={...} />`) com validação zod construída em runtime; respostas salvas em `respostas` (jsonb).
- Usuário logado: campos do solicitante pré-preenchidos do perfil.

---

### 4. Detalhes técnicos

**Novos arquivos:**
- `src/lib/users.functions.ts` — server fns de gestão de usuários (admin).
- `src/lib/profile.functions.ts` — perfil próprio.
- `src/components/avatar-upload.tsx`, `src/components/user-avatar.tsx`.
- `src/components/dynamic-form.tsx`, `src/components/field-builder.tsx`.
- Rotas: `area-te.usuarios.tsx`, `area-te.perfil.tsx`, `area-te.tipos-solicitacao.tsx`, `area-te.tipos-solicitacao.$id.tsx`, `solicitacoes.$slug.tsx`.

**Migrações (sequenciais):**
1. `profiles` + trigger + bucket `portal-avatars` + view `profiles_public`.
2. Enum `app_role` ampliado (`equipe_te`, `editor`, `usuario`) + `profiles.status`.
3. `solicitacao_tipos`, `solicitacao_campos` + alterações em `solicitacoes` (novas colunas, RLS revisada).
4. `contatos.user_id` (FK profiles).

**Migração de dados:**
- Criar 1 tipo "Geral" e mapear todas as solicitações existentes para ele (preservar dados).

**Dependências:** nada novo — usa shadcn já presente, zod já instalado.

**Escopo NÃO incluído** (pode virar fase 2 se quiser):
- Comentários/thread no chamado.
- Notificações por e-mail (precisaria scaffold de auth/transactional emails).
- Roteamento automático por tipo (manual por enquanto, mas tipo tem `responsavel_padrao_id` como sugestão pré-selecionada).

---

### Ordem de execução sugerida

1. Profiles + avatar + header + perfil próprio.
2. Papéis ampliados + gestão de usuários + aprovação.
3. Contatos com foto.
4. Construtor de formulários + renderer público + atribuição de chamados.

Confirma esse escopo ou quer ajustar algo (ex.: incluir comentários/e-mail agora, mudar nomes de papéis)?