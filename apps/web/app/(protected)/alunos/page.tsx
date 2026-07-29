import { cookies } from 'next/headers';
import { getDictionary, DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from '@/lib/i18n';
import Navbar from '../_components/Navbar';
import { getMe } from '../dashboard/actions';
import { listAlunos } from './actions';
import AlunosListClient from './view/AlunosListClient';
import type { StatusAluno } from './types';

const DEFAULT_LIMIT = 50;
const ALLOWED_LIMITS = [10, 25, 50];

interface AlunosPageProps {
  searchParams: Promise<{ page?: string; status?: string; limit?: string }>;
}

export default async function AlunosPage({ searchParams }: AlunosPageProps) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get(LOCALE_COOKIE)?.value ?? DEFAULT_LOCALE) as Locale;
  const dict = getDictionary(locale);
  const user = await getMe();

  const params = await searchParams;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;
  const statusFilter: StatusAluno | 'TODOS' =
    params.status === 'INATIVO' ? 'INATIVO' : params.status === 'TODOS' ? 'TODOS' : 'ATIVO';
  const status = statusFilter === 'TODOS' ? undefined : statusFilter;
  const limit = ALLOWED_LIMITS.includes(Number(params.limit))
    ? Number(params.limit)
    : DEFAULT_LIMIT;

  const result = await listAlunos({ page, limit, status });

  return (
    <>
      <Navbar
        userName={user?.name ?? ''}
        dict={dict.navbar}
        currentLocale={locale}
        title={dict.sidebar.alunos}
      />
      <AlunosListClient
        dict={dict.alunos}
        result={result}
        page={page}
        statusFilter={statusFilter}
        limit={limit}
      />
    </>
  );
}
