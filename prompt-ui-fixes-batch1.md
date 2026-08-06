# Prompt — Ajustes de tela: geral, Students, School Classes

Leia o CLAUDE.md antes de começar. Não faça commit ao final — o desenvolvedor revisa e commita manualmente.

---

## 1. Geral

**Título da página**: ainda mostra o placeholder padrão do Next.js ("Create Next App"). Trocar pra "Recanto da Criança" — mesmo texto nos dois idiomas (é nome próprio, não traduz), mas configurar via metadata do Next.js de forma que sirva pras duas locales.

**Paginação padrão**: todas as listagens (Students, Employees, School Classes) usam 50 como quantidade padrão por página — mudar o default pra 10 em todas (o seletor de itens por página continua existindo, só o valor inicial muda).

**Redirecionar após salvar**: hoje, ao salvar um formulário (Student, Employee, School Class), o comportamento após sucesso precisa ser: redirecionar pra tela de listagem correspondente (`/students`, `/employees`, `/school-classes`). Conferir o comportamento atual de cada um dos três formulários e corrigir onde não estiver fazendo isso — não mexer no formulário de Settings (é tela única, sem listagem pra voltar).

---

## 2. Students — lista

- **Responsável não aparece**: a coluna existe mas está sempre vazia ("—"). Investigar a causa raiz antes de corrigir — checar se `GET /students` está incluindo a relação com `Guardian` na query do backend, ou se é só o front não mapeando o campo certo da resposta.
- **Adicionar coluna Turma**: mostrar o nome da `SchoolClass` da matrícula ativa do aluno (se houver — alunos sem matrícula ativa mostram "—", mesmo padrão da coluna Responsável). Se o backend de `GET /students` não retornar isso hoje, incluir.

---

## 3. School Classes — edição

Adicionar uma aba "Students" na tela de edição de turma (`[id]/edit`), com a listagem (somente leitura) dos alunos com matrícula ativa naquela turma — nome do aluno, e talvez horário/data de início se couber sem poluir. Mesmo padrão visual das outras abas somente-leitura já existentes (ex.: histórico de enrollments dentro do Student).

---

## 4. Verify

```bash
npm run -w apps/api test:e2e
npm run lint:api
npm run -w apps/web build
npm run lint:web
```

Verificar manualmente: título da aba do navegador; listagens abrindo com 10 itens por página; salvar um Student/Employee/School Class e confirmar o redirect pra listagem; coluna Responsável preenchida na lista de Students; coluna Turma preenchida; aba Students dentro da edição de School Class mostrando os alunos certos. Testar nos dois temas e nos dois idiomas.

Parar todos os processos de desenvolvimento ao final.

Fix any errors before finishing.