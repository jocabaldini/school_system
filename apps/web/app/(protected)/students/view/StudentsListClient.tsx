'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Dictionary } from '@/lib/i18n';
import { Toast, type ToastVariant } from '@/app/_components/Toast';
import { StatusBadge } from '@/app/_components/StatusBadge';
import { activateStudent, deactivateStudent } from '../actions';
import type { StudentListResult, StatusFilter } from '../types';

const LIMIT_OPTIONS = [10, 25, 50];

interface StudentsListClientProps {
  dict: Dictionary['students'];
  result: StudentListResult;
  page: number;
  statusFilter: StatusFilter | 'ALL';
  limit: number;
}

export default function StudentsListClient({
  dict,
  result,
  page,
  statusFilter,
  limit,
}: StudentsListClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return result.data;
    return result.data.filter((student) => student.name.toLowerCase().includes(term));
  }, [result.data, search]);

  function navigate(nextPage: number, nextStatus: string, nextLimit: number) {
    const query = new URLSearchParams();
    if (nextPage > 1) query.set('page', String(nextPage));
    query.set('status', nextStatus);
    query.set('limit', String(nextLimit));
    router.push(`/students?${query.toString()}`);
  }

  function handleToggleStatus(studentId: string, isActive: boolean) {
    setTogglingId(studentId);

    startTransition(async () => {
      try {
        if (isActive) {
          await deactivateStudent(studentId);
        } else {
          await activateStudent(studentId);
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
          href="/students/new"
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

        <select
          value={statusFilter}
          onChange={(e) => navigate(1, e.target.value, limit)}
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
              <th className="px-4 py-3 font-medium">{dict.columnGuardian}</th>
              <th className="px-4 py-3 font-medium">{dict.columnSchoolClass}</th>
              <th className="px-4 py-3 font-medium">{dict.columnStatus}</th>
              <th className="px-4 py-3 font-medium">{dict.columnActions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-muted">
                  {dict.emptyState}
                </td>
              </tr>
            )}
            {filtered.map((student) => (
              <tr key={student.id} className="border-t border-line">
                <td className="px-4 py-3 text-ink">{student.name}</td>
                <td className="px-4 py-3 text-ink-muted">{student.guardian?.name ?? '—'}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {student.enrollments?.[0]?.schoolClass?.name ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    deletedAt={student.deletedAt}
                    activeLabel={dict.statusActive}
                    inactiveLabel={dict.statusInactive}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/students/${student.id}/edit`}
                      className="text-sm font-medium text-primary-700 hover:underline"
                    >
                      {dict.editAction}
                    </Link>
                    <button
                      type="button"
                      disabled={isPending && togglingId === student.id}
                      onClick={() => handleToggleStatus(student.id, student.deletedAt === null)}
                      className="text-sm font-medium text-primary-700 hover:underline disabled:opacity-50"
                    >
                      {student.deletedAt === null ? dict.deactivateAction : dict.activateAction}
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
            onChange={(e) => navigate(1, statusFilter, Number(e.target.value))}
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
            onClick={() => navigate(page - 1, statusFilter, limit)}
            className="rounded-md border border-line bg-surface-card px-3 py-1.5 text-ink transition hover:bg-surface-row-header disabled:opacity-50"
          >
            {dict.previous}
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => navigate(page + 1, statusFilter, limit)}
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
