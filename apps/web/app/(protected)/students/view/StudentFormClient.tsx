'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Dictionary } from '@/lib/i18n';
import { Toast, type ToastVariant } from '@/app/_components/Toast';
import { formatCPF, isValidCPF } from '@/lib/cpf';
import { formatPhone, isValidPhone } from '@/lib/phone';
import { isValidEmail } from '@/lib/email';
import {
  activateStudent,
  createAuthorizedPickup,
  createStudent,
  deactivateStudent,
  removeAuthorizedPickup,
  searchGuardians,
  updateAuthorizedPickup,
  updateGuardian,
  updateStudent,
} from '../actions';
import type {
  AuthorizedPickup,
  Enrollment,
  Guardian,
  SchoolClassOption,
  StatusFilter,
  Student,
} from '../types';
import EnrollmentTab from './EnrollmentTab';

type Tab = 'data' | 'guardian' | 'authorizedPickups' | 'enrollment';
type GuardianMode = 'existing' | 'new';

interface StudentFormClientProps {
  dict: Dictionary['students'];
  student: Student | null;
  initialEnrollments?: Enrollment[];
  activeSchoolClasses?: SchoolClassOption[];
}

const inputClass =
  'text-ink placeholder:text-ink-faint bg-surface-card rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition disabled:opacity-50';
const labelClass = 'text-sm font-medium text-ink-muted';
const errorClass = 'text-xs text-badge-danger-ink';

