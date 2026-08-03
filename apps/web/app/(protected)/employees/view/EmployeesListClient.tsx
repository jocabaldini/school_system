'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Dictionary } from '@/lib/i18n';
import { Toast, type ToastVariant } from '@/app/_components/Toast';
import { StatusBadge } from '@/app/_components/StatusBadge';
import { activateEmployee, deactivateEmployee } from '../actions';
import type { EmployeeListResult, StatusFilter } from '../types';

const LIMIT_OPTIONS = [10, 25, 50];

interface EmployeesListClientProps {
  dict: Dictionary['employees'];
  result: EmployeeListResult;
  page: number;
  statusFilter: StatusFilter | 'ALL';
  limit: number;
  q: string;
}

export default function EmployeesListClient({
  dict,
  result,
  page,
  statusFilter,
  limit,
  q,
}: EmployeesListClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState(q);
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

  function navigate(nextPage: number, nextStatus: string, nextLimit: number, nextQ: string) {
    const query = new URLSearchParams();
    if (nextPage > 1) query.set('page', String(nextPage));
    query.set('status', nextStatus);
    query.set('limit', String(nextLimit));
    if (nextQ.trim()) query.set('q', nextQ.trim());
    router.push(`/employees?${query.toString()}`);
  }

  // Debounced server-side name search, reflected in the URL
  useEffect(() => {
    if (search === q) return;

    const timeout = setTimeout(() => {
      navigate(1, statusFilter, limit, search);
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function handleToggleStatus(employeeId: string, isActive: boolean) {
    setTogglingId(employeeId);

    startTransition(async () => {
      try {
        if (isActive) {
          await deactivateEmployee(employeeId);
        } else {
          await activateEmployee(employeeId);
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
          href="/employees/new"
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
          onChange={(e) => navigate(1, e.target.value, limit, search)}
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
              <th className="px-4 py-3 font-medium">{dict.columnPosition}</th>
              <th className="px-4 py-3 font-medium">{dict.columnStatus}</th>
              <th className="px-4 py-3 font-medium">{dict.columnActions}</th>
            </tr>
          </thead>
          <tbody>
            {result.data.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-muted">
                  {dict.emptyState}
                </td>
              </tr>
            )}
            {result.data.map((employee) => (
              <tr key={employee.id} className="border-t border-line">
                <td className="px-4 py-3 text-ink">{employee.name}</td>
                <td className="px-4 py-3 text-ink-muted">{employee.position}</td>
                <td className="px-4 py-3">
                  <StatusBadge
                    deletedAt={employee.deletedAt}
                    activeLabel={dict.statusActive}
                    inactiveLabel={dict.statusInactive}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/employees/${employee.id}/edit`}
                      className="text-sm font-medium text-primary-700 hover:underline"
                    >
                      {dict.editAction}
                    </Link>
                    <button
                      type="button"
                      disabled={isPending && togglingId === employee.id}
                      onClick={() => handleToggleStatus(employee.id, employee.deletedAt === null)}
                      className="text-sm font-medium text-primary-700 hover:underline disabled:opacity-50"
                    >
                      {employee.deletedAt === null ? dict.deactivateAction : dict.activateAction}
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
            onChange={(e) => navigate(1, statusFilter, Number(e.target.value), search)}
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
            onClick={() => navigate(page - 1, statusFilter, limit, search)}
            className="rounded-md border border-line bg-surface-card px-3 py-1.5 text-ink transition hover:bg-surface-row-header disabled:opacity-50"
          >
            {dict.previous}
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => navigate(page + 1, statusFilter, limit, search)}
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
