'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Dictionary } from '@/lib/i18n';
import { Toast, type ToastVariant } from '@/app/_components/Toast';
import {
  activateSchoolClass,
  createSchoolClass,
  deactivateSchoolClass,
  updateSchoolClass,
} from '../actions';
import type { EmployeeOption, SchoolClass, StatusFilter } from '../types';

interface SchoolClassFormClientProps {
  dict: Dictionary['schoolClasses'];
  schoolClass: SchoolClass | null;
  employees: EmployeeOption[];
}

const inputClass =
  'text-ink placeholder:text-ink-faint bg-surface-card rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition disabled:opacity-50';
const labelClass = 'text-sm font-medium text-ink-muted';

export default function SchoolClassFormClient({
  dict,
  schoolClass,
  employees,
}: SchoolClassFormClientProps) {
  const router = useRouter();
  const isEdit = schoolClass !== null;

  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(schoolClass?.name ?? '');
  const [schoolYear, setSchoolYear] = useState(
    schoolClass ? String(schoolClass.schoolYear) : String(new Date().getFullYear()),
  );
  const [maxCapacity, setMaxCapacity] = useState(
    schoolClass ? String(schoolClass.maxCapacity) : '',
  );
  const [teacherId, setTeacherId] = useState(schoolClass?.teacherId ?? '');
  const [assistantId, setAssistantId] = useState(schoolClass?.assistantId ?? '');

  const initialStatus: StatusFilter = schoolClass?.deletedAt ? 'INACTIVE' : 'ACTIVE';
  const [status, setStatus] = useState<StatusFilter>(initialStatus);

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

    if (!name.trim()) {
      showToast(dict.errorNameRequired, 'error');
      return;
    }
    if (!schoolYear.trim()) {
      showToast(dict.errorSchoolYearRequired, 'error');
      return;
    }
    if (!maxCapacity.trim()) {
      showToast(dict.errorMaxCapacityRequired, 'error');
      return;
    }
    if (!teacherId) {
      showToast(dict.errorTeacherRequired, 'error');
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          name,
          schoolYear: Number(schoolYear),
          maxCapacity: Number(maxCapacity),
          teacherId,
          assistantId: assistantId || undefined,
        };

        if (isEdit) {
          await updateSchoolClass(schoolClass.id, payload);

          if (status !== initialStatus) {
            if (status === 'INACTIVE') {
              await deactivateSchoolClass(schoolClass.id);
            } else {
              await activateSchoolClass(schoolClass.id);
            }
          }

          showToast(dict.updateSuccess, 'success');
        } else {
          await createSchoolClass(payload);
          router.push('/school-classes');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : dict.errorFallback;
        showToast(msg, 'error');
      }
    });
  }

  return (
    <main className="flex flex-1 flex-col gap-4 bg-surface-page p-6">
      <h1 className="text-2xl font-semibold text-ink">
        {isEdit ? dict.formTitleEdit : dict.formTitleNew}
      </h1>

      <div className="rounded-xl border border-line bg-surface-card">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="name">
              {dict.fieldName}
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={dict.fieldNamePlaceholder}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="schoolYear">
              {dict.fieldSchoolYear}
            </label>
            <input
              id="schoolYear"
              type="number"
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="maxCapacity">
              {dict.fieldMaxCapacity}
            </label>
            <input
              id="maxCapacity"
              type="number"
              min={1}
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
              placeholder={dict.fieldMaxCapacityPlaceholder}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="teacherId">
              {dict.fieldTeacher}
            </label>
            <select
              id="teacherId"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className={inputClass}
            >
              <option value="">{dict.fieldTeacherPlaceholder}</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="assistantId">
              {dict.fieldAssistant}
            </label>
            <select
              id="assistantId"
              value={assistantId}
              onChange={(e) => setAssistantId(e.target.value)}
              className={inputClass}
            >
              <option value="">{dict.fieldAssistantPlaceholder}</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          {isEdit && (
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="status">
                {dict.fieldStatus}
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                className={inputClass}
              >
                <option value="ACTIVE">{dict.statusActive}</option>
                <option value="INACTIVE">{dict.statusInactive}</option>
              </select>
            </div>
          )}

          <div className="mt-2 flex gap-3 border-t border-line pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-btn-primary-bg text-btn-primary-ink px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {isPending ? dict.submitting : dict.submit}
            </button>
            <Link
              href="/school-classes"
              className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface-row-header"
            >
              {dict.cancel}
            </Link>
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
