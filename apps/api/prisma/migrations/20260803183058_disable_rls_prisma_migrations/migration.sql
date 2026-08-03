-- _prisma_migrations is Prisma's own internal bookkeeping table (no business data).
-- Enabling RLS on it (in 20260729140700_enable_rls) breaks `prisma migrate dev`'s local
-- shadow-database replay (P3006/P1014) — `migrate deploy`, used by CI/e2e, is unaffected.
-- This is an intentional, narrow exception for this one internal table; it does not revert
-- the RLS fix for the business tables (Student, Guardian, Employee, etc.), which stays as-is.
ALTER TABLE "_prisma_migrations" DISABLE ROW LEVEL SECURITY;
