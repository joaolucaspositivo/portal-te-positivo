# Portal multi-setor: transformar o Portal TE em plataforma de portais

## Recomendação principal: evoluir, não refazer

Refazer do zero jogaria fora quase tudo que já funciona (autenticação própria, perfis, unidades, solicitações dinâmicas, ferramentas, comunicados, contatos, upload de arquivos, Docker/Postgres/Prisma). Tudo isso continua igual num modelo multi-portal — o que muda é que cada registro passa a pertencer a um portal.

O caminho recomendado é uma evolução em etapas, com o portal da TE virando simplesmente "o primeiro portal" da plataforma.

## Como fica o produto

- Uma única plataforma, um único banco. Cada setor (TE, CIPP, etc.) tem seu portal, com conteúdo e permissões separados.
- Endereço por caminho: `/te`, `/cipp`, `/rh`. A raiz `/` vira uma vitrine com a lista de portais ativos e o botão "Solicitar um portal".
- Conta única de usuário: a mesma pessoa pode ser administradora do CIPP e leitora da TE.
- Um responsável solicita o portal por um formulário público; um administrador da plataforma aprova; só então o portal fica visível.
- Depois de aprovado, o responsável entra em Configurações e monta o portal: nome, sigla, logo, cores, textos da página inicial e da página Sobre.

## O que fica editável em Configurações

**Identidade**
- Nome do portal, sigla (usada no cabeçalho, menus e rótulos como "Área da TE"), logo, e-mail de contato, cor primária e secundária.

**Página inicial** (mesmo layout de hoje, campos fixos editáveis)
- Etiqueta, título e subtítulo do destaque, textos dos botões.
- Cards de acesso rápido: título e descrição de cada um; possibilidade de ocultar os que não se aplicam.
- Bloco "sobre o setor": três itens com ícone, título e descrição.
- Liga/desliga das seções de comunicados recentes e ferramentas em destaque.

**Página Sobre**
- Título, texto de abertura, lista de frentes de atuação (ícone, título, descrição) e bloco final "quando acionar".

Tudo com valores padrão já preenchidos, para o portal nunca nascer vazio.

## Papéis

- **Administrador da plataforma**: aprova portais, gerencia todos.
- **Administrador da plataforma**: também cadastra as unidades escolares e define quem é o administrador de cada unidade.
- **Administrador de unidade**: gerencia tudo referente à sua unidade (dados da unidade, usuários vinculados, solicitações da unidade, conteúdos ligados a ela).
- **Administrador do portal**: configura páginas, identidade e usuários do seu portal.
- **Equipe / editor / usuário**: como hoje, mas por portal.

## Menus da área administrativa

Área do portal reorganizada em menus claros:

- **Painel** — indicadores, como hoje.
- **Minhas solicitações** — só as solicitações abertas pela pessoa logada (ou pela unidade dela, quando for administradora de unidade), separado de "Todas as solicitações".
- **Solicitações** — visão completa, para equipe e administradores.
- **Páginas** — edição das páginas públicas (Início, Sobre e demais textos públicos), com pré-visualização.
- **Configurações** — identidade do portal (nome, sigla, logo, cores, contato), tipos de solicitação, unidades atendidas e demais ajustes.
- **Unidades** — visível ao administrador da plataforma (criar, ativar, desativar, definir administrador) e ao administrador de unidade (só a sua).
- **Usuários** — como hoje, com permissões por portal e por unidade.

## Acompanhamento de solicitações

Clicar em uma solicitação abre a página de acompanhamento, com:

- Cabeçalho com título, tipo, unidade, urgência, status atual e responsável.
- Linha do tempo do andamento: cada mudança de status e cada atualização ficam registradas com data e autor.
- Comentários: mensagens públicas (visíveis ao solicitante, com aviso por e-mail) e notas internas (só equipe).
- Anexos adicionais enviados depois da abertura.
- Ações da equipe: mudar status, definir responsável, definir prazo, encerrar.
- Link de acompanhamento para quem abriu sem estar logado, para consultar pelo e-mail recebido.

## Etapas de implementação

**Etapa 1 — Base multi-portal (banco)**
Criar as tabelas `portal` (slug, nome, sigla, status, cores, logo, contato), `portal_config` (conteúdo das páginas Início e Sobre em campos estruturados) e `portal_membro` (usuário + portal + papel). Adicionar a coluna de portal em ferramentas, comunicados, contatos, unidades, tipos de solicitação e solicitações. Migração de dados: criar o portal "TE" e vincular todo o conteúdo existente a ele.

