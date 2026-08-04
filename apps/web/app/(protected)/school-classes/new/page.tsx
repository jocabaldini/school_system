import { cookies } from 'next/headers';
import { getDictionary, DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from '@/lib/i18n';
import Navbar from '../../_components/Navbar';
import { getMe } from '../../dashboard/actions';
import { listActiveEmployees } from '../actions';
import SchoolClassFormClient from '../view/SchoolClassFormClient';

export default async function NewSchoolClassPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get(LOCALE_COOKIE)?.value ?? DEFAULT_LOCALE) as Locale;
  const dict = getDictionary(locale);
  const user = await getMe();
  const employees = await listActiveEmployees();

  return (
    <>
      <Navbar
        userName={user?.name ?? ''}
        dict={dict.navbar}
        currentLocale={locale}
        title={dict.schoolClasses.formTitleNew}
      />
      <SchoolClassFormClient dict={dict.schoolClasses} schoolClass={null} employees={employees} />
    </>
  );
}
