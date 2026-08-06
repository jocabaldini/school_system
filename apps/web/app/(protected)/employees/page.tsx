import { cookies } from 'next/headers';
import { getDictionary, DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from '@/lib/i18n';
import Navbar from '../_components/Navbar';
import { getMe } from '../dashboard/actions';
import { listEmployees } from './actions';
import EmployeesListClient from './view/EmployeesListClient';
import type { StatusFilter } from './types';

const DEFAULT_LIMIT = 10;
const ALLOWED_LIMITS = [10, 25, 50];

interface EmployeesPageProps {
  searchParams: Promise<{ page?: string; status?: string; limit?: string; q?: string }>;
}

export default async function EmployeesPage({ searchParams }: EmployeesPageProps) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get(LOCALE_COOKIE)?.value ?? DEFAULT_LOCALE) as Locale;
  const dict = getDictionary(locale);
  const user = await getMe();

  const params = await searchParams;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;
  const statusFilter: StatusFilter | 'ALL' =
    params.status === 'INACTIVE' ? 'INACTIVE' : params.status === 'ALL' ? 'ALL' : 'ACTIVE';
  const status = statusFilter === 'ALL' ? undefined : statusFilter;
  const limit = ALLOWED_LIMITS.includes(Number(params.limit))
    ? Number(params.limit)
    : DEFAULT_LIMIT;
  const q = params.q ?? '';

  const result = await listEmployees({ page, limit, status, q: q || undefined });

  return (
    <>
      <Navbar
        userName={user?.name ?? ''}
        dict={dict.navbar}
        currentLocale={locale}
        title={dict.sidebar.employees}
      />
      <EmployeesListClient
        dict={dict.employees}
        result={result}
        page={page}
        statusFilter={statusFilter}
        limit={limit}
        q={q}
      />
    </>
  );
}
