-- CreateEnum
CREATE TYPE "StatusAluno" AS ENUM ('ATIVO', 'INATIVO');

-- CreateTable
CREATE TABLE "Responsavel" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Responsavel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aluno" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dataNascimento" TIMESTAMP(3) NOT NULL,
    "fotoUrl" TEXT,
    "status" "StatusAluno" NOT NULL DEFAULT 'ATIVO',
    "responsavelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutorizadoBusca" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "parentesco" TEXT NOT NULL,
    "telefone" TEXT,
    "alunoId" TEXT NOT NULL,

    CONSTRAINT "AutorizadoBusca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Responsavel_cpf_key" ON "Responsavel"("cpf");

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutorizadoBusca" ADD CONSTRAINT "AutorizadoBusca_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;
