-- CreateEnum
CREATE TYPE "PortalStatus" AS ENUM ('pendente', 'ativo', 'inativo', 'recusado');

-- CreateEnum
CREATE TYPE "PortalPapel" AS ENUM ('admin_portal', 'equipe', 'editor', 'coordenador', 'usuario');

-- CreateEnum
CREATE TYPE "NotificacaoStatus" AS ENUM ('enviado', 'falhou');

-- DropForeignKey
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_id_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_user_id_fkey";

-- DropForeignKey
ALTER TABLE "solicitacao_campos" DROP CONSTRAINT "solicitacao_campos_tipo_id_fkey";

-- DropForeignKey
ALTER TABLE "solicitacoes" DROP CONSTRAINT "solicitacoes_tipo_id_fkey";

-- DropForeignKey
ALTER TABLE "solicitacoes" DROP CONSTRAINT "solicitacoes_unidade_id_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "usuario_unidades" DROP CONSTRAINT "usuario_unidades_unidade_id_fkey";

-- DropForeignKey
ALTER TABLE "usuario_unidades" DROP CONSTRAINT "usuario_unidades_user_id_fkey";

-- DropIndex
DROP INDEX "solicitacao_tipos_slug_key";

-- AlterTable
ALTER TABLE "comunicados" ADD COLUMN     "portal_id" UUID,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "data_publicacao" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "contatos" ADD COLUMN     "portal_id" UUID,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ferramentas" ADD COLUMN     "portal_id" UUID,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "password_reset_tokens" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "profiles" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "refresh_tokens" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "solicitacao_campos" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "solicitacao_tipos" ADD COLUMN     "portal_id" UUID,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "solicitacoes" ADD COLUMN     "acompanhamento_token" TEXT,
ADD COLUMN     "portal_id" UUID,
ADD COLUMN     "prazo" DATE,
ADD COLUMN     "solicitante_id" UUID,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "unidades" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_roles" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "usuario_unidades" ADD COLUMN     "admin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "solicitacao_eventos" (
    "id" UUID NOT NULL,
    "solicitacao_id" UUID NOT NULL,
    "tipo" TEXT NOT NULL,
    "de" TEXT,
    "para" TEXT,
    "autor_id" UUID,
    "autor_nome" TEXT,
    "detalhe" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitacao_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacao_comentarios" (
    "id" UUID NOT NULL,
    "solicitacao_id" UUID NOT NULL,
    "autor_id" UUID,
    "autor_nome" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "interno" BOOLEAN NOT NULL DEFAULT false,
    "anexos_urls" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitacao_comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portais" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "PortalStatus" NOT NULL DEFAULT 'pendente',
    "logo_url" TEXT,
    "cor_primaria" TEXT,
    "cor_secundaria" TEXT,
    "email_contato" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "solicitante_nome" TEXT,
    "solicitante_email" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "portais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_config" (
    "portal_id" UUID NOT NULL,
    "home" JSONB NOT NULL DEFAULT '{}',
    "sobre" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "portal_config_pkey" PRIMARY KEY ("portal_id")
);

-- CreateTable
CREATE TABLE "portal_membros" (
    "id" UUID NOT NULL,
    "portal_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "papel" "PortalPapel" NOT NULL DEFAULT 'usuario',
    "unidade_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_membros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_unidades" (
    "portal_id" UUID NOT NULL,
    "unidade_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_unidades_pkey" PRIMARY KEY ("portal_id","unidade_id")
);

-- CreateTable
CREATE TABLE "notificacao_templates" (
    "id" UUID NOT NULL,
    "portal_id" UUID,
    "evento" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "padrao" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "notificacao_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" UUID NOT NULL,
    "portal_id" UUID,
    "unidade_id" UUID,
    "evento" TEXT NOT NULL,
    "template_id" UUID,
    "destinatarios" JSONB NOT NULL DEFAULT '[]',
    "emails_extras" JSONB NOT NULL DEFAULT '[]',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacao_logs" (
    "id" UUID NOT NULL,
    "portal_id" UUID,
    "evento" TEXT NOT NULL,
    "destinatario" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "status" "NotificacaoStatus" NOT NULL,
    "erro" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacao_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacao_preferencias" (
    "user_id" UUID NOT NULL,
    "evento" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacao_preferencias_pkey" PRIMARY KEY ("user_id","evento")
);

-- CreateIndex
CREATE INDEX "solicitacao_eventos_solicitacao_id_idx" ON "solicitacao_eventos"("solicitacao_id");

-- CreateIndex
CREATE INDEX "solicitacao_comentarios_solicitacao_id_idx" ON "solicitacao_comentarios"("solicitacao_id");

-- CreateIndex
CREATE UNIQUE INDEX "portais_slug_key" ON "portais"("slug");

-- CreateIndex
CREATE INDEX "portal_membros_user_id_idx" ON "portal_membros"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "portal_membros_portal_id_user_id_papel_key" ON "portal_membros"("portal_id", "user_id", "papel");

-- CreateIndex
CREATE INDEX "notificacao_templates_portal_id_evento_idx" ON "notificacao_templates"("portal_id", "evento");

-- CreateIndex
CREATE INDEX "notificacoes_portal_id_evento_idx" ON "notificacoes"("portal_id", "evento");

-- CreateIndex
CREATE INDEX "notificacao_logs_portal_id_created_at_idx" ON "notificacao_logs"("portal_id", "created_at");

-- CreateIndex
CREATE INDEX "comunicados_portal_id_idx" ON "comunicados"("portal_id");

-- CreateIndex
CREATE INDEX "contatos_portal_id_idx" ON "contatos"("portal_id");

-- CreateIndex
CREATE INDEX "ferramentas_portal_id_idx" ON "ferramentas"("portal_id");

-- CreateIndex
CREATE UNIQUE INDEX "solicitacao_tipos_portal_id_slug_key" ON "solicitacao_tipos"("portal_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "solicitacoes_acompanhamento_token_key" ON "solicitacoes"("acompanhamento_token");

-- CreateIndex
CREATE INDEX "solicitacoes_portal_id_status_idx" ON "solicitacoes"("portal_id", "status");

-- CreateIndex
CREATE INDEX "solicitacoes_solicitante_id_idx" ON "solicitacoes"("solicitante_id");


-- Backfill: cria o portal "TE" e vincula todo o conteúdo existente a ele
INSERT INTO "portais" ("id","slug","nome","sigla","descricao","status","cor_primaria","cor_secundaria","ordem","created_at","updated_at")
SELECT gen_random_uuid(), 'te', 'Tecnologia Educacional', 'TE',
       'Portal da equipe de Tecnologia Educacional.', 'ativo', '#F97316', '#FACC15', 0, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "portais" WHERE slug = 'te');

INSERT INTO "portal_config" ("portal_id","home","sobre","created_at","updated_at")
SELECT id, '{}'::jsonb, '{}'::jsonb, now(), now() FROM "portais" WHERE slug = 'te'
ON CONFLICT DO NOTHING;

UPDATE "ferramentas"        SET "portal_id" = (SELECT id FROM "portais" WHERE slug='te') WHERE "portal_id" IS NULL;
UPDATE "comunicados"        SET "portal_id" = (SELECT id FROM "portais" WHERE slug='te') WHERE "portal_id" IS NULL;
UPDATE "contatos"           SET "portal_id" = (SELECT id FROM "portais" WHERE slug='te') WHERE "portal_id" IS NULL;
UPDATE "solicitacao_tipos"  SET "portal_id" = (SELECT id FROM "portais" WHERE slug='te') WHERE "portal_id" IS NULL;
UPDATE "solicitacoes"       SET "portal_id" = (SELECT id FROM "portais" WHERE slug='te') WHERE "portal_id" IS NULL;
UPDATE "solicitacoes"       SET "acompanhamento_token" = gen_random_uuid()::text WHERE "acompanhamento_token" IS NULL;

INSERT INTO "portal_unidades" ("portal_id","unidade_id","created_at")
SELECT (SELECT id FROM "portais" WHERE slug='te'), u.id, now() FROM "unidades" u
ON CONFLICT DO NOTHING;

ALTER TABLE "ferramentas"       ALTER COLUMN "portal_id" SET NOT NULL;
ALTER TABLE "comunicados"       ALTER COLUMN "portal_id" SET NOT NULL;
ALTER TABLE "contatos"          ALTER COLUMN "portal_id" SET NOT NULL;
ALTER TABLE "solicitacao_tipos" ALTER COLUMN "portal_id" SET NOT NULL;
ALTER TABLE "solicitacoes"      ALTER COLUMN "portal_id" SET NOT NULL;
ALTER TABLE "solicitacoes"      ALTER COLUMN "acompanhamento_token" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_unidades" ADD CONSTRAINT "usuario_unidades_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_unidades" ADD CONSTRAINT "usuario_unidades_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_tipos" ADD CONSTRAINT "solicitacao_tipos_portal_id_fkey" FOREIGN KEY ("portal_id") REFERENCES "portais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_campos" ADD CONSTRAINT "solicitacao_campos_tipo_id_fkey" FOREIGN KEY ("tipo_id") REFERENCES "solicitacao_tipos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_tipo_id_fkey" FOREIGN KEY ("tipo_id") REFERENCES "solicitacao_tipos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_portal_id_fkey" FOREIGN KEY ("portal_id") REFERENCES "portais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_eventos" ADD CONSTRAINT "solicitacao_eventos_solicitacao_id_fkey" FOREIGN KEY ("solicitacao_id") REFERENCES "solicitacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_comentarios" ADD CONSTRAINT "solicitacao_comentarios_solicitacao_id_fkey" FOREIGN KEY ("solicitacao_id") REFERENCES "solicitacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ferramentas" ADD CONSTRAINT "ferramentas_portal_id_fkey" FOREIGN KEY ("portal_id") REFERENCES "portais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_portal_id_fkey" FOREIGN KEY ("portal_id") REFERENCES "portais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contatos" ADD CONSTRAINT "contatos_portal_id_fkey" FOREIGN KEY ("portal_id") REFERENCES "portais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_config" ADD CONSTRAINT "portal_config_portal_id_fkey" FOREIGN KEY ("portal_id") REFERENCES "portais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_membros" ADD CONSTRAINT "portal_membros_portal_id_fkey" FOREIGN KEY ("portal_id") REFERENCES "portais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_membros" ADD CONSTRAINT "portal_membros_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_unidades" ADD CONSTRAINT "portal_unidades_portal_id_fkey" FOREIGN KEY ("portal_id") REFERENCES "portais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_unidades" ADD CONSTRAINT "portal_unidades_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacao_templates" ADD CONSTRAINT "notificacao_templates_portal_id_fkey" FOREIGN KEY ("portal_id") REFERENCES "portais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_portal_id_fkey" FOREIGN KEY ("portal_id") REFERENCES "portais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notificacao_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacao_preferencias" ADD CONSTRAINT "notificacao_preferencias_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

