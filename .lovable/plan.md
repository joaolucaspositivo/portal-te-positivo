## Problema

Em `/solicitacoes/geral` (e nos demais tipos), o card abre mas a página mostra "Tipo de solicitação não encontrado". A causa não é o slug nem o componente — é que as tabelas `solicitacao_tipos`, `solicitacao_campos` e `solicitacoes` não têm `GRANT` para os papéis `anon` / `authenticated` no schema `public`. As policies RLS existem e estão corretas, mas, sem o `GRANT`, o Data API (PostgREST) rejeita a consulta antes mesmo de avaliar a RLS — então `tipo` chega como `null` no componente.

Conferido no banco: as três tabelas só têm grants para `sandbox_exec`. As policies já tratam corretamente:
- `Tipos public read ativos` → anon
- `Tipos auth read all` / `Tipos admin write` → authenticated
- `Campos public read` → anon + authenticated
- `Create solicitacoes validated` (INSERT) → anon + authenticated
- `Users read own solicitacoes`, `Admins read/update/delete` → authenticated

## Correção

Uma única migração que adiciona os grants necessários, alinhados às policies já existentes:

- `solicitacao_tipos`: `GRANT SELECT` a `anon`; `GRANT SELECT, INSERT, UPDATE, DELETE` a `authenticated`; `GRANT ALL` a `service_role`.
- `solicitacao_campos`: `GRANT SELECT` a `anon`; `GRANT SELECT, INSERT, UPDATE, DELETE` a `authenticated`; `GRANT ALL` a `service_role`.
- `solicitacoes`: `GRANT INSERT` a `anon` (compatível com a policy `Create solicitacoes validated`); `GRANT SELECT, INSERT, UPDATE, DELETE` a `authenticated`; `GRANT ALL` a `service_role`.

Nenhuma policy é alterada. Nenhum código de frontend precisa mudar — o componente `solicitacoes.$slug.tsx` já trata corretamente os dados quando a query retorna o tipo.

## Verificação

Após a migração, abrir `/solicitacoes` e clicar em "Geral" deve carregar o formulário com os campos dinâmicos. Envio do formulário (anônimo e logado) deve gravar em `solicitacoes`.

## Fora de escopo

- Não mexer no fluxo de autenticação.
- Não alterar policies de RLS.
- Não tocar nas correções de segurança anteriores (`profiles_public`, `has_role`, `contatos`, `portal-media`).
