-- AlterTable
ALTER TABLE "solicitacao_tipos" ADD COLUMN     "permite_anonimo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "solicitacoes" ADD COLUMN     "responsavel_id" UUID,
ADD COLUMN     "solicitante_id" UUID;

-- CreateIndex
CREATE INDEX "solicitacoes_solicitante_id_idx" ON "solicitacoes"("solicitante_id");

-- CreateIndex
CREATE INDEX "solicitacoes_responsavel_id_idx" ON "solicitacoes"("responsavel_id");

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
