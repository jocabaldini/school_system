'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Dictionary } from '@/lib/i18n';
import { Toast, type ToastVariant } from '@/app/_components/Toast';
import { StatusBadge } from '@/app/_components/StatusBadge';
import { activateSchoolClass, deactivateSchoolClass } from '../actions';
import type { SchoolClassListResult, StatusFilter } from '../types';

const LIMIT_OPTIONS = [10, 25, 50];

interface SchoolClassesListClientProps {
  dict: Dictionary['schoolClasses'];
  result: SchoolClassListResult;
  page: number;
  statusFilter: StatusFilter | 'ALL';
  limit: number;
  q: string;
  schoolYear: number | undefined;
}

export default function SchoolClassesListClient({
  dict,
  result,
  page,
  statusFilter,
  limit,
  q,
  schoolYear,
}: SchoolClassesListClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState(q);
  const [yearFilter, setYearFilter] = useState(schoolYear ? String(schoolYear) : '');
  const [isPending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<ToastVariant>('info');

  function showToast(message: string, variant: ToastVariant) {
    setToastMessage(message);
    setToastVariant(variant);
    setToastOpen(true);
  }

  function navigate(
    nextPage: number,
    nextStatus: string,
    nextLimit: number,
    nextQ: string,
    nextYear: string,
  ) {
    const query = new URLSearchParams();
    if (nextPage > 1) query.set('page', String(nextPage));
    query.set('status', nextStatus);
    query.set('limit', String(nextLimit));
    if (nextQ.trim()) query.set('q', nextQ.trim());
    if (nextYear.trim()) query.set('schoolYear', nextYear.trim());
    router.push(`/school-classes?${query.toString()}`);
  }

  // Debounced server-side name/year search, reflected in the URL
  useEffect(() => {
    if (search === q && yearFilter === (schoolYear ? String(schoolYear) : '')) return;

    const timeout = setTimeout(() => {
      navigate(1, statusFilter, limit, search, yearFilter);
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, yearFilter]);

  function handleToggleStatus(schoolClassId: string, isActive: boolean) {
    setTogglingId(schoolClassId);

    startTransition(async () => {
      try {
        if (isActive) {
          await deactivateSchoolClass(schoolClassId);
        } else {
          await activateSchoolClass(schoolClassId);
        }
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : dict.toggleStatusErrorFallback;
        showToast(msg, 'error');
      } finally {
        setTogglingId(null);
      }
    });
  }

  const totalPages = Math.max(1, Math.ceil(result.total / result.limit));

  return (
    <main className="flex flex-1 flex-col gap-4 bg-surface-page p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">{dict.title}</h1>
        <Link
          href="/school-classes/new"
          className="rounded-lg bg-btn-primary-bg text-btn-primary-ink px-4 py-2 text-sm font-medium hover:opacity-90 transition"
        >
          {dict.newButton}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={dict.searchPlaceholder}
          className="text-ink placeholder:text-ink-faint bg-surface-card rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
        />

        <input
          type="number"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          placeholder={dict.schoolYearFilterPlaceholder}
          className="text-ink placeholder:text-ink-faint bg-surface-card w-32 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
        />

        <select
          value={statusFilter}
          onChange={(e) => navigate(1, e.target.value, limit, search, yearFilter)}
          className="text-ink bg-surface-card rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
        >
          <option value="ACTIVE">{dict.statusActive}</option>
          <option value="INACTIVE">{dict.statusInactive}</option>
          <option value="ALL">{dict.statusAll}</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-row-header text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">{dict.columnName}</th>
              <th className="px-4 py-3 font-medium">{dict.columnSchoolYear}</th>
              <th className="px-4 py-3 font-medium">{dict.columnTeacher}</th>
              <th className="px-4 py-3 font-medium">{dict.columnAssistant}</th>
              <th className="px-4 py-3 font-medium">{dict.columnOccupancy}</th>
              <th className="px-4 py-3 font-medium">{dict.columnStatus}</th>
              <th className="px-4 py-3 font-medium">{dict.columnActions}</th>
            </tr>
          </thead>
          <tbody>
            {result.data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-muted">
                  {dict.emptyState}
                </td>
              </tr>
            )}
            {result.data.map((schoolClass) => (
              <tr key={schoolClass.id} className="border-t border-line">
                <td className="px-4 py-3 text-ink">{schoolClass.name}</td>
                <td className="px-4 py-3 text-ink-muted">{schoolClass.schoolYear}</td>
                <td className="px-4 py-3 text-ink-muted">{schoolClass.teacher?.name ?? '—'}</td>
                <td className="px-4 py-3 text-ink-muted">{schoolClass.assistant?.name ?? '—'}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {schoolClass._count?.enrollments ?? 0}/{schoolClass.maxCapacity}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    deletedAt={schoolClass.deletedAt}
                    activeLabel={dict.statusActive}
                    inactiveLabel={dict.statusInactive}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/school-classes/${schoolClass.id}/edit`}
                      className="text-sm font-medium text-primary-700 hover:underline"
                    >
                      {dict.editAction}
                    </Link>
                    <button
                      type="button"
                      disabled={isPending && togglingId === schoolClass.id}
                      onClick={() =>
                        handleToggleStatus(schoolClass.id, schoolClass.deletedAt === null)
                      }
                      className="text-sm font-medium text-primary-700 hover:underline disabled:opacity-50"
                    >
                      {schoolClass.deletedAt === null ? dict.deactivateAction : dict.activateAction}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-ink-muted">
        <div className="flex items-center gap-2">
          <span>{dict.itemsPerPage}</span>
          <select
            value={limit}
            onChange={(e) => navigate(1, statusFilter, Number(e.target.value), search, yearFilter)}
            className="text-ink bg-surface-card rounded-md border border-line px-2 py-1 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
          >
            {LIMIT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <span>
          {dict.page} {page} / {totalPages}
        </span>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => navigate(page - 1, statusFilter, limit, search, yearFilter)}
            className="rounded-md border border-line bg-surface-card px-3 py-1.5 text-ink transition hover:bg-surface-row-header disabled:opacity-50"
          >
            {dict.previous}
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => navigate(page + 1, statusFilter, limit, search, yearFilter)}
            className="rounded-md border border-line bg-surface-card px-3 py-1.5 text-ink transition hover:bg-surface-row-header disabled:opacity-50"
          >
            {dict.next}
          </button>
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
