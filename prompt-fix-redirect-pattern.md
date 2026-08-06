# Prompt — Ajuste: padrão de redirect (criar → edição, editar → listagem)

Leia o CLAUDE.md antes de começar. Não faça commit ao final — o desenvolvedor revisa e commita manualmente.

O padrão de redirect pedido no prompt anterior estava incompleto. O correto, pros três módulos com listagem (Student, Employee, SchoolClass):

- **Salvar no formulário de criação** → redireciona pra tela de **edição** do registro recém-criado (ex.: `/students/[id]/edit`), não pra listagem.
- **Salvar no formulário de edição** → redireciona pra tela de **listagem** (ex.: `/students`).

Settings não muda — continua sem redirect, é tela única.

Ajustar os três módulos (`students`, `employees`, `school-classes`) pra seguir exatamente esse padrão, revisando o que foi feito no prompt anterior (que tinha deixado os dois casos indo pra listagem).

---

## Verify

```bash
npm run -w apps/web build
npm run lint:web
```

Verificar manualmente nos três módulos: criar um registro novo → cai na tela de edição dele (com os dados recém-salvos carregados); editar um registro existente → cai na listagem. Testar nos dois temas e nos dois idiomas.

Parar todos os processos de desenvolvimento ao final.