## Painel de Gestão de Unidades

Criar área administrativa para cadastrar e gerenciar unidades escolares do grupo, vincular usuários a múltiplas unidades e segmentar solicitações por unidade. Acesso restrito a administradores.

---

### 1. Banco de dados (migração)

**Tabela `unidades`**
- `nome` (text, obrigatório), `sigla` (text, único), `status` (enum `unidade_status`: `ativa` | `inativa`, default `ativa`)
- Endereço: `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `estado` (UF, 2 chars)
- Contato: `telefone`, `email`, `responsavel_nome`, `responsavel_cargo`
- Padrão: `id` uuid, `created_at`, `updated_at` (trigger `set_updated_at`)
- RLS:
  - `SELECT` para `authenticated` (qualquer usuário logado pode ler para preencher selects)
  - `INSERT/UPDATE/DELETE` apenas para admin (via `has_role`)
- GRANTs: `SELECT, INSERT, UPDATE, DELETE` para `authenticated`; `ALL` para `service_role`

**Tabela de vínculo N:N `usuario_unidades`**
- `user_id` (uuid → auth.users), `unidade_id` (uuid → unidades), `principal` (boolean, default false), `created_at`
- PK composta (`user_id`, `unidade_id`); garantir no máximo uma `principal = true` por usuário via índice parcial único
- RLS:
  - `SELECT` próprio vínculo OU admin
  - `INSERT/UPDATE/DELETE` apenas admin
- GRANTs equivalentes

**Tabela `solicitacoes`**
- Adicionar coluna `unidade_id` (uuid → unidades, nullable inicialmente para não quebrar registros antigos)
- Atualizar policies de leitura/insert para permitir filtrar por unidade

**Função auxiliar**
- `public.user_pertence_unidade(_user_id uuid, _unidade_id uuid)` SECURITY DEFINER — usada em policies futuras

---

### 2. Server functions (`src/lib/unidades.functions.ts`)

Todas com `requireSupabaseAuth` + verificação `has_role('admin')`:
- `listUnidades({ status?, q? })` — lista com filtros (admin vê todas; chamada pública para selects retorna só `ativa`)
- `getUnidade(id)`
- `createUnidade(input)`
- `updateUnidade({ id, ...campos })`
- `setUnidadeStatus({ id, status })` — ativa/desativa
- `deleteUnidade(id)` — apenas se não houver vínculos/solicitações
- `listUsuariosDaUnidade(unidadeId)`
- `vincularUsuario({ unidadeId, userId, principal? })`
- `desvincularUsuario({ unidadeId, userId })`
- `definirUnidadePrincipal({ unidadeId, userId })`

---

### 3. Rotas (frontend)

**`/area-te/unidades`** (`src/routes/area-te.unidades.tsx`)
- Lista em tabela: nome, sigla, cidade/UF, nº de usuários vinculados, status (badge), ações
- Filtros: busca por nome/sigla, status (todas / ativas / inativas)
- Botão "Nova unidade" abre `AdminFormShell` com abas/seções: Identificação · Endereço · Contato
- Ações por linha: editar, ativar/desativar, excluir (com confirmação)

**`/area-te/unidades/$id`** (`src/routes/area-te.unidades.$id.tsx`)
- Edição completa dos dados da unidade
- Seção "Usuários vinculados": tabela com avatar, nome, e-mail, marcação de "principal", botão remover; busca de usuário existente + botão vincular
- Reuso de `UserAvatar`

**Atualizar `/area-te/usuarios`**
- Na gaveta de edição, adicionar seção "Unidades" com multi-select dos vínculos e seletor de unidade principal

**Atualizar `/area-te`**
- Adicionar card de navegação "Unidades" no painel da Área TE

**Atualizar formulário público de solicitação (`/solicitacoes/$slug`)**
- Se o usuário autenticado tiver mais de uma unidade vinculada → exibir seletor obrigatório "Unidade"
- Se tiver apenas uma → preencher automaticamente
- Gravar `unidade_id` na solicitação

**Atualizar listagem `/area-te/solicitacoes`**
- Coluna e filtro por unidade

---

### 4. Permissões e UX

- Acesso a `/area-te/unidades*` bloqueado com a mesma mensagem usada em `/area-te/usuarios` quando não-admin
- Não é possível desativar unidade que ainda tenha solicitações em aberto (aviso, não bloqueio definitivo) — desativar apenas oculta de novos cadastros, mantém histórico
- Excluir unidade só é permitido sem vínculos nem solicitações; caso contrário sugerir "Desativar"

---

### 5. Detalhes técnicos

- Tipos do Supabase serão regenerados após a migração
- `src/lib/use-auth.ts` ganha helper `unidades` (lista de unidades do usuário logado) carregado junto do perfil
- Todas as policies seguem o padrão existente (`has_role(auth.uid(), 'admin')`)
- Migração inclui GRANTs explícitos conforme regra do projeto
- Nenhuma alteração em tabelas geridas pelo Supabase (`auth.*` etc.)
