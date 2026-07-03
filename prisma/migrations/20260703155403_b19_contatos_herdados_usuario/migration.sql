/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `contatos` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "exibir_contato" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "contatos_user_id_key" ON "contatos"("user_id");
