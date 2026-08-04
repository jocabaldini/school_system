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

## Naming conventions

All code must be written in English: Prisma model/table/column names, TypeScript classes, variables, function names, API routes, folders and files. Only the i18n translation strings themselves (the actual en/pt text shown to users) stay bilingual — never the code identifiers around them.

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
- **RLS on `_prisma_migrations`**: this internal Prisma table (no business data) intentionally has RLS **disabled** (`20260803183058_disable_rls_prisma_migrations`) — do not "fix" this again by re-enabling it. It was briefly enabled in `20260729140700_enable_rls` alongside the real business tables, which broke `prisma migrate dev`'s local shadow-database check (`migrate deploy`, used by CI/e2e, is unaffected). Caveat: disabling it again in a later migration does **not** fully restore `migrate dev`/`--create-only` locally — Prisma always rebuilds the shadow db by replaying the *entire* migration history from scratch, so it still re-hits the original `ENABLE ROW LEVEL SECURITY` statement and fails (P3006/P1014) before ever reaching this fix. The only real fix would be editing the checksum of the original `enable_rls` migration, which risks breaking `migrate deploy` if that migration is already applied against production — not done here without confirming deploy state first. Until then, create new migrations by hand (raw SQL) and apply with `prisma db execute` + `prisma migrate resolve --applied` rather than `prisma migrate dev`.

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
  students/               — Student CRUD + nested authorized-pickups sub-resource
  guardians/              — Guardian read/update (created inline via students)
  employees/              — Employee CRUD
  school-classes/         — SchoolClass CRUD
  settings/               — Settings singleton row (GET/PATCH only)
  enrollments/            — /enrollments/calculate + nested under students

apps/web/
  app/(auth)/login/
    page.tsx
    view/LoginClient.tsx
  app/(protected)/
    _components/Sidebar.tsx
    dashboard/
      page.tsx
      actions.ts
      view/DashboardClient.tsx
    students/
      page.tsx, types.ts, actions.ts, new/page.tsx, [id]/edit/page.tsx
      view/StudentsListClient.tsx, view/StudentFormClient.tsx, view/EnrollmentTab.tsx
    employees/
      page.tsx, types.ts, actions.ts, new/page.tsx, [id]/edit/page.tsx
      view/EmployeesListClient.tsx, view/EmployeeFormClient.tsx
    school-classes/
      page.tsx, types.ts, actions.ts, new/page.tsx, [id]/edit/page.tsx
      view/SchoolClassesListClient.tsx, view/SchoolClassFormClient.tsx
    settings/
      page.tsx, types.ts, actions.ts, view/SettingsFormClient.tsx
  app/_components/Toast.tsx, StatusBadge.tsx
  app/api/[...path]/      — API proxy route
  app/layout.tsx
  app/page.tsx            — redirects to /dashboard
  lib/api/                — routes.ts (NEST_ROUTES), config.ts, errors.ts, client.ts
  lib/auth/               — session, login/logout actions
  lib/i18n/                — Dictionary type + pt-BR/en-US locales
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

model Guardian {
  id        String    @id @default(cuid())
  name      String
  cpf       String    @unique
  phone     String?
  email     String?
  students  Student[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Student {
  id                String             @id @default(cuid())
  name              String
  birthDate         DateTime
  photoUrl          String?
  deletedAt         DateTime?
  guardianId        String
  guardian          Guardian           @relation(fields: [guardianId], references: [id])
  authorizedPickups AuthorizedPickup[]
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
}

model AuthorizedPickup {
  id           String  @id @default(cuid())
  name         String
  relationship String
  phone        String?
  studentId    String
  student      Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
}

model Employee {
  id                       String        @id @default(cuid())
  name                     String
  position                 String
  cpf                      String?       @unique
  phone                    String?
  email                    String?
  deletedAt                DateTime?
  schoolClassesAsTeacher   SchoolClass[] @relation("MainTeacher")
  schoolClassesAsAssistant SchoolClass[] @relation("AssistantTeacher")
  createdAt                DateTime      @default(now())
  updatedAt                DateTime      @updatedAt
}

model SchoolClass {
  id          String       @id @default(cuid())
  name        String
  schoolYear  Int
  maxCapacity Int
  teacherId   String
  teacher     Employee     @relation("MainTeacher", fields: [teacherId], references: [id])
  assistantId String?
  assistant   Employee?    @relation("AssistantTeacher", fields: [assistantId], references: [id])
  enrollments Enrollment[]
  deletedAt   DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@unique([name, schoolYear])
}

model Enrollment {
  id                 String      @id @default(cuid())
  studentId          String
  student            Student     @relation(fields: [studentId], references: [id])
  schoolClassId      String
  schoolClass        SchoolClass @relation(fields: [schoolClassId], references: [id])
  startTime          DateTime    @db.Time
  endTime            DateTime    @db.Time
  breakStart         DateTime?   @db.Time
  breakEnd           DateTime?   @db.Time
  discountPercentage Decimal     @default(0)
  tuitionAmount      Decimal
  startDate          DateTime
  endDate            DateTime?
  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt
}

model Settings {
  id                    String   @id @default(cuid())
  pricePerHour          Decimal
  defaultSchoolDays     Int      @default(20)
  latePenaltyPercentage Decimal  @default(10)
  updatedAt             DateTime @updatedAt
}
```

`Student` also has `enrollments Enrollment[]`.

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

POST   /students                                    — ADMIN only
GET    /students                                     — ADMIN only
GET    /students/:id                                  — ADMIN only
PATCH  /students/:id                                  — ADMIN only
DELETE /students/:id                                  — ADMIN only (soft delete)
PATCH  /students/:id/reactivate                       — ADMIN only
POST   /students/:studentId/authorized-pickups         — ADMIN only
GET    /students/:studentId/authorized-pickups         — ADMIN only
PATCH  /students/:studentId/authorized-pickups/:pickupId  — ADMIN only
DELETE /students/:studentId/authorized-pickups/:pickupId  — ADMIN only

GET    /guardians        — ADMIN only
GET    /guardians/:id    — ADMIN only
PATCH  /guardians/:id    — ADMIN only

POST   /employees               — ADMIN only
GET    /employees               — ADMIN only
GET    /employees/:id           — ADMIN only
PATCH  /employees/:id           — ADMIN only
DELETE /employees/:id           — ADMIN only (soft delete)
PATCH  /employees/:id/reactivate — ADMIN only

POST   /school-classes                    — ADMIN only
GET    /school-classes                    — ADMIN only
GET    /school-classes/:id                — ADMIN only
PATCH  /school-classes/:id                — ADMIN only
DELETE /school-classes/:id                — ADMIN only (soft delete)
PATCH  /school-classes/:id/reactivate     — ADMIN only

GET    /settings          — ADMIN only
PATCH  /settings          — ADMIN only

POST   /enrollments/calculate                              — ADMIN only (stateless, no persistence)
POST   /students/:studentId/enrollments                    — ADMIN only
GET    /students/:studentId/enrollments                    — ADMIN only
PATCH  /students/:studentId/enrollments/:enrollmentId      — ADMIN only
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