# Prompt — Item 7 (parte 1): Dashboard inicial

Leia o CLAUDE.md antes de começar. Não faça commit ao final — o desenvolvedor revisa e commita manualmente.

Siga os mesmos padrões já usados nos módulos existentes (estrutura, DTOs, guards ADMIN only, tokens do design system, nomenclatura de código em inglês).

---

## 1. Backend — endpoint de resumo

```
GET /dashboard/summary
```

ADMIN only. Retorna:

```ts
{
  activeStudentsCount: number;       // Student com deletedAt: null
  activeEmployeesCount: number;      // Employee com deletedAt: null
  currentSchoolYear: number;         // maior schoolYear entre SchoolClass ativas
  currentYearClassesCount: number;   // SchoolClass ativas do currentSchoolYear
  activeEnrollmentsCount: number;    // Enrollment com endDate: null
  classOccupancy: Array<{
    id: string;
    name: string;
    currentCount: number;            // enrollments ativas nessa turma
    maxCapacity: number;
  }>; // só turmas do currentSchoolYear, ativas
  recentEnrollments: Array<{
    studentName: string;
    className: string;
    startDate: string;
  }>; // as 5 mais recentes por startDate, mais novas primeiro
}
```

Um único endpoint, sem paginação — é pra carregar tudo de uma vez na tela inicial.

---

## 2. Frontend — `apps/web/app/(protected)/dashboard/`

Substituir o placeholder "Template NestJS e Next.js" do `DashboardClient.tsx` por:

- Grid de 4 metric cards: Active Students, Active Employees, Classes ({currentSchoolYear}), Active Enrollments — mesmo estilo já usado em outros cards do sistema (`bg-surface-card`, `border-line`, label 12px cinza, valor 23px).
- Card "Class occupancy — {currentSchoolYear}": uma barra de progresso por turma (`currentCount / maxCapacity`), com a cor da barra mudando conforme a proximidade da capacidade — usar os tokens semânticos já existentes (ex.: `bg-btn-primary-bg` até uns 80% de ocupação, `bg-badge-warning-bg`/cor de warning acima disso; não hardcodear cor nova).
- Card "Recent enrollments": tabela simples com Student, Class, Start date.

Buscar os dados via server action chamando `GET /dashboard/summary`, seguindo o mesmo padrão de `actions.ts` já usado nos outros módulos.

---

## 3. i18n

Adicionar as chaves necessárias em `en-US.ts`/`pt-BR.ts` (labels dos cards, cabeçalhos de tabela).

---

## 4. Verify

```bash
npm run -w apps/api test:e2e
npm run lint:api
npm run -w apps/web build
npm run lint:web
```

Verificar manualmente contra os dados reais do seed: os números dos cards batem com o que existe no banco, a ocupação de cada turma aparece correta, a lista de matrículas recentes reflete os enrollments mais novos. Testar nos dois temas.

Parar todos os processos de desenvolvimento ao final.

Fix any errors before finishing.