**Etapa 2 — Contexto de portal na aplicação**
Mover as rotas públicas atuais para dentro de `/$portal` (`/te/ferramentas`, `/te/solicitacoes`…), resolver o portal pelo slug da URL e aplicar esse filtro em todas as consultas e gravações do servidor. Cabeçalho e rodapé passam a ler nome, sigla, logo e cores do portal ativo. Redirecionamentos permanentes dos endereços antigos (`/ferramentas` → `/te/ferramentas`) para não quebrar links já divulgados.

**Etapa 3 — Permissões por portal**
Trocar as checagens de papel global por checagens "papel neste portal", incluindo o papel de administrador da plataforma. Ajustar a área administrativa para operar sempre no contexto do portal atual.

**Etapa 4 — Tela de Configurações**
Página `/$portal/area/configuracoes` com abas Identidade, Página inicial e Página Sobre, reaproveitando os componentes de upload de imagem e editor de texto que já existem.

**Etapa 5 — Vitrine e cadastro de portais**
Página raiz com a lista de portais ativos, formulário público "Solicitar um portal" e painel do administrador da plataforma para aprovar, recusar, ativar e desativar.

**Etapa 6 — Menu de Páginas e menus reorganizados**
Separar "Páginas" (conteúdo público) de "Configurações" (identidade e ajustes) e reorganizar a navegação da área administrativa conforme a lista de menus acima.

**Etapa 7 — Minhas solicitações e acompanhamento**
Criar a visão "Minhas solicitações" e a página de acompanhamento com linha do tempo, comentários públicos, notas internas, anexos e ações da equipe. Inclui novas tabelas de histórico e de comentários, além de notificação por e-mail ao solicitante.

**Etapa 8 — Unidades sob a plataforma**
Cadastro de unidades restrito ao administrador da plataforma, com designação do administrador de unidade e permissões derivadas desse vínculo.

**Etapa 9 — Documentação**
Atualizar o README: instalação continua a mesma; acrescentar como criar o primeiro portal e o primeiro administrador da plataforma.

## Detalhes técnicos

- Isolamento: banco único, coluna `portalId` obrigatória nas tabelas de conteúdo, índices compostos `(portalId, ...)` e unicidade por portal (ex.: slug de tipo de solicitação único dentro do portal, não global).
- Resolução de tenant: rota `src/routes/$portal.tsx` com `beforeLoad` carregando o portal por slug (404 se inexistente ou inativo); o slug vai como parâmetro validado em cada server function, nunca confiando apenas no cliente.
- Autorização: `authz.server.ts` passa a expor `assertPortalRole(context, portalId, papel)`; `portal_membro` vira a fonte de verdade por portal, e `user_role` fica só para o papel global de plataforma.
- Tema: cores do portal aplicadas como variáveis CSS no layout do portal, mantendo os tokens semânticos existentes — sem cores fixas nos componentes.
- Configuração das páginas em colunas estruturadas/JSON validadas por Zod, com defaults no servidor para tolerar portais recém-criados.
- Migrações Prisma com preenchimento (backfill) do portal TE antes de tornar `portalId` obrigatório.
- Novos modelos: `SolicitacaoEvento` (histórico de status/ações) e `SolicitacaoComentario` (com marcador de interno/público e autor), ambos ligados a `Solicitacao` e filtrados por portal.
- `Unidade` ganha `adminUserId` (ou papel `admin_unidade` em `portal_membro` com escopo de unidade) e as consultas da área administrativa passam a filtrar por unidade quando o papel for de unidade.
- Acesso público ao acompanhamento por token opaco de leitura enviado no e-mail de confirmação, sem expor dados de outras solicitações.

## Ponto em aberto

Unidades passam a ser cadastradas só pelo administrador da plataforma e ficam compartilhadas entre os portais (mesma rede de escolas para todos os setores); cada portal escolhe quais atende.

Falta definir um ponto: o administrador de unidade manda em **todos os portais** dentro da sua unidade (ex.: vê as solicitações de TE e de CIPP daquela escola) ou apenas dentro do portal em que atua? Isso muda o desenho das permissões da Etapa 3.