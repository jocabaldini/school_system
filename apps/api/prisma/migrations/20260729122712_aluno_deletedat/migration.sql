-- Add the new nullable column first (no data loss)
ALTER TABLE "Aluno" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Backfill from the existing status before dropping it
UPDATE "Aluno" SET "deletedAt" = now() WHERE "status" = 'INATIVO';

-- Now safe to drop the old column and its enum type
ALTER TABLE "Aluno" DROP COLUMN "status";

DROP TYPE "StatusAluno";
