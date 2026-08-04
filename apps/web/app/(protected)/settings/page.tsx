import { cookies } from 'next/headers';
import { getDictionary, DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from '@/lib/i18n';
import Navbar from '../_components/Navbar';
import { getMe } from '../dashboard/actions';
import { getSettings } from './actions';
import SettingsFormClient from './view/SettingsFormClient';

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get(LOCALE_COOKIE)?.value ?? DEFAULT_LOCALE) as Locale;
  const dict = getDictionary(locale);
  const user = await getMe();
  const settings = await getSettings();

  return (
    <>
      <Navbar
        userName={user?.name ?? ''}
        dict={dict.navbar}
        currentLocale={locale}
        title={dict.sidebar.settings}
      />
      <SettingsFormClient dict={dict.settings} settings={settings} />
    </>
  );
}
