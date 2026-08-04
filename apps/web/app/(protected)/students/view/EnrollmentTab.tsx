'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import type { Dictionary } from '@/lib/i18n';
import type { ToastVariant } from '@/app/_components/Toast';
import { calculateEnrollment, createEnrollment, listEnrollments } from '../actions';
import type { CreateEnrollmentPayload, Enrollment, SchoolClassOption } from '../types';

interface EnrollmentTabProps {
  dict: Dictionary['students'];
  studentId: string;
  initialEnrollments: Enrollment[];
  activeSchoolClasses: SchoolClassOption[];
  showToast: (message: string, variant: ToastVariant) => void;
}

const inputClass =
  'text-ink placeholder:text-ink-faint bg-surface-card rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition disabled:opacity-50';
const labelClass = 'text-sm font-medium text-ink-muted';

function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

function formatAmount(value: string): string {
  return Number(value).toFixed(2);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function EnrollmentTab({
  dict,
  studentId,
  initialEnrollments,
  activeSchoolClasses,
  showToast,
}: EnrollmentTabProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>(initialEnrollments);
  const [formOpen, setFormOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [schoolClassId, setSchoolClassId] = useState('');
  const [fullTime, setFullTime] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [breakStart, setBreakStart] = useState('');
  const [breakEnd, setBreakEnd] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('0');
  const [startDate, setStartDate] = useState(todayIso());
  const [tuitionAmount, setTuitionAmount] = useState('');
  // The debounced calculation's `.then()` runs after an async gap, so a `useState` closure can
  // be stale by the time it resolves (e.g. the user edits the field while a request from an
  // earlier keystroke is still in flight). A ref is always current, so the check right before
  // overwriting the field can't race with the edit that's supposed to prevent it. Nothing in
  // the UI needs to react to this flag changing, so a ref alone (no parallel state) is enough.
  const tuitionAmountTouchedRef = useRef(false);
  const [suggestedAmount, setSuggestedAmount] = useState<number | null>(null);

  const activeEnrollment = enrollments.find((e) => e.endDate === null) ?? null;
  const history = enrollments.filter((e) => e.endDate !== null);

  const effectiveBreakStart = fullTime ? undefined : breakStart || undefined;
  const effectiveBreakEnd = fullTime ? undefined : breakEnd || undefined;

  // Debounced suggested-amount calculation as the schedule fields change
  useEffect(() => {
    if (!formOpen || !startTime || !endTime) return;

    const timeout = setTimeout(() => {
      calculateEnrollment({
        startTime,
        endTime,
        breakStart: effectiveBreakStart,
        breakEnd: effectiveBreakEnd,
        discountPercentage: discountPercentage.trim() ? Number(discountPercentage) : undefined,
      })
        .then((result) => {
          setSuggestedAmount(result.suggestedAmount);
          if (!tuitionAmountTouchedRef.current) {
            setTuitionAmount(result.suggestedAmount.toFixed(2));
          }
        })
        .catch(() => {
          // Suggested amount is a convenience — a failed calc just leaves it blank.
        });
    }, 300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formOpen, startTime, endTime, fullTime, breakStart, breakEnd, discountPercentage]);

  function resetForm() {
    setSchoolClassId('');
    setFullTime(false);
    setStartTime('');
    setEndTime('');
    setBreakStart('');
    setBreakEnd('');
    setDiscountPercentage('0');
    setStartDate(todayIso());
    setTuitionAmount('');
    tuitionAmountTouchedRef.current = false;
    setSuggestedAmount(null);
  }

  function handleSchoolClassChange(value: string) {
    setSchoolClassId(value);
    // A different class means a fresh base calculation conceptually — re-enable auto-fill and,
    // if a suggestion is already on screen, snap the field to it right away rather than waiting
    // for the user to also touch a schedule field before it catches up.
    tuitionAmountTouchedRef.current = false;
    if (suggestedAmount !== null) {
      setTuitionAmount(suggestedAmount.toFixed(2));
    }
  }

  function useSuggestedAmount() {
    if (suggestedAmount === null) return;
    tuitionAmountTouchedRef.current = false;
    setTuitionAmount(suggestedAmount.toFixed(2));
  }

  function openForm() {
    resetForm();
    setFormOpen(true);
  }

  function handleSubmit() {
    if (!schoolClassId) {
      showToast(dict.errorSchoolClassRequired, 'error');
      return;
    }
    if (!startTime) {
      showToast(dict.errorStartTimeRequired, 'error');
      return;
    }
    if (!endTime) {
      showToast(dict.errorEndTimeRequired, 'error');
      return;
    }
    if (!tuitionAmount.trim()) {
      showToast(dict.errorTuitionAmountRequired, 'error');
      return;
    }

    const payload: CreateEnrollmentPayload = {
      schoolClassId,
      startTime,
      endTime,
      breakStart: effectiveBreakStart,
      breakEnd: effectiveBreakEnd,
      discountPercentage: discountPercentage.trim() ? Number(discountPercentage) : undefined,
      tuitionAmount: Number(tuitionAmount),
      startDate,
    };

    startTransition(async () => {
      try {
        await createEnrollment(studentId, payload);
        const refreshed = await listEnrollments(studentId);
        setEnrollments(refreshed);
        setFormOpen(false);
        showToast(activeEnrollment ? dict.transferSuccess : dict.enrollSuccess, 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : dict.enrollmentErrorFallback;
        showToast(msg, 'error');
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {activeEnrollment && (
        <div className="flex flex-col gap-2">
          <span className={labelClass}>{dict.currentEnrollmentLabel}</span>
          <div className="rounded-lg border border-line p-3 text-sm">
            <div className="font-medium text-ink">
              {activeEnrollment.schoolClass?.name}
              {activeEnrollment.schoolClass ? ` (${activeEnrollment.schoolClass.schoolYear})` : ''}
            </div>
            <div className="text-ink-muted">
              {formatTime(activeEnrollment.startTime)} – {formatTime(activeEnrollment.endTime)}
            </div>
            <div className="text-ink-muted">{formatAmount(activeEnrollment.tuitionAmount)}</div>
            <div className="text-ink-muted">{activeEnrollment.startDate.slice(0, 10)}</div>
          </div>
        </div>
      )}

      {!formOpen && (
        <button
          type="button"
          onClick={openForm}
          className="self-start rounded-lg bg-btn-primary-bg text-btn-primary-ink px-4 py-2 text-sm font-medium hover:opacity-90 transition"
        >
          {activeEnrollment ? dict.transferButton : dict.enrollButton}
        </button>
      )}

      {formOpen && (
        // Not a <form> — this block already lives inside StudentFormClient's own <form>, and
        // HTML forbids nesting them (browsers handle it inconsistently, which is what silently
        // broke the submit here before). The submit button below calls handleSubmit directly.
        <div className="flex flex-col gap-4 rounded-lg border border-line p-4">
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="enrollmentSchoolClass">
              {dict.fieldSchoolClass}
            </label>
            <select
              id="enrollmentSchoolClass"
              value={schoolClassId}
              onChange={(e) => handleSchoolClassChange(e.target.value)}
              className={inputClass}
            >
              <option value="">{dict.fieldSchoolClassPlaceholder}</option>
              {activeSchoolClasses.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.name} ({schoolClass.schoolYear})
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={fullTime}
              onChange={(e) => setFullTime(e.target.checked)}
            />
            {dict.fieldFullTime}
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="enrollmentStartTime">
                {dict.fieldStartTime}
              </label>
              <input
                id="enrollmentStartTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="enrollmentEndTime">
                {dict.fieldEndTime}
              </label>
              <input
                id="enrollmentEndTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {!fullTime && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className={labelClass} htmlFor="enrollmentBreakStart">
                  {dict.fieldBreakStart}
                </label>
                <input
                  id="enrollmentBreakStart"
                  type="time"
                  value={breakStart}
                  onChange={(e) => setBreakStart(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass} htmlFor="enrollmentBreakEnd">
                  {dict.fieldBreakEnd}
                </label>
                <input
                  id="enrollmentBreakEnd"
                  type="time"
                  value={breakEnd}
                  onChange={(e) => setBreakEnd(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="enrollmentStartDate">
                {dict.fieldStartDate}
              </label>
              <input
                id="enrollmentStartDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="enrollmentDiscount">
                {dict.fieldDiscountPercentage}
              </label>
              <input
                id="enrollmentDiscount"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="enrollmentTuitionAmount">
              {dict.fieldTuitionAmount}
            </label>
            {suggestedAmount !== null && (
              <span className="text-xs text-ink-muted">
                {dict.suggestedAmountLabel}: {suggestedAmount.toFixed(2)}{' '}
                <button
                  type="button"
                  onClick={useSuggestedAmount}
                  className="font-medium text-primary-700 hover:underline"
                >
                  {dict.useSuggestedAmountButton}
                </button>
              </span>
            )}
            <input
              id="enrollmentTuitionAmount"
              type="number"
              min={0}
              step="0.01"
              value={tuitionAmount}
              onChange={(e) => {
                setTuitionAmount(e.target.value);
                tuitionAmountTouchedRef.current = true;
              }}
              className={inputClass}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={handleSubmit}
              className="rounded-lg bg-btn-primary-bg text-btn-primary-ink px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {isPending ? dict.submitting : dict.submit}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface-row-header"
            >
              {dict.cancel}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className={labelClass}>{dict.enrollmentHistoryTitle}</span>
        {history.length === 0 ? (
          <p className="text-sm text-ink-muted">{dict.enrollmentHistoryEmpty}</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-row-header text-ink-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">{dict.columnClass}</th>
                  <th className="px-3 py-2 font-medium">{dict.columnPeriod}</th>
                  <th className="px-3 py-2 font-medium">{dict.columnAmount}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((enrollment) => (
                  <tr key={enrollment.id} className="border-t border-line">
                    <td className="px-3 py-2 text-ink">{enrollment.schoolClass?.name}</td>
                    <td className="px-3 py-2 text-ink-muted">
                      {enrollment.startDate.slice(0, 10)} –{' '}
                      {enrollment.endDate ? enrollment.endDate.slice(0, 10) : ''}
                    </td>
                    <td className="px-3 py-2 text-ink-muted">
                      {formatAmount(enrollment.tuitionAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
