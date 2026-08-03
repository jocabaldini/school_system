'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Dictionary } from '@/lib/i18n';
import { Toast, type ToastVariant } from '@/app/_components/Toast';
import { formatCPF, isValidCPF } from '@/lib/cpf';
import { formatPhone, isValidPhone } from '@/lib/phone';
import { isValidEmail } from '@/lib/email';
import { activateEmployee, createEmployee, deactivateEmployee, updateEmployee } from '../actions';
import type { Employee, StatusFilter } from '../types';

interface EmployeeFormClientProps {
  dict: Dictionary['employees'];
  employee: Employee | null;
}

const inputClass =
  'text-ink placeholder:text-ink-faint bg-surface-card rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition disabled:opacity-50';
const labelClass = 'text-sm font-medium text-ink-muted';
const errorClass = 'text-xs text-badge-danger-ink';

export default function EmployeeFormClient({ dict, employee }: EmployeeFormClientProps) {
  const router = useRouter();
  const isEdit = employee !== null;

  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(employee?.name ?? '');
  const [position, setPosition] = useState(employee?.position ?? '');
  const [cpf, setCpf] = useState(employee?.cpf ? formatCPF(employee.cpf) : '');
  const [phone, setPhone] = useState(employee?.phone ? formatPhone(employee.phone) : '');
  const [email, setEmail] = useState(employee?.email ?? '');

  const initialStatus: StatusFilter = employee?.deletedAt ? 'INACTIVE' : 'ACTIVE';
  const [status, setStatus] = useState<StatusFilter>(initialStatus);

  const [cpfError, setCpfError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const hasBlockingErrors = Boolean(cpfError || emailError || phoneError);

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
    if (!position.trim()) {
      showToast(dict.errorPositionRequired, 'error');
      return;
    }
    if (cpf.trim() && !isValidCPF(cpf)) {
      setCpfError(dict.errorCpfInvalid);
      showToast(dict.errorCpfInvalid, 'error');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError(dict.errorEmailInvalid);
      showToast(dict.errorEmailInvalid, 'error');
      return;
    }
    if (!isValidPhone(phone)) {
      setPhoneError(dict.errorPhoneInvalid);
      showToast(dict.errorPhoneInvalid, 'error');
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          name,
          position,
          cpf: cpf.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
        };

        if (isEdit) {
          const result = await updateEmployee(employee.id, payload);
          if (!result.ok) {
            if (result.status === 409) {
              setCpfError(result.message);
              return;
            }
            showToast(result.message, 'error');
            return;
          }

          if (status !== initialStatus) {
            if (status === 'INACTIVE') {
              await deactivateEmployee(employee.id);
            } else {
              await activateEmployee(employee.id);
            }
          }

          showToast(dict.updateSuccess, 'success');
        } else {
          const result = await createEmployee(payload);
          if (!result.ok) {
            if (result.status === 409) {
              setCpfError(result.message);
              return;
            }
            showToast(result.message, 'error');
            return;
          }

          router.push('/employees');
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
            <label className={labelClass} htmlFor="position">
              {dict.fieldPosition}
            </label>
            <input
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder={dict.fieldPositionPlaceholder}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="cpf">
              {dict.fieldCpf}
            </label>
            <input
              id="cpf"
              value={cpf}
              onChange={(e) => {
                setCpf(formatCPF(e.target.value));
                setCpfError(null);
              }}
              onBlur={() =>
                setCpfError(cpf.trim() && !isValidCPF(cpf) ? dict.errorCpfInvalid : null)
              }
              placeholder={dict.fieldCpfPlaceholder}
              maxLength={14}
              className={inputClass}
            />
            {cpfError && <span className={errorClass}>{cpfError}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="phone">
              {dict.fieldPhone}
            </label>
            <input
              id="phone"
              value={phone}
              onChange={(e) => {
                setPhone(formatPhone(e.target.value));
                setPhoneError(null);
              }}
              onBlur={() => setPhoneError(isValidPhone(phone) ? null : dict.errorPhoneInvalid)}
              placeholder={dict.fieldPhonePlaceholder}
              maxLength={15}
              className={inputClass}
            />
            {phoneError && <span className={errorClass}>{phoneError}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="email">
              {dict.fieldEmail}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(null);
              }}
              onBlur={() => setEmailError(isValidEmail(email) ? null : dict.errorEmailInvalid)}
              placeholder={dict.fieldEmailPlaceholder}
              className={inputClass}
            />
            {emailError && <span className={errorClass}>{emailError}</span>}
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
              disabled={isPending || hasBlockingErrors}
              className="rounded-lg bg-btn-primary-bg text-btn-primary-ink px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {isPending ? dict.submitting : dict.submit}
            </button>
            <Link
              href="/employees"
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
