# Prompt — Fix definitivo: RLS na migration original (não mais workaround)

Leia o CLAUDE.md antes de começar. Não faça commit ao final — o desenvolvedor revisa e commita manualmente.

O desenvolvedor confirmou: pode limpar o banco de produção inteiro pra aplicar esse fix (produção ainda não está em uso real). Isso libera editar uma migration já aplicada — normalmente proibido, mas seguro aqui porque o histórico de produção também vai ser resetado (fora do escopo deste prompt, o desenvolvedor cuida disso separadamente).

---

## 1. Editar a migration original `20260729140700_enable_rls`

Abrir o SQL dessa migration e ajustar pra excluir `_prisma_migrations` do que liga RLS (seja um loop dinâmico sobre as tabelas do schema `public`, seja uma lista explícita — adaptar conforme o que estiver lá). O objetivo final: essa migration nunca liga RLS em `_prisma_migrations`, então não existe mais janela de erro.

---

## 2. Remover a migration "fix" que ficou redundante

A migration que desliga RLS especificamente em `_prisma_migrations` (feita depois, como correção) deixa de ser necessária — remover a pasta dela inteira de `apps/api/prisma/migrations/`.

---

## 3. Atualizar CLAUDE.md

Trocar a nota que документа o workaround/exceção por uma nota mais simples: `_prisma_migrations` nunca teve RLS habilitado (motivo: é tabela interna do Prisma, sem dado de negócio, e RLS nela quebra o shadow database do `migrate dev`) — sem mencionar mais "correção depois", já que agora é assim desde o início.

---

## 4. Validar localmente com histórico limpo

```bash
docker compose down -v
docker compose up -d
npm run db:migrate
```

Esse é o teste real: `db:migrate` (que roda `prisma migrate dev`, com shadow database) precisa funcionar direto, sem erro P3006/P1014, já que a migration original nunca vai tentar ligar RLS na tabela errada.

```bash
npm run db:generate
ADMIN_EMAIL=director@example.com ADMIN_PASSWORD=Director@123 ADMIN_NAME=Director npm run db:seed
npm run -w apps/api test:e2e
npm run lint:api
```

---

## 5. Verify

Confirmar explicitamente no resumo final: `npm run db:migrate` (não `db:deploy`) rodou sem erro contra um banco vazio, do início ao fim, sem precisar de nenhum workaround manual (`--create-only` / `db execute` / `migrate resolve`).

Parar todos os processos de desenvolvimento ao final.