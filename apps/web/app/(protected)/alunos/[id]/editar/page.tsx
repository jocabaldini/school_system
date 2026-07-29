import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getDictionary, DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from '@/lib/i18n';
import { ApiError } from '@/lib/api/errors';
import Navbar from '../../../_components/Navbar';
import { getMe } from '../../../dashboard/actions';
import { getAluno } from '../../actions';
import AlunoFormClient from '../../view/AlunoFormClient';

interface EditarAlunoPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarAlunoPage({ params }: EditarAlunoPageProps) {
  const { id } = await params;

  const cookieStore = await cookies();
  const locale = (cookieStore.get(LOCALE_COOKIE)?.value ?? DEFAULT_LOCALE) as Locale;
  const dict = getDictionary(locale);
  const user = await getMe();

  let aluno;
  try {
    aluno = await getAluno(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <>
      <Navbar
        userName={user?.name ?? ''}
        dict={dict.navbar}
        currentLocale={locale}
        title={dict.alunos.formTitleEdit}
      />
      <AlunoFormClient dict={dict.alunos} aluno={aluno} />
    </>
  );
}
