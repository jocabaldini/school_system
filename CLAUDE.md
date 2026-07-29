# CLAUDE.md — school_system

This file gives Claude Code the context needed to work on this project.

## What this project is

Management system for an infant school (escola infantil).
Built on top of `nest_next_template` boilerplate.

- **API**: https://school-system-api.fly.dev
- **Web**: https://project-bc2go.vercel.app
- **GitHub**: jocabaldini/school_system

## How to work with the developer

- **Always discuss and present a plan before writing any code.**
- The developer reviews each backlog item before implementation begins.
- One item at a time — do not move to the next item without explicit confirmation.
- After each item: commit, push, deploy to production, then wait for review before starting the next.
- All code comments and commit messages must be in **English**.
- Whenever the app is run for testing or verification (dev servers, Playwright, or any background process), kill every process that was started before finishing the task. Never leave servers running in the background for the developer to discover and kill later.
- Conventional Commits enforced via Husky: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`, `ci`, `perf`.

## Tech stack

| Layer | Technology |
|---|---|
| API | NestJS 11, TypeScript, Prisma ORM |
| Web | Next.js 16, React 19, Tailwind CSS 4 |
| Database | PostgreSQL / Supabase (São Paulo region) |
| Cache | Redis / Upstash (shared with laundromat_system) |
| Deploy | Fly.io (API) + Vercel (Web) |
| CI/CD | GitHub Actions |

## Roles

| Role | Description |
|---|---|
| `ADMIN` | Full access — school director, manages everything |
| `USER` | Reserved for future use |

> The role is named `ADMIN` (not `DIRECTOR`) — renaming was evaluated and discarded due to
> migration complexity with Supabase pgbouncer. `ADMIN` is understood as "the director who
> administers the system".

## Architecture decisions (do not change without discussion)

- **Refresh token hashing**: SHA-256 via `crypto.createHash` — NOT bcrypt
- **Token uniqueness**: `jti: randomUUID()` on every generated JWT
- **Request context**: `AsyncLocalStorage` propagates `requestId`
- **Logger**: transport pattern — only 5xx errors logged by `HttpExceptionFilter`
- **RBAC**: roles embedded in JWT payload
- **fly.toml** is at the **monorepo root** (not in `apps/api/`)
- **Dockerfile CMD**: `node dist/main`
- **CI deploy**: `flyctl deploy --local-only`
- **Supabase**: `DATABASE_URL` port 6543 with `?pgbouncer=true`; `DIRECT_URL` port 5432
- **DB migrations**: use DROP DEFAULT → TYPE text → DROP TYPE → CREATE TYPE → USING cast → SET DEFAULT (NOT `ALTER TYPE RENAME VALUE` — fails with Supabase pgbouncer)

## Project structure

```
apps/api/src/
  auth/                   — JWT auth, guards, decorators
  common/filters/         — HttpExceptionFilter
  common/logger/          — LoggerService, transport pattern
  common/request-context/ — AsyncLocalStorage request ID
  config/                 — Joi env validation
  i18n/                   — translation files (en/, pt/)
  prisma/                 — PrismaService
  users/                  — Users CRUD with RBAC

apps/web/
  app/(auth)/login/
    page.tsx
    view/LoginClient.tsx
  app/(protected)/
    _components/Navbar.tsx
    dashboard/
      page.tsx
      actions.ts
      view/DashboardClient.tsx
  app/_components/Toast.tsx
  app/api/[...path]/      — API proxy route
  app/layout.tsx
  app/page.tsx            — redirects to /dashboard
  lib/auth/               — session, login/logout actions
  proxy.ts                — route protection + token refresh
```

## Prisma schema (current)

```prisma
enum Role {
  ADMIN
  USER
}

model User {
  id               String    @id @default(cuid())
  email            String    @unique
  name             String?
  passwordHash     String
  refreshTokenHash String?
  role             Role      @default(USER)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}
