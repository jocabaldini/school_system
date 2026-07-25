'use client';

import { useSyncExternalStore, useTransition } from 'react';
import { logoutAction } from '@/app/(protected)/dashboard/actions';
import { setLocaleAction } from '@/lib/i18n/actions';
import type { Dictionary, Locale } from '@/lib/i18n';

interface NavbarProps {
  userName: string;
  dict: Dictionary['navbar'];
  currentLocale: Locale;
  title?: string;
}

type Theme = 'light' | 'dark';

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="h-4 w-4"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 1020.354 15.354z" />
    </svg>
  );
}

const THEME_CHANGE_EVENT = 'schoolsystem:themechange';

function subscribeToTheme(callback: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, callback);
}

function getThemeSnapshot(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function getServerThemeSnapshot(): Theme {
  return 'light';
}

export default function Navbar({ userName, dict, currentLocale, title }: NavbarProps) {
  const [isPending, startTransition] = useTransition();
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  function handleToggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  function handleLocaleChange(locale: Locale) {
    startTransition(async () => {
      await setLocaleAction(locale);
    });
  }

  return (
    <header className="w-full border-b border-line bg-surface-header px-6 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <span className="text-lg font-semibold text-ink">{title}</span>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm">
            {(['pt-BR', 'en-US'] as Locale[]).map((locale) => (
              <button
                key={locale}
                onClick={() => handleLocaleChange(locale)}
                disabled={isPending || currentLocale === locale}
                className="rounded px-2 py-1 text-ink-muted transition hover:text-ink disabled:font-semibold disabled:text-ink cursor-pointer"
              >
                {locale === 'pt-BR' ? 'PT' : 'EN'}
              </button>
            ))}
          </div>

          <span className="text-sm text-ink-muted">{userName}</span>

          <button
            onClick={handleToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded p-1.5 text-ink-muted transition hover:text-ink cursor-pointer"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          <button
            onClick={handleLogout}
            disabled={isPending}
            className="rounded-md bg-btn-danger-bg text-btn-danger-ink px-3 py-1.5 text-sm font-medium transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {isPending ? dict.loggingOut : dict.logout}
          </button>
        </div>
      </div>
    </header>
  );
}
