-- CreateTable
CREATE TABLE "solicitacao_historicos" (
    "id" UUID NOT NULL,
    "solicitacao_id" UUID NOT NULL,
    "autor_id" UUID,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "valor_anterior" TEXT,
    "valor_novo" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitacao_historicos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "solicitacao_historicos_solicitacao_id_created_at_idx" ON "solicitacao_historicos"("solicitacao_id", "created_at");

-- CreateIndex
CREATE INDEX "solicitacao_historicos_autor_id_idx" ON "solicitacao_historicos"("autor_id");

-- AddForeignKey
ALTER TABLE "solicitacao_historicos" ADD CONSTRAINT "solicitacao_historicos_solicitacao_id_fkey" FOREIGN KEY ("solicitacao_id") REFERENCES "solicitacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao_historicos" ADD CONSTRAINT "solicitacao_historicos_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
