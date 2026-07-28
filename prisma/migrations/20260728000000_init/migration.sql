-- Initial schema for Portal TE (Postgres puro, sem Supabase).
-- Gerado a partir de prisma/schema.prisma.

-- =====================================================================
-- ENUMs
-- =====================================================================
CREATE TYPE "AppRole"       AS ENUM ('admin', 'equipe_te', 'editor', 'usuario');
CREATE TYPE "ProfileStatus" AS ENUM ('pendente', 'ativo', 'bloqueado');
CREATE TYPE "UnidadeStatus" AS ENUM ('ativa', 'inativa');

-- =====================================================================
-- Users / Auth
-- =====================================================================
CREATE TABLE "users" (
    "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email"             TEXT NOT NULL UNIQUE,
    "password_hash"     TEXT,
    "google_id"         TEXT UNIQUE,
    "email_verified_at" TIMESTAMPTZ,
    "created_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "refresh_tokens" (
    "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"    UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token_hash" TEXT NOT NULL UNIQUE,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

CREATE TABLE "password_reset_tokens" (
    "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"    UUID NOT NULL,
    "token_hash" TEXT NOT NULL UNIQUE,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at"    TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

CREATE TABLE "user_roles" (
    "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"    UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "role"       "AppRole" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE ("user_id", "role")
);

-- =====================================================================
-- Profiles
-- =====================================================================
CREATE TABLE "profiles" (
    "id"            UUID PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
    "nome_completo" TEXT,
    "cargo"         TEXT,
    "unidade"       TEXT,
    "telefone"      TEXT,
    "avatar_url"    TEXT,
    "bio"           TEXT,
    "status"        "ProfileStatus" NOT NULL DEFAULT 'pendente',
    "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- Unidades
-- =====================================================================
CREATE TABLE "unidades" (
    "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "nome"              TEXT NOT NULL,
    "sigla"             TEXT NOT NULL UNIQUE,
    "status"            "UnidadeStatus" NOT NULL DEFAULT 'ativa',
    "cep"               TEXT,
    "logradouro"        TEXT,
    "numero"            TEXT,
    "complemento"       TEXT,
    "bairro"            TEXT,
    "cidade"            TEXT,
    "estado"            VARCHAR(2),
    "telefone"          TEXT,
    "email"             TEXT,
    "responsavel_nome"  TEXT,
    "responsavel_cargo" TEXT,
    "created_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "usuario_unidades" (
    "user_id"    UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "unidade_id" UUID NOT NULL REFERENCES "unidades"("id") ON DELETE CASCADE,
    "principal"  BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY ("user_id", "unidade_id")
);

-- =====================================================================
-- Solicitações
-- =====================================================================
CREATE TABLE "solicitacao_tipos" (
    "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug"       TEXT NOT NULL UNIQUE,
    "nome"       TEXT NOT NULL,
    "descricao"  TEXT,
    "icone"      TEXT,
    "cor"        TEXT,
    "ativo"      BOOLEAN NOT NULL DEFAULT true,
    "ordem"      INT NOT NULL DEFAULT 0,
    "prazo_dias" INT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "solicitacao_campos" (
    "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tipo_id"     UUID NOT NULL REFERENCES "solicitacao_tipos"("id") ON DELETE CASCADE,
    "chave"       TEXT NOT NULL,
    "rotulo"      TEXT NOT NULL,
    "tipo_campo"  TEXT NOT NULL,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "opcoes"      JSONB,
    "placeholder" TEXT,
    "ajuda"       TEXT,
    "ordem"       INT NOT NULL DEFAULT 0,
    "ativo"       BOOLEAN NOT NULL DEFAULT true,
    "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE ("tipo_id", "chave")
);

CREATE TABLE "solicitacoes" (
    "id"                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tipo_id"                UUID REFERENCES "solicitacao_tipos"("id"),
    "unidade_id"             UUID REFERENCES "unidades"("id"),
    "nome_solicitante"       TEXT NOT NULL,
    "email_solicitante"      TEXT NOT NULL,
    "unidade"                TEXT NOT NULL,
    "segmento_area"          TEXT,
    "cargo_funcao"           TEXT,
    "tipo_solicitacao"       TEXT NOT NULL,
    "titulo"                 TEXT NOT NULL,
    "descricao"              TEXT NOT NULL,
    "publico_impactado"      TEXT,
    "unidades_impactadas"    TEXT,
    "prazo_desejado"         DATE,
    "urgencia"               TEXT NOT NULL DEFAULT 'Média',
    "link_referencia"        TEXT,
    "observacoes_adicionais" TEXT,
    "dados_extras"           JSONB,
    "anexos_urls"            JSONB,
    "status"                 TEXT NOT NULL DEFAULT 'Recebida',
    "responsavel_te"         TEXT,
    "observacoes_internas"   TEXT,
    "created_at"             TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "solicitacoes_status_idx"     ON "solicitacoes"("status");
CREATE INDEX "solicitacoes_tipo_id_idx"    ON "solicitacoes"("tipo_id");
CREATE INDEX "solicitacoes_unidade_id_idx" ON "solicitacoes"("unidade_id");

-- =====================================================================
-- Conteúdo público
-- =====================================================================
CREATE TABLE "ferramentas" (
    "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "nome"         TEXT NOT NULL,
    "descricao"    TEXT,
    "categoria"    TEXT,
    "publico_alvo" TEXT,
    "segmento"     TEXT,
    "link_acesso"  TEXT,
    "responsavel"  TEXT,
    "imagem_url"   TEXT,
    "status"       TEXT NOT NULL DEFAULT 'Ativa',
    "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "comunicados" (
    "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "titulo"          TEXT NOT NULL,
    "resumo"          TEXT,
    "conteudo"        TEXT NOT NULL,
    "categoria"       TEXT,
    "autor"           TEXT,
    "imagem_url"      TEXT,
    "data_publicacao" DATE NOT NULL DEFAULT CURRENT_DATE,
    "destaque"        BOOLEAN NOT NULL DEFAULT false,
    "publicado"       BOOLEAN NOT NULL DEFAULT true,
    "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "comunicados_publicado_idx" ON "comunicados"("publicado");

CREATE TABLE "contatos" (
    "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "nome"              TEXT NOT NULL,
    "funcao"            TEXT,
    "unidade"           TEXT,
    "email"             TEXT,
    "telefone_whatsapp" TEXT,
    "tipo_contato"      TEXT,
    "ativo"             BOOLEAN NOT NULL DEFAULT true,
    "created_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT now()
);