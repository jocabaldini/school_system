import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getDictionary, DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from '@/lib/i18n';
import { ApiError } from '@/lib/api/errors';
import Navbar from '../../../_components/Navbar';
import { getMe } from '../../../dashboard/actions';
import { getFuncionario } from '../../actions';
import FuncionarioFormClient from '../../view/FuncionarioFormClient';

interface EditarFuncionarioPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarFuncionarioPage({ params }: EditarFuncionarioPageProps) {
  const { id } = await params;

  const cookieStore = await cookies();
  const locale = (cookieStore.get(LOCALE_COOKIE)?.value ?? DEFAULT_LOCALE) as Locale;
  const dict = getDictionary(locale);
  const user = await getMe();

  try {
    const funcionario = await getFuncionario(id);

    return (
      <>
        <Navbar
          userName={user?.name ?? ''}
          dict={dict.navbar}
          currentLocale={locale}
          title={dict.funcionarios.formTitleEdit}
        />
        <FuncionarioFormClient dict={dict.funcionarios} funcionario={funcionario} />
      </>
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }
}