export default function StudentFormClient({
  dict,
  student,
  initialEnrollments = [],
  activeSchoolClasses = [],
}: StudentFormClientProps) {
  const router = useRouter();
  const isEdit = student !== null;

  const [activeTab, setActiveTab] = useState<Tab>('data');
  const [isPending, startTransition] = useTransition();

  // Tab 1 — student data
  const [name, setName] = useState(student?.name ?? '');
  const [birthDate, setBirthDate] = useState(student?.birthDate.slice(0, 10) ?? '');
  const [photoUrl, setPhotoUrl] = useState(student?.photoUrl ?? '');
  const initialStatus: StatusFilter = student?.deletedAt ? 'INACTIVE' : 'ACTIVE';
  const [status, setStatus] = useState<StatusFilter>(initialStatus);

  // Tab 2 — guardian. In create mode, toggles between linking an existing one and
  // registering a new one. In edit mode there's no toggle — the linked guardian's own
  // fields become directly editable (re-linking isn't supported by the API).
  const [guardianMode, setGuardianMode] = useState<GuardianMode>('existing');
  const [guardianQuery, setGuardianQuery] = useState('');
  const [guardianResults, setGuardianResults] = useState<Guardian[]>([]);
  const [selectedGuardian, setSelectedGuardian] = useState<Guardian | null>(null);

  const [guardianName, setGuardianName] = useState(student?.guardian?.name ?? '');
  const [guardianCpf, setGuardianCpf] = useState(
    student?.guardian ? formatCPF(student.guardian.cpf) : '',
  );
  const [guardianPhone, setGuardianPhone] = useState(
    student?.guardian?.phone ? formatPhone(student.guardian.phone) : '',
  );
  const [guardianEmail, setGuardianEmail] = useState(student?.guardian?.email ?? '');

  const [guardianCpfError, setGuardianCpfError] = useState<string | null>(null);
  const [guardianEmailError, setGuardianEmailError] = useState<string | null>(null);
  const [guardianPhoneError, setGuardianPhoneError] = useState<string | null>(null);

  // True when the name/cpf/phone/email inputs (not the "search existing" picker) are the
  // ones in play — create's "new guardian" mode, or edit mode (always editable there).
  const guardianFieldsActive = isEdit || guardianMode === 'new';
  const guardianHasBlockingErrors =
    guardianFieldsActive && Boolean(guardianCpfError || guardianEmailError || guardianPhoneError);

  // Tab 3 — authorized pickups (edit mode only)
  const [authorizedPickups, setAuthorizedPickups] = useState<AuthorizedPickup[]>(
    student?.authorizedPickups ?? [],
  );
  const [newPickupName, setNewPickupName] = useState('');
  const [newPickupRelationship, setNewPickupRelationship] = useState('');
  const [newPickupPhone, setNewPickupPhone] = useState('');
  const [newPickupPhoneError, setNewPickupPhoneError] = useState<string | null>(null);

  const [editingPickupId, setEditingPickupId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRelationship, setEditRelationship] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPhoneError, setEditPhoneError] = useState<string | null>(null);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<ToastVariant>('info');

  function showToast(message: string, variant: ToastVariant) {
    setToastMessage(message);
    setToastVariant(variant);
    setToastOpen(true);
  }

  // Debounced search for the "link existing guardian" mode
  useEffect(() => {
    if (isEdit || guardianMode !== 'existing' || !guardianQuery.trim()) return;

    const timeout = setTimeout(() => {
      searchGuardians(guardianQuery)
        .then(setGuardianResults)
        .catch(() => setGuardianResults([]));
    }, 300);

    return () => clearTimeout(timeout);
  }, [guardianQuery, guardianMode, isEdit]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setActiveTab('data');
      showToast(dict.errorNameRequired, 'error');
      return;
    }

    if (!birthDate) {
      setActiveTab('data');
      showToast(dict.errorBirthDateRequired, 'error');
      return;
    }

    if (guardianFieldsActive) {
      if (!guardianName.trim()) {
        setActiveTab('guardian');
        showToast(dict.errorGuardianNameRequired, 'error');
        return;
      }
      if (!isValidCPF(guardianCpf)) {
        setActiveTab('guardian');
        setGuardianCpfError(dict.errorCpfInvalid);
        showToast(dict.errorCpfInvalid, 'error');
        return;
      }
      if (!isValidEmail(guardianEmail)) {
        setActiveTab('guardian');
        setGuardianEmailError(dict.errorEmailInvalid);
        showToast(dict.errorEmailInvalid, 'error');
        return;
      }
      if (!isValidPhone(guardianPhone)) {
        setActiveTab('guardian');
        setGuardianPhoneError(dict.errorPhoneInvalid);
        showToast(dict.errorPhoneInvalid, 'error');
        return;
      }
    } else if (!isEdit && guardianMode === 'existing' && !selectedGuardian) {
      setActiveTab('guardian');
      showToast(dict.errorGuardianRequired, 'error');
      return;
    }

    startTransition(async () => {
      try {
        if (isEdit) {
          await updateStudent(student.id, {
            name,
            birthDate,
            photoUrl: photoUrl.trim() || undefined,
          });

          if (status !== initialStatus) {
            if (status === 'INACTIVE') {
              await deactivateStudent(student.id);
            } else {
              await activateStudent(student.id);
            }
          }

          const guardianResult = await updateGuardian(student.guardianId, {
            name: guardianName,
            cpf: guardianCpf,
            phone: guardianPhone.trim() || undefined,
            email: guardianEmail.trim() || undefined,
          });

          if (!guardianResult.ok) {
            if (guardianResult.status === 409) {
              setGuardianCpfError(guardianResult.message);
              setActiveTab('guardian');
              return;
            }
            showToast(guardianResult.message, 'error');
            return;
          }

          showToast(dict.updateSuccess, 'success');
        } else {
          const created = await createStudent({
            name,
            birthDate,
            photoUrl: photoUrl.trim() || undefined,
            ...(guardianMode === 'existing'
              ? { guardianId: selectedGuardian!.id }
              : {
                  guardian: {
                    name: guardianName,
                    cpf: guardianCpf,
                    phone: guardianPhone.trim() || undefined,
                    email: guardianEmail.trim() || undefined,
                  },
                }),
          });
          router.push(`/students/${created.id}/edit`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : dict.errorFallback;
        showToast(msg, 'error');
      }
    });
  }

  function handleAddPickup() {
    if (!student) return;

    if (!newPickupName.trim()) {
      showToast(dict.errorNameRequired, 'error');
      return;
    }
    if (!newPickupRelationship.trim()) {
      showToast(dict.errorRelationshipRequired, 'error');
      return;
    }
    if (!isValidPhone(newPickupPhone)) {
      setNewPickupPhoneError(dict.errorPhoneInvalid);
      return;
    }

    startTransition(async () => {
      try {
        const created = await createAuthorizedPickup(student.id, {
          name: newPickupName,
          relationship: newPickupRelationship,
          phone: newPickupPhone.trim() || undefined,
        });
        setAuthorizedPickups((prev) => [...prev, created]);
        setNewPickupName('');
        setNewPickupRelationship('');
        setNewPickupPhone('');
        showToast(dict.authorizedPickupAddSuccess, 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : dict.authorizedPickupErrorFallback;
        showToast(msg, 'error');
      }
    });
  }

  function handleRemovePickup(pickupId: string) {
    if (!student) return;

    startTransition(async () => {
      try {
        await removeAuthorizedPickup(student.id, pickupId);
        setAuthorizedPickups((prev) => prev.filter((p) => p.id !== pickupId));
        showToast(dict.authorizedPickupRemoveSuccess, 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : dict.authorizedPickupErrorFallback;
        showToast(msg, 'error');
      }
    });
  }

  function startEditPickup(pickup: AuthorizedPickup) {
    setEditingPickupId(pickup.id);
    setEditName(pickup.name);
    setEditRelationship(pickup.relationship);
    setEditPhone(pickup.phone ? formatPhone(pickup.phone) : '');
    setEditPhoneError(null);
  }

  function handleSavePickup(pickupId: string) {
    if (!student) return;

    if (!editName.trim()) {
      showToast(dict.errorNameRequired, 'error');
      return;
    }
    if (!editRelationship.trim()) {
      showToast(dict.errorRelationshipRequired, 'error');
      return;
    }
    if (!isValidPhone(editPhone)) {
      setEditPhoneError(dict.errorPhoneInvalid);
      return;
    }

    startTransition(async () => {
      try {
        const updated = await updateAuthorizedPickup(student.id, pickupId, {
          name: editName,
          relationship: editRelationship,
          phone: editPhone.trim() || undefined,
        });
        setAuthorizedPickups((prev) => prev.map((p) => (p.id === pickupId ? updated : p)));
        setEditingPickupId(null);
        showToast(dict.authorizedPickupUpdateSuccess, 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : dict.authorizedPickupErrorFallback;
        showToast(msg, 'error');
      }
    });
  }

  const tabs: { key: Tab; label: string; disabled?: boolean; disabledMessage?: string }[] = [
    { key: 'data', label: dict.tabData },
    { key: 'guardian', label: dict.tabGuardian },
    {
      key: 'authorizedPickups',
      label: dict.tabAuthorizedPickups,
      disabled: !isEdit,
      disabledMessage: dict.tabAuthorizedPickupsDisabled,
    },
    {
      key: 'enrollment',
      label: dict.tabEnrollment,
      disabled: !isEdit,
      disabledMessage: dict.tabEnrollmentDisabled,
    },
  ];

  return (
    <main className="flex flex-1 flex-col gap-4 bg-surface-page p-6">
      <h1 className="text-2xl font-semibold text-ink">
        {isEdit ? dict.formTitleEdit : dict.formTitleNew}
      </h1>

      <div className="rounded-xl border border-line bg-surface-card">
        <div className="flex border-b border-line px-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              disabled={tab.disabled}
              onClick={() => setActiveTab(tab.key)}
              title={tab.disabled ? tab.disabledMessage : undefined}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                activeTab === tab.key
                  ? 'border-primary-600 text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          {activeTab === 'data' && (
            <div className="flex flex-col gap-4">
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
                <label className={labelClass} htmlFor="birthDate">
                  {dict.fieldBirthDate}
                </label>
                <input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass} htmlFor="photoUrl">
                  {dict.fieldPhotoUrl}
                </label>
                <input
                  id="photoUrl"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder={dict.fieldPhotoUrlPlaceholder}
                  className={inputClass}
                />
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
            </div>
          )}

          {activeTab === 'guardian' && (
            <div className="flex flex-col gap-4">
              {!isEdit && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setGuardianMode('existing')}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      guardianMode === 'existing'
                        ? 'border-primary-600 bg-badge-success-bg text-badge-success-ink'
                        : 'border-line text-ink-muted hover:text-ink'
                    }`}
                  >
                    {dict.guardianModeExisting}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuardianMode('new')}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      guardianMode === 'new'
                        ? 'border-primary-600 bg-badge-success-bg text-badge-success-ink'
                        : 'border-line text-ink-muted hover:text-ink'
                    }`}
                  >
                    {dict.guardianModeNew}
                  </button>
                </div>
              )}

              {!isEdit && guardianMode === 'existing' && (
                <div className="flex flex-col gap-2">
                  <label className={labelClass} htmlFor="guardianSearch">
                    {dict.guardianSearchLabel}
                  </label>

                  {selectedGuardian ? (
                    <div className="flex items-center justify-between rounded-lg border border-line p-3">
                      <div className="flex flex-col">
                        <span className="text-sm text-ink-muted">{dict.guardianSelectedLabel}</span>
                        <span className="text-sm font-medium text-ink">
                          {selectedGuardian.name}
                        </span>
                        <span className="text-xs text-ink-muted">
                          {formatCPF(selectedGuardian.cpf)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedGuardian(null)}
                        className="text-sm font-medium text-primary-700 hover:underline"
                      >
                        {dict.guardianChangeButton}
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        id="guardianSearch"
                        value={guardianQuery}
                        onChange={(e) => setGuardianQuery(e.target.value)}
                        placeholder={dict.guardianSearchPlaceholder}
                        className={inputClass}
                      />
                      {guardianQuery.trim() && (
                        <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
                          {guardianResults.length === 0 && (
                            <li className="px-3 py-2 text-sm text-ink-muted">
                              {dict.guardianSearchNoResults}
                            </li>
                          )}
                          {guardianResults.map((g) => (
                            <li key={g.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedGuardian(g);
                                  setGuardianQuery('');
                                  setGuardianResults([]);
                                }}
                                className="flex w-full flex-col px-3 py-2 text-left transition hover:bg-surface-row-header"
                              >
                                <span className="text-sm font-medium text-ink">{g.name}</span>
                                <span className="text-xs text-ink-muted">{formatCPF(g.cpf)}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              )}

              {guardianFieldsActive && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className={labelClass} htmlFor="guardianName">
                      {dict.fieldGuardianName}
                    </label>
                    <input
                      id="guardianName"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      placeholder={dict.fieldNamePlaceholder}
                      className={inputClass}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className={labelClass} htmlFor="guardianCpf">
                      {dict.fieldCpf}
                    </label>
                    <input
                      id="guardianCpf"
                      value={guardianCpf}
                      onChange={(e) => {
                        setGuardianCpf(formatCPF(e.target.value));
                        setGuardianCpfError(null);
                      }}
                      onBlur={() =>
                        setGuardianCpfError(
                          guardianCpf.trim() && !isValidCPF(guardianCpf)
                            ? dict.errorCpfInvalid
                            : null,
                        )
                      }
                      placeholder={dict.fieldCpfPlaceholder}
                      maxLength={14}
                      className={inputClass}
                    />
                    {guardianCpfError && <span className={errorClass}>{guardianCpfError}</span>}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className={labelClass} htmlFor="guardianPhone">
                      {dict.fieldPhone}
                    </label>
                    <input
                      id="guardianPhone"
                      value={guardianPhone}
                      onChange={(e) => {
                        setGuardianPhone(formatPhone(e.target.value));
                        setGuardianPhoneError(null);
                      }}
                      onBlur={() =>
                        setGuardianPhoneError(
                          isValidPhone(guardianPhone) ? null : dict.errorPhoneInvalid,
                        )
                      }
                      placeholder={dict.fieldPhonePlaceholder}
                      maxLength={15}
                      className={inputClass}
                    />
                    {guardianPhoneError && <span className={errorClass}>{guardianPhoneError}</span>}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className={labelClass} htmlFor="guardianEmail">
                      {dict.fieldEmail}
                    </label>
                    <input
                      id="guardianEmail"
                      type="email"
                      value={guardianEmail}
                      onChange={(e) => {
                        setGuardianEmail(e.target.value);
                        setGuardianEmailError(null);
                      }}
                      onBlur={() =>
                        setGuardianEmailError(
                          isValidEmail(guardianEmail) ? null : dict.errorEmailInvalid,
                        )
                      }
                      placeholder={dict.fieldEmailPlaceholder}
                      className={inputClass}
                    />
                    {guardianEmailError && <span className={errorClass}>{guardianEmailError}</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'authorizedPickups' && isEdit && (
            <div className="flex flex-col gap-4">
              <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
                {authorizedPickups.length === 0 && (
                  <li className="px-3 py-3 text-sm text-ink-muted">
                    {dict.authorizedPickupsEmpty}
                  </li>
                )}
                {authorizedPickups.map((pickup) =>
                  editingPickupId === pickup.id ? (
                    <li
                      key={pickup.id}
                      className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-start"
                    >
                      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder={dict.fieldNamePlaceholder}
                          className={inputClass}
                        />
                        <input
                          value={editRelationship}
                          onChange={(e) => setEditRelationship(e.target.value)}
                          placeholder={dict.fieldRelationshipPlaceholder}
                          className={inputClass}
                        />
                        <div className="flex flex-col gap-1">
                          <input
                            value={editPhone}
                            onChange={(e) => {
                              setEditPhone(formatPhone(e.target.value));
                              setEditPhoneError(null);
                            }}
                            onBlur={() =>
                              setEditPhoneError(
                                isValidPhone(editPhone) ? null : dict.errorPhoneInvalid,
                              )
                            }
                            placeholder={dict.fieldPhonePlaceholder}
                            className={inputClass}
                          />
                          {editPhoneError && <span className={errorClass}>{editPhoneError}</span>}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          disabled={isPending || !!editPhoneError}
                          onClick={() => handleSavePickup(pickup.id)}
                          className="rounded-md bg-btn-primary-bg text-btn-primary-ink px-3 py-1.5 text-xs font-medium transition hover:opacity-90 disabled:opacity-50"
                        >
                          {dict.submit}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPickupId(null)}
                          className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-surface-row-header"
                        >
                          {dict.cancel}
                        </button>
                      </div>
                    </li>
                  ) : (
                    <li key={pickup.id} className="flex items-center justify-between px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-ink">{pickup.name}</span>
                        <span className="text-xs text-ink-muted">
                          {pickup.relationship}
                          {pickup.phone ? ` · ${pickup.phone}` : ''}
                        </span>
                      </div>
                      <div className="flex shrink-0 gap-3">
                        <button
                          type="button"
                          onClick={() => startEditPickup(pickup)}
                          className="text-sm font-medium text-primary-700 hover:underline"
                        >
                          {dict.editAction}
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleRemovePickup(pickup.id)}
                          className="rounded-md bg-btn-danger-bg text-btn-danger-ink px-3 py-1.5 text-xs font-medium transition hover:opacity-90 disabled:opacity-50"
                        >
                          {dict.authorizedPickupsRemoveButton}
                        </button>
                      </div>
                    </li>
                  ),
                )}
              </ul>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  value={newPickupName}
                  onChange={(e) => setNewPickupName(e.target.value)}
                  placeholder={dict.fieldNamePlaceholder}
                  className={inputClass}
                />
                <input
                  value={newPickupRelationship}
                  onChange={(e) => setNewPickupRelationship(e.target.value)}
                  placeholder={dict.fieldRelationshipPlaceholder}
                  className={inputClass}
                />
                <div className="flex flex-col gap-1">
                  <input
                    value={newPickupPhone}
                    onChange={(e) => {
                      setNewPickupPhone(formatPhone(e.target.value));
                      setNewPickupPhoneError(null);
                    }}
                    onBlur={() =>
                      setNewPickupPhoneError(
                        isValidPhone(newPickupPhone) ? null : dict.errorPhoneInvalid,
                      )
                    }
                    placeholder={dict.fieldPhonePlaceholder}
                    className={inputClass}
                  />
                  {newPickupPhoneError && <span className={errorClass}>{newPickupPhoneError}</span>}
                </div>
              </div>
              <button
                type="button"
                disabled={isPending || !!newPickupPhoneError}
                onClick={handleAddPickup}
                className="self-start rounded-lg bg-btn-primary-bg text-btn-primary-ink px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
              >
                {dict.authorizedPickupsAddButton}
              </button>
            </div>
          )}

          {activeTab === 'enrollment' && isEdit && (
            <EnrollmentTab
              dict={dict}
              studentId={student.id}
              initialEnrollments={initialEnrollments}
              activeSchoolClasses={activeSchoolClasses}
              showToast={showToast}
            />
          )}

          <div className="mt-2 flex gap-3 border-t border-line pt-4">
            <button
              type="submit"
              disabled={isPending || guardianHasBlockingErrors}
              className="rounded-lg bg-btn-primary-bg text-btn-primary-ink px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {isPending ? dict.submitting : dict.submit}
            </button>
            <Link
              href="/students"
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
