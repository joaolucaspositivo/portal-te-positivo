## Objetivo

Concluir a Fase B: eliminar todo o resto do Supabase (dados, storage e auth nas telas) para o Portal TE rodar 100% no Docker com Postgres + Prisma + auth próprio.

## Estado atual (verificado)

- Já migrados: `auth.server.ts`, `auth-client.ts`, `users.functions.ts`, `mail.server.ts`, `storage.server.ts`, rotas `/api/upload`, `/api/files/$`, OAuth Google, `/auth`, `/forgot-password`, `/reset-password`, schema + migração Prisma.
- Ainda usam Supabase: `unidades.functions.ts`, `auth.functions.ts`, os dois componentes de imagem e praticamente todas as rotas (`area-te.*`, `comunicados`, `contatos`, `ferramentas`, `solicitacoes.*`, `index`), além de `src/start.ts` e da pasta `src/integrations/supabase/`.

## Plano

### 1. Novas camadas de dados (Prisma + auth local)
Criar server functions no padrão já usado (validação Zod, `requireLocalAuth`, serializadores de `prisma-helpers.server.ts`):
- `src/lib/conteudo.functions.ts` — ferramentas, comunicados e contatos: listagem pública (somente colunas seguras para não autenticados) e CRUD restrito a admin/equipe_te/editor.
- `src/lib/solicitacoes.functions.ts` — tipos e campos de solicitação (form builder), criação pública de solicitação com validação, listagem/atualização de status, responsável e observações internas para a equipe.
- Reescrever `src/lib/unidades.functions.ts` para Prisma (CRUD de unidades + vínculo usuário-unidade), preservando as assinaturas atuais.
- Adicionar helper `assertRole` em módulo `.server.ts` separado (regra de splitting: arquivos com `createServerFn` só contêm imports e as funções).

### 2. Storage local nos componentes
- `image-upload-field.tsx`: enviar via `POST /api/upload` (multipart) em vez do storage do Supabase; remoção via endpoint de delete autenticado.
- `storage-image.tsx`: montar a URL diretamente de `/api/files/<bucket>/<path>`, dispensando URLs assinadas.

### 3. Rotas
- Trocar em todas as rotas o cliente Supabase por chamadas às novas server functions (TanStack Query mantido).
- `area-te.tsx`: guarda de acesso pelo `use-auth` local (JWT), sem sessão Supabase.
- Rotas públicas (`index`, `comunicados`, `ferramentas`, `contatos`, `solicitacoes.*`) passam a ler pelas funções públicas.

### 4. Limpeza e verificação
- Remover `src/integrations/supabase/`, `supabase/config.toml` e as referências em `src/start.ts` (mantendo apenas `attachLocalAuth`).
- Remover a dependência `@supabase/supabase-js` do `package.json`.
- Rodar typecheck e build; conferir a home e uma rota admin no preview.

## Notas técnicas

- Sem RLS: toda a autorização passa a ser explícita nos handlers (papel do usuário lido de `user_roles`), então cada função de escrita precisa de checagem de papel — esse é o ponto de maior risco da etapa.
- Listagens públicas devolvem DTOs reduzidos (contatos sem e-mail/telefone para anônimos), mantendo o endurecimento de segurança já feito antes.
- Uploads gravam em volume Docker montado em `/app/uploads`.
