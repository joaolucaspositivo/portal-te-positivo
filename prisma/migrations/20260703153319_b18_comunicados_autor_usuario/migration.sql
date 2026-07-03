-- AlterTable
ALTER TABLE "comunicados" ADD COLUMN     "autor_id" UUID;

-- AddForeignKey
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
