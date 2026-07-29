'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Dictionary } from '@/lib/i18n';
import { Toast, type ToastVariant } from '@/app/_components/Toast';
import { formatCPF, isValidCPF } from '@/lib/cpf';
import { formatTelefone, isValidTelefone } from '@/lib/phone';
import { isValidEmail } from '@/lib/email';
import {
  activateFuncionario,
  createFuncionario,
  deactivateFuncionario,
  updateFuncionario,
} from '../actions';
import type { Funcionario, StatusFilter } from '../types';

interface FuncionarioFormClientProps {
  dict: Dictionary['funcionarios'];
  funcionario: Funcionario | null;
}

const inputClass =
  'text-ink placeholder:text-ink-faint bg-surface-card rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition disabled:opacity-50';
const labelClass = 'text-sm font-medium text-ink-muted';
const errorClass = 'text-xs text-badge-danger-ink';

export default function FuncionarioFormClient({ dict, funcionario }: FuncionarioFormClientProps) {
  const router = useRouter();
  const isEdit = funcionario !== null;

  const [isPending, startTransition] = useTransition();

  const [nome, setNome] = useState(funcionario?.nome ?? '');
  const [cargo, setCargo] = useState(funcionario?.cargo ?? '');
  const [cpf, setCpf] = useState(funcionario?.cpf ? formatCPF(funcionario.cpf) : '');
  const [telefone, setTelefone] = useState(
    funcionario?.telefone ? formatTelefone(funcionario.telefone) : '',
  );
  const [email, setEmail] = useState(funcionario?.email ?? '');

  const initialStatus: StatusFilter = funcionario?.deletedAt ? 'INATIVO' : 'ATIVO';
  const [status, setStatus] = useState<StatusFilter>(initialStatus);

  const [cpfError, setCpfError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [telefoneError, setTelefoneError] = useState<string | null>(null);

  const hasBlockingErrors = Boolean(cpfError || emailError || telefoneError);

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

    if (!nome.trim()) {
      showToast(dict.errorNomeRequired, 'error');
      return;
    }
    if (!cargo.trim()) {
      showToast(dict.errorCargoRequired, 'error');
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
    if (!isValidTelefone(telefone)) {
      setTelefoneError(dict.errorTelefoneInvalid);
      showToast(dict.errorTelefoneInvalid, 'error');
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          nome,
          cargo,
          cpf: cpf.trim() || undefined,
          telefone: telefone.trim() || undefined,
          email: email.trim() || undefined,
        };

        if (isEdit) {
          const result = await updateFuncionario(funcionario.id, payload);
          if (!result.ok) {
            if (result.status === 409) {
              setCpfError(result.message);
              return;
            }
            showToast(result.message, 'error');
            return;
          }

          if (status !== initialStatus) {
            if (status === 'INATIVO') {
              await deactivateFuncionario(funcionario.id);
            } else {
              await activateFuncionario(funcionario.id);
            }
          }

          showToast(dict.updateSuccess, 'success');
        } else {
          const result = await createFuncionario(payload);
          if (!result.ok) {
            if (result.status === 409) {
              setCpfError(result.message);
              return;
            }
            showToast(result.message, 'error');
            return;
          }

          router.push('/funcionarios');
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
            <label className={labelClass} htmlFor="nome">
              {dict.fieldNome}
            </label>
            <input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder={dict.fieldNomePlaceholder}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="cargo">
              {dict.fieldCargo}
            </label>
            <input
              id="cargo"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder={dict.fieldCargoPlaceholder}
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
            <label className={labelClass} htmlFor="telefone">
              {dict.fieldTelefone}
            </label>
            <input
              id="telefone"
              value={telefone}
              onChange={(e) => {
                setTelefone(formatTelefone(e.target.value));
                setTelefoneError(null);
              }}
              onBlur={() =>
                setTelefoneError(isValidTelefone(telefone) ? null : dict.errorTelefoneInvalid)
              }
              placeholder={dict.fieldTelefonePlaceholder}
              maxLength={15}
              className={inputClass}
            />
            {telefoneError && <span className={errorClass}>{telefoneError}</span>}
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
                <option value="ATIVO">{dict.statusActive}</option>
                <option value="INATIVO">{dict.statusInactive}</option>
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
              href="/funcionarios"
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
