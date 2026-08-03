-- CreateTable
CREATE TABLE "SchoolClass" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schoolYear" INTEGER NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "teacherId" TEXT NOT NULL,
    "assistantId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolClassId" TEXT NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "breakStart" TIME,
    "breakEnd" TIME,
    "discountPercentage" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tuitionAmount" DECIMAL(65,30) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "pricePerHour" DECIMAL(65,30) NOT NULL,
    "defaultSchoolDays" INTEGER NOT NULL DEFAULT 20,
    "latePenaltyPercentage" DECIMAL(65,30) NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolClass_name_schoolYear_key" ON "SchoolClass"("name", "schoolYear");

-- AddForeignKey
ALTER TABLE "SchoolClass" ADD CONSTRAINT "SchoolClass_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolClass" ADD CONSTRAINT "SchoolClass_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_schoolClassId_fkey" FOREIGN KEY ("schoolClassId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed the single Settings row. pricePerHour starts at 0 — the ADMIN sets the
-- real value later through the settings screen. id is a hardcoded literal since
-- Prisma's cuid() default is app-level, not a DB default.
INSERT INTO "Settings" ("id", "pricePerHour", "defaultSchoolDays", "latePenaltyPercentage", "updatedAt")
VALUES ('settings_default_row', 0, 20, 10, CURRENT_TIMESTAMP);

-- Same RLS posture as every other public-schema business table (see enable_rls
-- migration): blocks anon/authenticated REST access via Supabase while leaving
-- the backend (which connects as table owner) untouched.
ALTER TABLE "SchoolClass" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Enrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Settings" ENABLE ROW LEVEL SECURITY;
