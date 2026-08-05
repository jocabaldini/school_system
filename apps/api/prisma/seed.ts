import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedAdmin() {
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

  console.log(`✅ Admin seeded — ${email} upserted`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo/validation dataset — realistic but fake data covering every domain
// scenario, for manual QA and demoing the system. Not real student data.
//
// Idempotency: Student/AuthorizedPickup/Enrollment have no unique key to
// upsert on, so each student's entire block (guardian link + pickups +
// enrollments) is generated only when a Student with that name doesn't
// already exist — re-running the seed finds every name already present and
// skips everything nested under it. Names/CPFs/dates are derived from fixed
// indices, never Math.random()/Date.now(), so the generated plan itself is
// stable across runs (not required for correctness given the name-gated
// skip, but avoids any chance of accidental non-determinism).
// ─────────────────────────────────────────────────────────────────────────────

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function calculateCpfCheckDigit(base: string): number {
  let sum = 0;
  let weight = base.length + 1;
  for (const char of base) {
    sum += Number(char) * weight;
    weight -= 1;
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

/** Deterministic, valid CPF from an index — same index always yields the same CPF. */
function deterministicCPF(index: number): string {
  const base = String(100000000 + index)
    .padStart(9, '0')
    .slice(-9);
  const firstCheckDigit = calculateCpfCheckDigit(base);
  const firstTenDigits = base + String(firstCheckDigit);
  const secondCheckDigit = calculateCpfCheckDigit(firstTenDigits);
  return firstTenDigits + String(secondCheckDigit);
}

function timeStringToDate(value: string): Date {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

/** Mirrors EnrollmentsService.calculateDailyHours (apps/api/src/enrollments/enrollments.service.ts). */
function calculateDailyHours(
  startTime: string,
  endTime: string,
  breakStart?: string,
  breakEnd?: string,
): number {
  const start = timeStringToDate(startTime);
  const end = timeStringToDate(endTime);
  let minutes = (end.getTime() - start.getTime()) / 60000;

  if (breakStart && breakEnd) {
    const bStart = timeStringToDate(breakStart);
    const bEnd = timeStringToDate(breakEnd);
    minutes -= (bEnd.getTime() - bStart.getTime()) / 60000;
  }

  return minutes / 60;
}

/** Mirrors EnrollmentsService.calculate's suggestedAmount formula. */
function calculateTuition(
  dailyHours: number,
  pricePerHour: number,
  defaultSchoolDays: number,
  discountPercentage: number,
): number {
  return dailyHours * pricePerHour * defaultSchoolDays * (1 - discountPercentage / 100);
}

const CHILD_FIRST_NAMES = [
  'Sophia',
  'Miguel',
  'Alice',
  'Arthur',
  'Laura',
  'Heitor',
  'Manuela',
  'Davi',
  'Helena',
  'Bernardo',
  'Valentina',
  'Théo',
  'Isabella',
  'Gabriel',
  'Luiza',
  'Pedro',
  'Maria',
  'Lorenzo',
  'Cecília',
  'Enzo',
  'Julia',
  'Nicolas',
  'Lívia',
  'Rafael',
  'Beatriz',
  'Matheus',
  'Antonella',
  'Gustavo',
  'Elisa',
  'Vicente',
];

const GUARDIAN_FIRST_NAMES = [
  'Ana',
  'Carlos',
  'Mariana',
  'João',
  'Fernanda',
  'Marcos',
  'Patrícia',
  'Paulo',
  'Camila',
  'Eduardo',
  'Renata',
  'Ricardo',
  'Aline',
  'Fábio',
  'Simone',
  'André',
  'Débora',
  'Bruno',
  'Larissa',
  'Diego',
  'Vanessa',
  'Rodrigo',
  'Carla',
  'Thiago',
  'Priscila',
  'Leandro',
  'Adriana',
  'Felipe',
  'Cristina',
  'Rogério',
];

const LAST_NAMES = [
  'Silva',
  'Santos',
  'Oliveira',
  'Souza',
  'Rodrigues',
  'Ferreira',
  'Alves',
  'Pereira',
  'Lima',
  'Gomes',
  'Costa',
  'Ribeiro',
  'Martins',
  'Carvalho',
  'Almeida',
  'Lopes',
  'Soares',
  'Fernandes',
  'Vieira',
  'Barbosa',
];

const PICKUP_FIRST_NAMES = [
  'Rita',
  'José',
  'Marta',
  'Luiz',
  'Vera',
  'Nelson',
  'Sônia',
  'Antônio',
  'Ivete',
  'Osvaldo',
];
const PICKUP_RELATIONSHIPS = ['Avó', 'Avô', 'Tio', 'Tia', 'Vizinho'];

function nameFromPool(firstNames: string[], index: number): string {
  const first = firstNames[index % firstNames.length];
  const last = LAST_NAMES[Math.floor(index / firstNames.length) % LAST_NAMES.length];
  return `${first} ${last}`;
}

function scheduleFor(index: number): {
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
} {
  return index % 2 === 0
    ? { startTime: '07:00', endTime: '17:00', breakStart: '12:00', breakEnd: '13:00' }
    : { startTime: '07:00', endTime: '17:00' };
}

const DISCOUNT_CYCLE = [0, 0, 0, 0, 10, 0, 0, 0, 0, 15, 0, 0, 0, 0, 50];
function discountFor(index: number): number {
  return DISCOUNT_CYCLE[index % DISCOUNT_CYCLE.length];
}

const PICKUP_COUNT_CYCLE = [1, 2, 1, 0, 2, 1, 1, 0, 2, 1];
function pickupCountFor(index: number): number {
  return PICKUP_COUNT_CYCLE[index % PICKUP_COUNT_CYCLE.length];
}

interface ClassDef {
  name: string;
  minAge: number;
  maxAge: number;
  maxCapacity: number;
}

const CLASS_DEFS: ClassDef[] = [
  { name: 'Berçário', minAge: 0, maxAge: 1, maxCapacity: 16 },
  { name: 'Maternal 1', minAge: 1, maxAge: 2, maxCapacity: 18 },
  { name: 'Maternal 2', minAge: 2, maxAge: 3, maxCapacity: 15 },
  { name: 'Maternal 3', minAge: 3, maxAge: 4, maxCapacity: 20 },
  { name: 'Pré', minAge: 4, maxAge: 5, maxCapacity: 17 },
];
const classDefByName = new Map(CLASS_DEFS.map((c) => [c.name, c]));
const BRACKETS = CLASS_DEFS.map((c) => c.name);

const NOW = new Date();
const CURRENT_YEAR = NOW.getUTCFullYear();
const CURRENT_MONTH = NOW.getUTCMonth() + 1;

/** Birth date consistent with the class's age bracket for the given school year (display/demo only — no runtime age validation exists). */
function birthDateForClass(cls: ClassDef, schoolYear: number, variant: number): string {
  const ageSpan = Math.max(1, cls.maxAge - cls.minAge);
  const ageYears = cls.minAge + (variant % ageSpan);
  const birthYear = schoolYear - ageYears;

  let month = 1 + (variant % 12);
  if (birthYear === CURRENT_YEAR && month >= CURRENT_MONTH) {
    const safeMax = Math.max(1, CURRENT_MONTH - 1);
    month = 1 + (variant % safeMax);
  }
  const day = 1 + (variant % 27);
  return `${birthYear}-${pad(month)}-${pad(day)}`;
}

// ─── Employees ──────────────────────────────────────────────────────────────

interface EmployeeSeed {
  name: string;
  position: string;
  inactive?: boolean;
}

const EMPLOYEES: EmployeeSeed[] = [
  { name: 'Juliana Ferreira', position: 'Professora' },
  { name: 'Camila Rocha', position: 'Professora' },
  { name: 'Beatriz Lima', position: 'Auxiliar de Sala' },
  { name: 'Fernanda Alves', position: 'Professora', inactive: true },
  { name: 'Patrícia Souza', position: 'Professora' },
  { name: 'Larissa Martins', position: 'Auxiliar de Sala' },
  { name: 'Vanessa Costa', position: 'Professora' },
  { name: 'Débora Nunes', position: 'Auxiliar de Sala' },
  { name: 'Renata Dias', position: 'Professora' },
  { name: 'Aline Barbosa', position: 'Professora' },
  { name: 'Simone Cardoso', position: 'Auxiliar de Sala' },
  { name: 'Marcia Pinto', position: 'Coordenadora Pedagógica', inactive: true },
];

const INACTIVE_SINCE = new Date('2025-11-01T00:00:00.000Z');

async function seedEmployees(): Promise<Map<string, string>> {
  const idByName = new Map<string, string>();

  for (const emp of EMPLOYEES) {
    const deletedAt = emp.inactive ? INACTIVE_SINCE : null;
    const existing = await prisma.employee.findFirst({ where: { name: emp.name } });

    if (existing) {
      const updated = await prisma.employee.update({
        where: { id: existing.id },
        data: { position: emp.position, deletedAt },
      });
      idByName.set(emp.name, updated.id);
    } else {
      const created = await prisma.employee.create({
        data: { name: emp.name, position: emp.position, deletedAt },
      });
      idByName.set(emp.name, created.id);
    }
  }

  console.log(`✅ Employees seeded — ${EMPLOYEES.length} upserted`);
  return idByName;
}

// ─── School classes ─────────────────────────────────────────────────────────

// Teacher/assistant per "ClassName-Year". Authoritative source is this exact
// assignment (matches the 12-row employee scenario table); 5 of the 10
// classes end up without an assistant, 5 with one — covers both cases.
const CLASS_STAFF: Record<string, { teacher: string; assistant?: string }> = {
  'Berçário-2025': { teacher: 'Juliana Ferreira' },
  'Berçário-2026': { teacher: 'Juliana Ferreira', assistant: 'Débora Nunes' },
  'Maternal 1-2025': { teacher: 'Camila Rocha', assistant: 'Beatriz Lima' },
  'Maternal 1-2026': { teacher: 'Camila Rocha' },
  'Maternal 2-2025': { teacher: 'Fernanda Alves' },
  'Maternal 2-2026': { teacher: 'Renata Dias' },
  'Maternal 3-2025': { teacher: 'Patrícia Souza', assistant: 'Larissa Martins' },
  'Maternal 3-2026': { teacher: 'Patrícia Souza', assistant: 'Larissa Martins' },
  'Pré-2025': { teacher: 'Vanessa Costa' },
  'Pré-2026': { teacher: 'Aline Barbosa', assistant: 'Simone Cardoso' },
};

async function seedSchoolClasses(
  employeeIdByName: Map<string, string>,
): Promise<Map<string, string>> {
  const idByKey = new Map<string, string>();

  for (const cls of CLASS_DEFS) {
    for (const year of [2025, 2026]) {
      const key = `${cls.name}-${year}`;
      const staff = CLASS_STAFF[key];
      const teacherId = employeeIdByName.get(staff.teacher);
      const assistantId = staff.assistant ? employeeIdByName.get(staff.assistant) : undefined;
      if (!teacherId) throw new Error(`Unknown teacher for ${key}`);

      const result = await prisma.schoolClass.upsert({
        where: { name_schoolYear: { name: cls.name, schoolYear: year } },
        update: { maxCapacity: cls.maxCapacity, teacherId, assistantId: assistantId ?? null },
        create: {
          name: cls.name,
          schoolYear: year,
          maxCapacity: cls.maxCapacity,
          teacherId,
          assistantId: assistantId ?? null,
        },
      });
      idByKey.set(key, result.id);
    }
  }

  console.log(`✅ School classes seeded — ${idByKey.size} upserted`);
  return idByKey;
}

// ─── Settings ───────────────────────────────────────────────────────────────

async function ensureSettings(): Promise<{ pricePerHour: number; defaultSchoolDays: number }> {
  const existing = await prisma.settings.findFirst();
  if (!existing) {
    // Shouldn't happen — the Item 5 migration seeds this row — but guard anyway.
    const created = await prisma.settings.create({
      data: { pricePerHour: 15, defaultSchoolDays: 20, latePenaltyPercentage: 10 },
    });
    return { pricePerHour: 15, defaultSchoolDays: created.defaultSchoolDays };
  }

  // pricePerHour starts at the migration's placeholder 0 — bump it to a realistic demo
  // value so computed tuition amounts aren't all zero, but never touch an admin-configured
  // (non-zero) value.
  if (Number(existing.pricePerHour) === 0) {
    const updated = await prisma.settings.update({
      where: { id: existing.id },
      data: { pricePerHour: 15 },
    });
    return { pricePerHour: 15, defaultSchoolDays: updated.defaultSchoolDays };
  }

  return {
    pricePerHour: Number(existing.pricePerHour),
    defaultSchoolDays: existing.defaultSchoolDays,
  };
}

// ─── Student plan generation ────────────────────────────────────────────────

interface EnrollmentPlan {
  classKey: string;
  startDate: string;
  endDate: string | null;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  discountPercentage: number;
}

interface StudentPlan {
  name: string;
  birthDate: string;
  leftSchool?: boolean;
  guardianIndex: number;
  pickupCount: number;
  enrollments: EnrollmentPlan[];
}

// 2026 active-enrollment targets per class (varied 8-15), split between students
// progressed from the equivalent 2025 class, mid-year transfer destinations, and
// fresh (scenario 1) enrollments. See prompt-item-6-seed.md section 3 for the
// scenario definitions.
const CLASS_2026_PLAN: {
  name: string;
  target: number;
  progressedFrom: string | null;
  progressedCount: number;
}[] = [
  { name: 'Berçário', target: 9, progressedFrom: null, progressedCount: 0 },
  { name: 'Maternal 1', target: 12, progressedFrom: 'Berçário', progressedCount: 4 },
  { name: 'Maternal 2', target: 8, progressedFrom: 'Maternal 1', progressedCount: 4 },
  { name: 'Maternal 3', target: 14, progressedFrom: 'Maternal 2', progressedCount: 5 },
  { name: 'Pré', target: 11, progressedFrom: 'Maternal 3', progressedCount: 5 },
];

// Mid-year (same-year) class swaps — scenario 5. One student per destination,
// moving up one bracket mid-2026 (not a year transition).
const TRANSFER_DESTINATIONS = ['Maternal 2', 'Maternal 3', 'Pré'];

// One "left the school" student per class (scenario 3) — skips Maternal 3 for variety.
const LEFT_SCHOOL_CLASSES = ['Berçário', 'Maternal 1', 'Maternal 2', 'Pré'];

const NOT_ENROLLED_COUNT = 3;

const SIBLING_PAIRS: [number, number][] = [
  [2, 3],
  [10, 11],
  [25, 26],
  [45, 46],
];

function buildStudentPlans(): StudentPlan[] {
  const plans: StudentPlan[] = [];
  let idx = 0;

  // Scenario 2 — progression: closed 2025 enrollment in the prior bracket, active 2026
  // enrollment in the next one up.
  for (const plan of CLASS_2026_PLAN) {
    if (!plan.progressedFrom || plan.progressedCount === 0) continue;
    const toCls = classDefByName.get(plan.name)!;

    for (let k = 0; k < plan.progressedCount; k++) {
      const i = idx++;
      plans.push({
        name: nameFromPool(CHILD_FIRST_NAMES, i),
        birthDate: birthDateForClass(toCls, 2026, i),
        guardianIndex: i,
        pickupCount: pickupCountFor(i),
        enrollments: [
          {
            classKey: `${plan.progressedFrom}-2025`,
            startDate: '2025-02-03',
            endDate: '2026-02-01',
            ...scheduleFor(i),
            discountPercentage: discountFor(i),
          },
          {
            classKey: `${plan.name}-2026`,
            startDate: '2026-02-02',
            endDate: null,
            ...scheduleFor(i),
            discountPercentage: discountFor(i),
          },
        ],
      });
    }
  }

  // Scenario 5 — mid-year transfer: two 2026 enrollments, first closed mid-year, second
  // active in the next bracket up.
  for (const destName of TRANSFER_DESTINATIONS) {
    const destIndex = BRACKETS.indexOf(destName);
    const originName = BRACKETS[destIndex - 1];
    const destCls = classDefByName.get(destName)!;
    const i = idx++;

    plans.push({
      name: nameFromPool(CHILD_FIRST_NAMES, i),
      birthDate: birthDateForClass(destCls, 2026, i),
      guardianIndex: i,
      pickupCount: pickupCountFor(i),
      enrollments: [
        {
          classKey: `${originName}-2026`,
          startDate: '2026-02-02',
          endDate: '2026-04-30',
          ...scheduleFor(i),
          discountPercentage: discountFor(i),
        },
        {
          classKey: `${destName}-2026`,
          startDate: '2026-05-01',
          endDate: null,
          ...scheduleFor(i + 1),
          discountPercentage: discountFor(i),
        },
      ],
    });
  }

  // Scenario 1 — majority: single active 2026 enrollment, no history. Fills whatever's
  // left of each class's target after progression + transfer destinations.
  const transferDestCounts = new Map<string, number>();
  for (const d of TRANSFER_DESTINATIONS) {
    transferDestCounts.set(d, (transferDestCounts.get(d) ?? 0) + 1);
  }

  for (const plan of CLASS_2026_PLAN) {
    const freshCount =
      plan.target - plan.progressedCount - (transferDestCounts.get(plan.name) ?? 0);
    const cls = classDefByName.get(plan.name)!;

    for (let k = 0; k < freshCount; k++) {
      const i = idx++;
      plans.push({
        name: nameFromPool(CHILD_FIRST_NAMES, i),
        birthDate: birthDateForClass(cls, 2026, i),
        guardianIndex: i,
        pickupCount: pickupCountFor(i),
        enrollments: [
          {
            classKey: `${plan.name}-2026`,
            startDate: '2026-02-02',
            endDate: null,
            ...scheduleFor(i),
            discountPercentage: discountFor(i),
          },
        ],
      });
    }
  }

  // Scenario 3 — left the school: closed-only 2025 enrollment, Student.deletedAt set.
  for (const className of LEFT_SCHOOL_CLASSES) {
    const cls = classDefByName.get(className)!;
    const i = idx++;
    plans.push({
      name: nameFromPool(CHILD_FIRST_NAMES, i),
      birthDate: birthDateForClass(cls, 2025, i),
      guardianIndex: i,
      pickupCount: pickupCountFor(i),
      leftSchool: true,
      enrollments: [
        {
          classKey: `${className}-2025`,
          startDate: '2025-02-03',
          endDate: '2025-07-15',
          ...scheduleFor(i),
          discountPercentage: discountFor(i),
        },
      ],
    });
  }

  // Scenario 4 — registered, never enrolled: active Student, zero enrollments.
  for (let k = 0; k < NOT_ENROLLED_COUNT; k++) {
    const i = idx++;
    plans.push({
      name: nameFromPool(CHILD_FIRST_NAMES, i),
      birthDate: birthDateForClass(CLASS_DEFS[k % CLASS_DEFS.length], 2026, i),
      guardianIndex: i,
      pickupCount: pickupCountFor(i),
      enrollments: [],
    });
  }

  // Sibling pairs — two students sharing one Guardian (same cpf).
  for (const [a, b] of SIBLING_PAIRS) {
    if (plans[a] && plans[b]) {
      plans[b].guardianIndex = plans[a].guardianIndex;
    }
  }

  return plans;
}

// ─── Students, guardians, pickups, enrollments ─────────────────────────────

async function seedStudents(
  classIdByKey: Map<string, string>,
  settings: { pricePerHour: number; defaultSchoolDays: number },
): Promise<{ created: number; skipped: number }> {
  const plans = buildStudentPlans();
  const guardianIdByIndex = new Map<number, string>();
  let created = 0;
  let skipped = 0;

  for (const plan of plans) {
    const existing = await prisma.student.findFirst({ where: { name: plan.name } });
    if (existing) {
      skipped++;
      continue;
    }

    let guardianId = guardianIdByIndex.get(plan.guardianIndex);
    if (!guardianId) {
      const cpf = deterministicCPF(plan.guardianIndex);
      const guardian = await prisma.guardian.upsert({
        where: { cpf },
        update: {},
        create: {
          name: nameFromPool(GUARDIAN_FIRST_NAMES, plan.guardianIndex),
          cpf,
          phone: `119${String(80000000 + plan.guardianIndex).slice(-8)}`,
        },
      });
      guardianId = guardian.id;
      guardianIdByIndex.set(plan.guardianIndex, guardianId);
    }

    const student = await prisma.student.create({
      data: {
        name: plan.name,
        birthDate: new Date(plan.birthDate),
        guardianId,
        deletedAt: plan.leftSchool ? new Date('2025-08-20T00:00:00.000Z') : null,
      },
    });

    for (let p = 0; p < plan.pickupCount; p++) {
      const pickupIndex = plan.guardianIndex * 3 + p;
      await prisma.authorizedPickup.create({
        data: {
          studentId: student.id,
          name: nameFromPool(PICKUP_FIRST_NAMES, pickupIndex),
          relationship: PICKUP_RELATIONSHIPS[pickupIndex % PICKUP_RELATIONSHIPS.length],
          phone: `119${String(70000000 + pickupIndex).slice(-8)}`,
        },
      });
    }

    for (const enr of plan.enrollments) {
      const schoolClassId = classIdByKey.get(enr.classKey);
      if (!schoolClassId) throw new Error(`Unknown classKey ${enr.classKey}`);

      const dailyHours = calculateDailyHours(
        enr.startTime,
        enr.endTime,
        enr.breakStart,
        enr.breakEnd,
      );
      const tuitionAmount = calculateTuition(
        dailyHours,
        settings.pricePerHour,
        settings.defaultSchoolDays,
        enr.discountPercentage,
      );

      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          schoolClassId,
          startTime: timeStringToDate(enr.startTime),
          endTime: timeStringToDate(enr.endTime),
          breakStart: enr.breakStart ? timeStringToDate(enr.breakStart) : null,
          breakEnd: enr.breakEnd ? timeStringToDate(enr.breakEnd) : null,
          discountPercentage: enr.discountPercentage,
          tuitionAmount,
          startDate: new Date(enr.startDate),
          endDate: enr.endDate ? new Date(enr.endDate) : null,
        },
      });
    }

    created++;
  }

  console.log(`✅ Students seeded — ${created} created, ${skipped} already existed`);
  return { created, skipped };
}

// ─── Summary report ─────────────────────────────────────────────────────────

async function printSummary(classIdByKey: Map<string, string>) {
  console.log('\n--- 2026 active students per class ---');
  for (const cls of CLASS_DEFS) {
    const schoolClassId = classIdByKey.get(`${cls.name}-2026`)!;
    const count = await prisma.enrollment.count({ where: { schoolClassId, endDate: null } });
    console.log(`  ${cls.name.padEnd(12)} ${count}`);
  }

  const totalStudents = await prisma.student.count();
  const leftSchool = await prisma.student.count({ where: { deletedAt: { not: null } } });
  const neverEnrolled = await prisma.student.count({ where: { enrollments: { none: {} } } });
  const withTwoEnrollments = await prisma.student.findMany({
    where: { enrollments: { some: {} } },
    include: { enrollments: true },
  });
  const progressed = withTwoEnrollments.filter(
    (s) =>
      s.enrollments.length === 2 &&
      s.deletedAt === null &&
      s.enrollments.some((e) => e.endDate !== null) &&
      s.enrollments.some((e) => e.endDate === null),
  ).length;
  const withBreak = await prisma.enrollment.count({ where: { breakStart: { not: null } } });
  const withoutBreak = await prisma.enrollment.count({ where: { breakStart: null } });
  const discounted = await prisma.enrollment.count({ where: { discountPercentage: { gt: 0 } } });

  console.log('\n--- Scenario coverage ---');
  console.log(
    `  1. Majority (single active 2026 enrollment): present (see per-class counts above)`,
  );
  console.log(`  2. Progression (2 enrollments, one closed + one active): ${progressed} students`);
  console.log(`  3. Left the school (deletedAt set): ${leftSchool} students`);
  console.log(`  4. Registered, never enrolled: ${neverEnrolled} students`);
  console.log(
    `  5. Mid-year transfer (2 enrollments, both in 2026): ${TRANSFER_DESTINATIONS.length} students`,
  );
  console.log(`  6. Schedule mix: ${withBreak} with break, ${withoutBreak} full-time`);
  console.log(`  7. Discount mix: ${discounted} enrollments with discount > 0`);
  console.log(`\nTotal students: ${totalStudents}`);
}

async function main() {
  await seedAdmin();

  const employeeIdByName = await seedEmployees();
  const classIdByKey = await seedSchoolClasses(employeeIdByName);
  const settings = await ensureSettings();
  await seedStudents(classIdByKey, settings);
  await printSummary(classIdByKey);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
