import { cookies } from 'next/headers';
import { getDictionary, DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from '@/lib/i18n';
import Navbar from '../_components/Navbar';
import { getMe } from '../dashboard/actions';
import { listFuncionarios } from './actions';
import FuncionariosListClient from './view/FuncionariosListClient';
import type { StatusFilter } from './types';

const DEFAULT_LIMIT = 50;
const ALLOWED_LIMITS = [10, 25, 50];

interface FuncionariosPageProps {
  searchParams: Promise<{ page?: string; status?: string; limit?: string; q?: string }>;
}

export default async function FuncionariosPage({ searchParams }: FuncionariosPageProps) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get(LOCALE_COOKIE)?.value ?? DEFAULT_LOCALE) as Locale;
  const dict = getDictionary(locale);
  const user = await getMe();

  const params = await searchParams;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;
  const statusFilter: StatusFilter | 'TODOS' =
    params.status === 'INATIVO' ? 'INATIVO' : params.status === 'TODOS' ? 'TODOS' : 'ATIVO';
  const status = statusFilter === 'TODOS' ? undefined : statusFilter;
  const limit = ALLOWED_LIMITS.includes(Number(params.limit))
    ? Number(params.limit)
    : DEFAULT_LIMIT;
  const q = params.q ?? '';

  const result = await listFuncionarios({ page, limit, status, q: q || undefined });

  return (
    <>
      <Navbar
        userName={user?.name ?? ''}
        dict={dict.navbar}
        currentLocale={locale}
        title={dict.sidebar.funcionarios}
      />
      <FuncionariosListClient
        dict={dict.funcionarios}
        result={result}
        page={page}
        statusFilter={statusFilter}
        limit={limit}
        q={q}
      />
    </>
  );
}
