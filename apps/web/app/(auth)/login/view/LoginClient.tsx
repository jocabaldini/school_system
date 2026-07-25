'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/lib/auth/actions';
import { Toast, type ToastVariant } from '@/app/_components/Toast';
import type { Dictionary } from '@/lib/i18n';

type Props = {
  dict: Dictionary['login'];
};

export default function LoginClient({ dict }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<ToastVariant>('info');

  function showToast(message: string, variant: ToastVariant) {
    setToastMessage(message);
    setToastVariant(variant);
    setToastOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      try {
        await loginAction(email, password);
        // Redirect on the client after cookie is set
        router.push('/dashboard');
      } catch (err) {
        const msg = err instanceof Error ? err.message : dict.errorFallback;
        showToast(msg, 'error');
      }
    });
  }

  return (
    <main className="min-h-screen bg-surface-page flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-line bg-surface-card p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-ink">{dict.title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{dict.subtitle}</p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-ink-muted">
                {dict.email}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-ink placeholder:text-ink-faint bg-surface-card rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
                placeholder={dict.emailPlaceholder}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium text-ink-muted">
                {dict.password}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-ink placeholder:text-ink-faint bg-surface-card rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
                placeholder={dict.passwordPlaceholder}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 rounded-lg bg-btn-primary-bg text-btn-primary-ink px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {isPending ? dict.submitting : dict.submit}
            </button>
          </form>
        </div>
      </div>

      <Toast
        open={toastOpen}
        message={toastMessage}
        variant={toastVariant}
        onClose={() => setToastOpen(false)}
      />
    </main>
  );
}
