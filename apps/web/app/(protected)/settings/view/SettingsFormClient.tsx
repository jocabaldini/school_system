'use client';

import { useState, useTransition } from 'react';
import type { Dictionary } from '@/lib/i18n';
import { Toast, type ToastVariant } from '@/app/_components/Toast';
import { updateSettings } from '../actions';
import type { Settings } from '../types';

interface SettingsFormClientProps {
  dict: Dictionary['settings'];
  settings: Settings;
}

const inputClass =
  'text-ink placeholder:text-ink-faint bg-surface-card rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition disabled:opacity-50';
const labelClass = 'text-sm font-medium text-ink-muted';

export default function SettingsFormClient({ dict, settings }: SettingsFormClientProps) {
  const [isPending, startTransition] = useTransition();

  const [pricePerHour, setPricePerHour] = useState(settings.pricePerHour);
  const [defaultSchoolDays, setDefaultSchoolDays] = useState(String(settings.defaultSchoolDays));
  const [latePenaltyPercentage, setLatePenaltyPercentage] = useState(
    settings.latePenaltyPercentage,
  );

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

    if (!pricePerHour.trim() || !defaultSchoolDays.trim() || !latePenaltyPercentage.trim()) {
      showToast(dict.errorFieldsRequired, 'error');
      return;
    }

    startTransition(async () => {
      try {
        await updateSettings({
          pricePerHour: Number(pricePerHour),
          defaultSchoolDays: Number(defaultSchoolDays),
          latePenaltyPercentage: Number(latePenaltyPercentage),
        });
        showToast(dict.saveSuccess, 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : dict.errorFallback;
        showToast(msg, 'error');
      }
    });
  }

  return (
    <main className="flex flex-1 flex-col gap-4 bg-surface-page p-6">
      <h1 className="text-2xl font-semibold text-ink">{dict.title}</h1>

      <div className="rounded-xl border border-line bg-surface-card">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="pricePerHour">
              {dict.fieldPricePerHour}
            </label>
            <input
              id="pricePerHour"
              type="number"
              min={0}
              step="0.01"
              value={pricePerHour}
              onChange={(e) => setPricePerHour(e.target.value)}
              placeholder={dict.fieldPricePerHourPlaceholder}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="defaultSchoolDays">
              {dict.fieldDefaultSchoolDays}
            </label>
            <input
              id="defaultSchoolDays"
              type="number"
              min={1}
              value={defaultSchoolDays}
              onChange={(e) => setDefaultSchoolDays(e.target.value)}
              placeholder={dict.fieldDefaultSchoolDaysPlaceholder}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="latePenaltyPercentage">
              {dict.fieldLatePenaltyPercentage}
            </label>
            <input
              id="latePenaltyPercentage"
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={latePenaltyPercentage}
              onChange={(e) => setLatePenaltyPercentage(e.target.value)}
              placeholder={dict.fieldLatePenaltyPercentagePlaceholder}
              className={inputClass}
            />
          </div>

          <div className="mt-2 flex gap-3 border-t border-line pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-btn-primary-bg text-btn-primary-ink px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {isPending ? dict.submitting : dict.submit}
            </button>
          </div>
        </form>
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
