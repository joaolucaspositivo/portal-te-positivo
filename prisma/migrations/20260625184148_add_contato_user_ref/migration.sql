-- AlterTable
ALTER TABLE "contatos" ADD COLUMN     "user_id" UUID;

-- CreateIndex
CREATE INDEX "contatos_ativo_idx" ON "contatos"("ativo");

-- CreateIndex
CREATE INDEX "contatos_user_id_idx" ON "contatos"("user_id");

-- AddForeignKey
ALTER TABLE "contatos" ADD CONSTRAINT "contatos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
