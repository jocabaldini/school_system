import { cookies } from 'next/headers';
import { getDictionary, DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from '@/lib/i18n';
import Navbar from '../../_components/Navbar';
import { getMe } from '../../dashboard/actions';
import FuncionarioFormClient from '../view/FuncionarioFormClient';

export default async function NovoFuncionarioPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get(LOCALE_COOKIE)?.value ?? DEFAULT_LOCALE) as Locale;
  const dict = getDictionary(locale);
  const user = await getMe();

  return (
    <>
      <Navbar
        userName={user?.name ?? ''}
        dict={dict.navbar}
        currentLocale={locale}
        title={dict.funcionarios.formTitleNew}
      />
      <FuncionarioFormClient dict={dict.funcionarios} funcionario={null} />
    </>
  );
}