```

## API endpoints (current)

```
POST   /auth/login       — public
POST   /auth/refresh     — public
POST   /auth/logout      — Bearer
GET    /auth/me          — Bearer
POST   /users            — ADMIN only
GET    /users            — ADMIN only
GET    /users/:id        — ADMIN or own
PATCH  /users/:id        — ADMIN or own
DELETE /users/:id        — ADMIN only
GET    /health           — public
```

## Running locally

```bash
docker compose up -d
npm install
npm run db:migrate
ADMIN_EMAIL=director@example.com ADMIN_PASSWORD=Director@123 ADMIN_NAME=Director npm run db:seed
npm run dev
```

## E2E tests

```bash
docker compose up -d
npm run -w apps/api test:e2e
# Expected: 37/37 passing
```

## Deploy

Push to `main` triggers GitHub Actions:
1. Lint + E2E tests
2. `flyctl deploy --local-only`
3. Vercel deploys automatically

---

## Backlog — Phase 1

### 🔲 Item 1 — Infrastructure and Boilerplate Adaptation ← NEXT

- [ ] Fix `apps/api/tsconfig.json`: add `"prisma/**/*.ts"` to `include`
- [ ] Fix `apps/api/eslint.config.mjs`: add override for `prisma/**/*.ts`:
  ```js
  {
    files: ['prisma/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
  ```
- [ ] Fix `apps/api/prisma/seed.ts` — hardcoded credentials and `update: {}` that does not update password:
  ```ts
  import { PrismaClient, Role } from '@prisma/client';
  import * as bcrypt from 'bcrypt';
  const prisma = new PrismaClient();
  async function main() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME ?? 'Admin';
    if (!email || !password) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
      where: { email },
      update: { passwordHash, name },
      create: { email, name, passwordHash, role: Role.ADMIN },
    });
    console.log(`✅ Seed complete — ${email} upserted`);
  }
  main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
  ```
- [ ] Update README focused on school domain
- [ ] Commit: `fix(api): fix eslint, tsconfig and seed script` + `docs: update README for school system`

### 🔲 Item 2 — Visual Identity
Sub-items to be defined with the developer before starting (logo pending).

### 🔲 Item 3 — Responsible Party Module (Responsável)
- Model: name, CPF, phone, email
- One responsible linked to multiple students
- CPF validation (format + check digit)
- CRUD + ADMIN guard + E2E tests

### 🔲 Item 4 — Student Module (Aluno)
- Model: name, birthDate, photoUrl?, status (active/inactive), responsibleId
- Model AuthorizedPickup: name, relationship, phone, studentId (1:N)
- CRUD + authorized pickup management
- E2E tests

### 🔲 Item 5 — Class and Schedule Module (Turma)
- Model Class: name, maxCapacity
- Model Enrollment: studentId, classId, entryTime, exitTime, discountPercentage
- Daily hours calculation (exitTime - entryTime)
- Capacity validation on enrollment
- E2E tests

### 🔲 Item 6 — Tuition Module (Mensalidade)
- Model Tuition: studentId, referenceMonth, amount, status (PENDING/PAID/OVERDUE), paidAt?
- Auto-generation: hours × pricePerHour × (1 - discount%)
- Payment registration endpoint
- Status update to OVERDUE for past-due tuitions
- E2E tests

### 🔲 Item 7 — Open Questions (resolve before Items 5/6)
- Where is `pricePerHour` configured? Global setting, per class, or per student?
- How are "school days" in a month defined? Fixed number (e.g. 20) or configurable calendar?
- Is tuition generation manual (ADMIN triggers it) or automatic (cron job)?

### 🔲 Item 8 — Update README with full project documentation

---

## Phase 2 (future)

- Teacher CRUD and link to classes
- Dashboard (delinquency rate, occupancy, monthly revenue)
- Overdue tuition notifications
- Exportable reports (PDF/Excel)
- Teacher portal (view students + add per-student notes for annual report)
- Parent portal (child info, payment history)
- Attendance tracking