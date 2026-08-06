-- Supabase Advisor flagged these public-schema tables as having RLS disabled,
-- which exposes them to the public REST API via the anon/authenticated keys.
-- The app never talks to Postgres through that API — the NestJS backend is the
-- only consumer, connecting via Prisma with the `postgres` role, which is the
-- owner of these tables and therefore is NOT restricted by RLS unless FORCE
-- ROW LEVEL SECURITY is also set (it is not, here). So enabling RLS with zero
-- policies fully blocks anon/authenticated access while leaving the backend
-- untouched — no policies are needed or created.
--
-- _prisma_migrations is intentionally excluded: it's Prisma's own internal
-- bookkeeping table (no business data), and enabling RLS on it breaks
-- `prisma migrate dev`'s local shadow-database replay (P3006/P1014).
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Responsavel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AutorizadoBusca" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Aluno" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Funcionario" ENABLE ROW LEVEL SECURITY;
