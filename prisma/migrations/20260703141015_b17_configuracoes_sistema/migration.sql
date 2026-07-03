-- CreateEnum
CREATE TYPE "ConfiguracaoGrupo" AS ENUM ('categoria_comunicado', 'status_solicitacao', 'prioridade_solicitacao');

-- CreateTable
CREATE TABLE "configuracao_opcoes" (
    "id" UUID NOT NULL,
    "grupo" "ConfiguracaoGrupo" NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "cor" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "padrao" BOOLEAN NOT NULL DEFAULT false,
    "meta" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "configuracao_opcoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "configuracao_opcoes_grupo_ativo_ordem_idx" ON "configuracao_opcoes"("grupo", "ativo", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "configuracao_opcoes_grupo_slug_key" ON "configuracao_opcoes"("grupo", "slug");

INSERT INTO "configuracao_opcoes"
  ("id", "grupo", "slug", "nome", "descricao", "cor", "ativo", "ordem", "padrao", "meta", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'categoria_comunicado', 'atualizacao-de-ferramenta', 'Atualização de ferramenta', NULL, NULL, true, 10, false, NULL, now(), now()),
  (gen_random_uuid(), 'categoria_comunicado', 'novo-projeto', 'Novo projeto', NULL, NULL, true, 20, false, NULL, now(), now()),
  (gen_random_uuid(), 'categoria_comunicado', 'mudanca-de-processo', 'Mudança de processo', NULL, NULL, true, 30, false, NULL, now(), now()),
  (gen_random_uuid(), 'categoria_comunicado', 'aviso-importante', 'Aviso importante', NULL, NULL, true, 40, false, NULL, now(), now()),
  (gen_random_uuid(), 'categoria_comunicado', 'orientacao-pedagogica', 'Orientação pedagógica', NULL, NULL, true, 50, false, NULL, now(), now()),
  (gen_random_uuid(), 'categoria_comunicado', 'piloto-ou-teste', 'Piloto ou teste', NULL, NULL, true, 60, false, NULL, now(), now()),
  (gen_random_uuid(), 'categoria_comunicado', 'manutencao-ou-indisponibilidade', 'Manutenção ou indisponibilidade', NULL, NULL, true, 70, false, NULL, now(), now())
ON CONFLICT ("grupo", "slug") DO NOTHING;

INSERT INTO "configuracao_opcoes"
  ("id", "grupo", "slug", "nome", "descricao", "cor", "ativo", "ordem", "padrao", "meta", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'status_solicitacao', 'recebida', 'Recebida', NULL, NULL, true, 10, true, '{"aberta": true}'::jsonb, now(), now()),
  (gen_random_uuid(), 'status_solicitacao', 'em-triagem', 'Em triagem', NULL, NULL, true, 20, false, '{"aberta": true}'::jsonb, now(), now()),
  (gen_random_uuid(), 'status_solicitacao', 'em-analise', 'Em análise', NULL, NULL, true, 30, false, '{"aberta": true}'::jsonb, now(), now()),
  (gen_random_uuid(), 'status_solicitacao', 'em-execucao', 'Em execução', NULL, NULL, true, 40, false, '{"aberta": true}'::jsonb, now(), now()),
  (gen_random_uuid(), 'status_solicitacao', 'aguardando-retorno-do-solicitante', 'Aguardando retorno do solicitante', NULL, NULL, true, 50, false, '{"aberta": true}'::jsonb, now(), now()),
  (gen_random_uuid(), 'status_solicitacao', 'concluida', 'Concluída', NULL, NULL, true, 60, false, '{"aberta": false}'::jsonb, now(), now()),
  (gen_random_uuid(), 'status_solicitacao', 'redirecionada', 'Redirecionada', NULL, NULL, true, 70, false, '{"aberta": false}'::jsonb, now(), now()),
  (gen_random_uuid(), 'status_solicitacao', 'nao-aprovada', 'Não aprovada', NULL, NULL, true, 80, false, '{"aberta": false}'::jsonb, now(), now())
ON CONFLICT ("grupo", "slug") DO NOTHING;

INSERT INTO "configuracao_opcoes"
  ("id", "grupo", "slug", "nome", "descricao", "cor", "ativo", "ordem", "padrao", "meta", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'prioridade_solicitacao', 'baixa', 'Baixa', NULL, NULL, true, 10, false, '{"peso": 1}'::jsonb, now(), now()),
  (gen_random_uuid(), 'prioridade_solicitacao', 'media', 'Média', NULL, NULL, true, 20, true, '{"peso": 2}'::jsonb, now(), now()),
  (gen_random_uuid(), 'prioridade_solicitacao', 'alta', 'Alta', NULL, NULL, true, 30, false, '{"peso": 3}'::jsonb, now(), now()),
  (gen_random_uuid(), 'prioridade_solicitacao', 'critica', 'Crítica', NULL, NULL, true, 40, false, '{"peso": 4}'::jsonb, now(), now())
ON CONFLICT ("grupo", "slug") DO NOTHING;
