-- Rename Portuguese domain models/columns to English. Hand-written (not generated
-- via `prisma migrate dev`) to guarantee RENAME semantics and preserve existing data
-- rather than DROP+CREATE, which `prisma migrate diff` would otherwise emit.

-- Rename tables
ALTER TABLE "Aluno" RENAME TO "Student";
ALTER TABLE "Responsavel" RENAME TO "Guardian";
ALTER TABLE "AutorizadoBusca" RENAME TO "AuthorizedPickup";
ALTER TABLE "Funcionario" RENAME TO "Employee";

-- Rename columns
ALTER TABLE "Student" RENAME COLUMN "nome" TO "name";
ALTER TABLE "Student" RENAME COLUMN "dataNascimento" TO "birthDate";
ALTER TABLE "Student" RENAME COLUMN "fotoUrl" TO "photoUrl";
ALTER TABLE "Student" RENAME COLUMN "responsavelId" TO "guardianId";

ALTER TABLE "Guardian" RENAME COLUMN "nome" TO "name";
ALTER TABLE "Guardian" RENAME COLUMN "telefone" TO "phone";

ALTER TABLE "AuthorizedPickup" RENAME COLUMN "nome" TO "name";
ALTER TABLE "AuthorizedPickup" RENAME COLUMN "parentesco" TO "relationship";
ALTER TABLE "AuthorizedPickup" RENAME COLUMN "telefone" TO "phone";
ALTER TABLE "AuthorizedPickup" RENAME COLUMN "alunoId" TO "studentId";

ALTER TABLE "Employee" RENAME COLUMN "nome" TO "name";
ALTER TABLE "Employee" RENAME COLUMN "cargo" TO "position";
ALTER TABLE "Employee" RENAME COLUMN "telefone" TO "phone";

-- Rename constraints/indexes to match Prisma's naming convention for the renamed
-- tables/columns (Postgres does not auto-rename these on ALTER TABLE ... RENAME TO).
ALTER TABLE "Student" RENAME CONSTRAINT "Aluno_pkey" TO "Student_pkey";
ALTER TABLE "Guardian" RENAME CONSTRAINT "Responsavel_pkey" TO "Guardian_pkey";
ALTER TABLE "AuthorizedPickup" RENAME CONSTRAINT "AutorizadoBusca_pkey" TO "AuthorizedPickup_pkey";
ALTER TABLE "Employee" RENAME CONSTRAINT "Funcionario_pkey" TO "Employee_pkey";

ALTER TABLE "Student" RENAME CONSTRAINT "Aluno_responsavelId_fkey" TO "Student_guardianId_fkey";
ALTER TABLE "AuthorizedPickup" RENAME CONSTRAINT "AutorizadoBusca_alunoId_fkey" TO "AuthorizedPickup_studentId_fkey";

ALTER INDEX "Responsavel_cpf_key" RENAME TO "Guardian_cpf_key";
ALTER INDEX "Funcionario_cpf_key" RENAME TO "Employee_cpf_key";
