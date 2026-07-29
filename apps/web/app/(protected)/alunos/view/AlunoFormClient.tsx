'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Dictionary } from '@/lib/i18n';
import { Toast, type ToastVariant } from '@/app/_components/Toast';
import { formatCPF, isValidCPF } from '@/lib/cpf';
import { formatTelefone, isValidTelefone } from '@/lib/phone';
import { isValidEmail } from '@/lib/email';
import {
  createAluno,
  createAutorizado,
  removeAutorizado,
  searchResponsaveis,
  updateAluno,
  updateAutorizado,
  updateResponsavel,
} from '../actions';
import type { Aluno, AutorizadoBusca, Responsavel, StatusAluno } from '../types';

type Tab = 'dados' | 'responsavel' | 'autorizados';
type ResponsavelMode = 'existing' | 'new';

interface AlunoFormClientProps {
  dict: Dictionary['alunos'];
  aluno: Aluno | null;
}

const inputClass =
  'text-ink placeholder:text-ink-faint bg-surface-card rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition disabled:opacity-50';
const labelClass = 'text-sm font-medium text-ink-muted';
const errorClass = 'text-xs text-badge-danger-ink';

export default function AlunoFormClient({ dict, aluno }: AlunoFormClientProps) {
  const router = useRouter();
  const isEdit = aluno !== null;

  const [activeTab, setActiveTab] = useState<Tab>('dados');
  const [isPending, startTransition] = useTransition();

  // Tab 1 — dados do aluno
  const [nome, setNome] = useState(aluno?.nome ?? '');
  const [dataNascimento, setDataNascimento] = useState(aluno?.dataNascimento.slice(0, 10) ?? '');
  const [fotoUrl, setFotoUrl] = useState(aluno?.fotoUrl ?? '');
  const [status, setStatus] = useState<StatusAluno>(aluno?.status ?? 'ATIVO');

  // Tab 2 — responsavel. In create mode, toggles between linking an existing one and
  // registering a new one. In edit mode there's no toggle — the linked responsavel's own
  // fields become directly editable (re-linking isn't supported by the API).
  const [responsavelMode, setResponsavelMode] = useState<ResponsavelMode>('existing');
  const [responsavelQuery, setResponsavelQuery] = useState('');
  const [responsavelResults, setResponsavelResults] = useState<Responsavel[]>([]);
  const [selectedResponsavel, setSelectedResponsavel] = useState<Responsavel | null>(null);

  const [respNome, setRespNome] = useState(aluno?.responsavel?.nome ?? '');
  const [respCpf, setRespCpf] = useState(
    aluno?.responsavel ? formatCPF(aluno.responsavel.cpf) : '',
  );
  const [respTelefone, setRespTelefone] = useState(
    aluno?.responsavel?.telefone ? formatTelefone(aluno.responsavel.telefone) : '',
  );
  const [respEmail, setRespEmail] = useState(aluno?.responsavel?.email ?? '');

  const [respCpfError, setRespCpfError] = useState<string | null>(null);
  const [respEmailError, setRespEmailError] = useState<string | null>(null);
  const [respTelefoneError, setRespTelefoneError] = useState<string | null>(null);

  // True when the nome/cpf/telefone/email inputs (not the "search existing" picker) are the
  // ones in play — create's "new responsavel" mode, or edit mode (always editable there).
  const respFieldsActive = isEdit || responsavelMode === 'new';
  const respHasBlockingErrors =
    respFieldsActive && Boolean(respCpfError || respEmailError || respTelefoneError);

  // Tab 3 — autorizados a buscar (edit mode only)
  const [autorizados, setAutorizados] = useState<AutorizadoBusca[]>(aluno?.autorizadosBusca ?? []);
  const [novoAutorizadoNome, setNovoAutorizadoNome] = useState('');
  const [novoAutorizadoParentesco, setNovoAutorizadoParentesco] = useState('');
  const [novoAutorizadoTelefone, setNovoAutorizadoTelefone] = useState('');
  const [novoAutorizadoTelefoneError, setNovoAutorizadoTelefoneError] = useState<string | null>(
    null,
  );

  const [editingAutorizadoId, setEditingAutorizadoId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editParentesco, setEditParentesco] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [editTelefoneError, setEditTelefoneError] = useState<string | null>(null);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<ToastVariant>('info');

  function showToast(message: string, variant: ToastVariant) {
    setToastMessage(message);
    setToastVariant(variant);
    setToastOpen(true);
  }

  // Debounced search for the "link existing responsible party" mode
  useEffect(() => {
    if (isEdit || responsavelMode !== 'existing' || !responsavelQuery.trim()) return;

    const timeout = setTimeout(() => {
      searchResponsaveis(responsavelQuery)
        .then(setResponsavelResults)
        .catch(() => setResponsavelResults([]));
    }, 300);

    return () => clearTimeout(timeout);
  }, [responsavelQuery, responsavelMode, isEdit]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!nome.trim()) {
      setActiveTab('dados');
      showToast(dict.errorNomeRequired, 'error');
      return;
    }

    if (!dataNascimento) {
      setActiveTab('dados');
      showToast(dict.errorDataNascimentoRequired, 'error');
      return;
    }

    if (respFieldsActive) {
      if (!respNome.trim()) {
        setActiveTab('responsavel');
        showToast(dict.errorResponsavelNomeRequired, 'error');
        return;
      }
      if (!isValidCPF(respCpf)) {
        setActiveTab('responsavel');
        setRespCpfError(dict.errorCpfInvalid);
        showToast(dict.errorCpfInvalid, 'error');
        return;
      }
      if (!isValidEmail(respEmail)) {
        setActiveTab('responsavel');
        setRespEmailError(dict.errorEmailInvalid);
        showToast(dict.errorEmailInvalid, 'error');
        return;
      }
      if (!isValidTelefone(respTelefone)) {
        setActiveTab('responsavel');
        setRespTelefoneError(dict.errorTelefoneInvalid);
        showToast(dict.errorTelefoneInvalid, 'error');
        return;
      }
    } else if (!isEdit && responsavelMode === 'existing' && !selectedResponsavel) {
      setActiveTab('responsavel');
      showToast(dict.errorResponsavelRequired, 'error');
      return;
    }

    startTransition(async () => {
      try {
        if (isEdit) {
          await updateAluno(aluno.id, {
            nome,
            dataNascimento,
            fotoUrl: fotoUrl.trim() || undefined,
            status,
          });

          const respResult = await updateResponsavel(aluno.responsavelId, {
            nome: respNome,
            cpf: respCpf,
            telefone: respTelefone.trim() || undefined,
            email: respEmail.trim() || undefined,
          });

          if (!respResult.ok) {
            if (respResult.status === 409) {
              setRespCpfError(respResult.message);
              setActiveTab('responsavel');
              return;
            }
            showToast(respResult.message, 'error');
            return;
          }

          showToast(dict.updateSuccess, 'success');
        } else {
          const created = await createAluno({
            nome,
            dataNascimento,
            fotoUrl: fotoUrl.trim() || undefined,
            ...(responsavelMode === 'existing'
              ? { responsavelId: selectedResponsavel!.id }
              : {
                  responsavel: {
                    nome: respNome,
                    cpf: respCpf,
                    telefone: respTelefone.trim() || undefined,
                    email: respEmail.trim() || undefined,
                  },
                }),
          });
          router.push(`/alunos/${created.id}/editar`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : dict.errorFallback;
        showToast(msg, 'error');
      }
    });
  }

  function handleAddAutorizado() {
    if (!aluno) return;

    if (!novoAutorizadoNome.trim()) {
      showToast(dict.errorNomeRequired, 'error');
      return;
    }
    if (!novoAutorizadoParentesco.trim()) {
      showToast(dict.errorParentescoRequired, 'error');
      return;
    }
    if (!isValidTelefone(novoAutorizadoTelefone)) {
      setNovoAutorizadoTelefoneError(dict.errorTelefoneInvalid);
      return;
    }

    startTransition(async () => {
      try {
        const created = await createAutorizado(aluno.id, {
          nome: novoAutorizadoNome,
          parentesco: novoAutorizadoParentesco,
          telefone: novoAutorizadoTelefone.trim() || undefined,
        });
        setAutorizados((prev) => [...prev, created]);
        setNovoAutorizadoNome('');
        setNovoAutorizadoParentesco('');
        setNovoAutorizadoTelefone('');
        showToast(dict.autorizadoAddSuccess, 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : dict.autorizadoErrorFallback;
        showToast(msg, 'error');
      }
    });
  }

  function handleRemoveAutorizado(autorizadoId: string) {
    if (!aluno) return;

    startTransition(async () => {
      try {
        await removeAutorizado(aluno.id, autorizadoId);
        setAutorizados((prev) => prev.filter((a) => a.id !== autorizadoId));
        showToast(dict.autorizadoRemoveSuccess, 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : dict.autorizadoErrorFallback;
        showToast(msg, 'error');
      }
    });
  }

  function startEditAutorizado(a: AutorizadoBusca) {
    setEditingAutorizadoId(a.id);
    setEditNome(a.nome);
    setEditParentesco(a.parentesco);
    setEditTelefone(a.telefone ? formatTelefone(a.telefone) : '');
    setEditTelefoneError(null);
  }

  function handleSaveAutorizado(autorizadoId: string) {
    if (!aluno) return;

    if (!editNome.trim()) {
      showToast(dict.errorNomeRequired, 'error');
      return;
    }
    if (!editParentesco.trim()) {
      showToast(dict.errorParentescoRequired, 'error');
      return;
    }
    if (!isValidTelefone(editTelefone)) {
      setEditTelefoneError(dict.errorTelefoneInvalid);
      return;
    }

    startTransition(async () => {
      try {
        const updated = await updateAutorizado(aluno.id, autorizadoId, {
          nome: editNome,
          parentesco: editParentesco,
          telefone: editTelefone.trim() || undefined,
        });
        setAutorizados((prev) => prev.map((a) => (a.id === autorizadoId ? updated : a)));
        setEditingAutorizadoId(null);
        showToast(dict.autorizadoUpdateSuccess, 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : dict.autorizadoErrorFallback;
        showToast(msg, 'error');
      }
    });
  }

  const tabs: { key: Tab; label: string; disabled?: boolean }[] = [
    { key: 'dados', label: dict.tabDados },
    { key: 'responsavel', label: dict.tabResponsavel },
    { key: 'autorizados', label: dict.tabAutorizados, disabled: !isEdit },
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
              title={tab.disabled ? dict.tabAutorizadosDisabled : undefined}
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
          {activeTab === 'dados' && (
            <div className="flex flex-col gap-4">
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
                <label className={labelClass} htmlFor="dataNascimento">
                  {dict.fieldDataNascimento}
                </label>
                <input
                  id="dataNascimento"
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass} htmlFor="fotoUrl">
                  {dict.fieldFotoUrl}
                </label>
                <input
                  id="fotoUrl"
                  value={fotoUrl}
                  onChange={(e) => setFotoUrl(e.target.value)}
                  placeholder={dict.fieldFotoUrlPlaceholder}
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
                    onChange={(e) => setStatus(e.target.value as StatusAluno)}
                    className={inputClass}
                  >
                    <option value="ATIVO">{dict.statusActive}</option>
                    <option value="INATIVO">{dict.statusInactive}</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {activeTab === 'responsavel' && (
            <div className="flex flex-col gap-4">
              {!isEdit && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setResponsavelMode('existing')}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      responsavelMode === 'existing'
                        ? 'border-primary-600 bg-badge-success-bg text-badge-success-ink'
                        : 'border-line text-ink-muted hover:text-ink'
                    }`}
                  >
                    {dict.responsavelModeExisting}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResponsavelMode('new')}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      responsavelMode === 'new'
                        ? 'border-primary-600 bg-badge-success-bg text-badge-success-ink'
                        : 'border-line text-ink-muted hover:text-ink'
                    }`}
                  >
                    {dict.responsavelModeNew}
                  </button>
                </div>
              )}

              {!isEdit && responsavelMode === 'existing' && (
                <div className="flex flex-col gap-2">
                  <label className={labelClass} htmlFor="responsavelSearch">
                    {dict.responsavelSearchLabel}
                  </label>

                  {selectedResponsavel ? (
                    <div className="flex items-center justify-between rounded-lg border border-line p-3">
                      <div className="flex flex-col">
                        <span className="text-sm text-ink-muted">
                          {dict.responsavelSelectedLabel}
                        </span>
                        <span className="text-sm font-medium text-ink">
                          {selectedResponsavel.nome}
                        </span>
                        <span className="text-xs text-ink-muted">
                          {formatCPF(selectedResponsavel.cpf)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedResponsavel(null)}
                        className="text-sm font-medium text-primary-700 hover:underline"
                      >
                        {dict.responsavelChangeButton}
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        id="responsavelSearch"
                        value={responsavelQuery}
                        onChange={(e) => setResponsavelQuery(e.target.value)}
                        placeholder={dict.responsavelSearchPlaceholder}
                        className={inputClass}
                      />
                      {responsavelQuery.trim() && (
                        <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
                          {responsavelResults.length === 0 && (
                            <li className="px-3 py-2 text-sm text-ink-muted">
                              {dict.responsavelSearchNoResults}
                            </li>
                          )}
                          {responsavelResults.map((r) => (
                            <li key={r.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedResponsavel(r);
                                  setResponsavelQuery('');
                                  setResponsavelResults([]);
                                }}
                                className="flex w-full flex-col px-3 py-2 text-left transition hover:bg-surface-row-header"
                              >
                                <span className="text-sm font-medium text-ink">{r.nome}</span>
                                <span className="text-xs text-ink-muted">{formatCPF(r.cpf)}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              )}

              {respFieldsActive && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className={labelClass} htmlFor="respNome">
                      {dict.fieldResponsavelNome}
                    </label>
                    <input
                      id="respNome"
                      value={respNome}
                      onChange={(e) => setRespNome(e.target.value)}
                      placeholder={dict.fieldNomePlaceholder}
                      className={inputClass}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className={labelClass} htmlFor="respCpf">
                      {dict.fieldCpf}
                    </label>
                    <input
                      id="respCpf"
                      value={respCpf}
                      onChange={(e) => {
                        setRespCpf(formatCPF(e.target.value));
                        setRespCpfError(null);
                      }}
                      onBlur={() =>
                        setRespCpfError(
                          respCpf.trim() && !isValidCPF(respCpf) ? dict.errorCpfInvalid : null,
                        )
                      }
                      placeholder={dict.fieldCpfPlaceholder}
                      maxLength={14}
                      className={inputClass}
                    />
                    {respCpfError && <span className={errorClass}>{respCpfError}</span>}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className={labelClass} htmlFor="respTelefone">
                      {dict.fieldTelefone}
                    </label>
                    <input
                      id="respTelefone"
                      value={respTelefone}
                      onChange={(e) => {
                        setRespTelefone(formatTelefone(e.target.value));
                        setRespTelefoneError(null);
                      }}
                      onBlur={() =>
                        setRespTelefoneError(
                          isValidTelefone(respTelefone) ? null : dict.errorTelefoneInvalid,
                        )
                      }
                      placeholder={dict.fieldTelefonePlaceholder}
                      maxLength={15}
                      className={inputClass}
                    />
                    {respTelefoneError && <span className={errorClass}>{respTelefoneError}</span>}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className={labelClass} htmlFor="respEmail">
                      {dict.fieldEmail}
                    </label>
                    <input
                      id="respEmail"
                      type="email"
                      value={respEmail}
                      onChange={(e) => {
                        setRespEmail(e.target.value);
                        setRespEmailError(null);
                      }}
                      onBlur={() =>
                        setRespEmailError(isValidEmail(respEmail) ? null : dict.errorEmailInvalid)
                      }
                      placeholder={dict.fieldEmailPlaceholder}
                      className={inputClass}
                    />
                    {respEmailError && <span className={errorClass}>{respEmailError}</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'autorizados' && isEdit && (
            <div className="flex flex-col gap-4">
              <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
                {autorizados.length === 0 && (
                  <li className="px-3 py-3 text-sm text-ink-muted">{dict.autorizadosEmpty}</li>
                )}
                {autorizados.map((a) =>
                  editingAutorizadoId === a.id ? (
                    <li
                      key={a.id}
                      className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-start"
                    >
                      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
                        <input
                          value={editNome}
                          onChange={(e) => setEditNome(e.target.value)}
                          placeholder={dict.fieldNomePlaceholder}
                          className={inputClass}
                        />
                        <input
                          value={editParentesco}
                          onChange={(e) => setEditParentesco(e.target.value)}
                          placeholder={dict.fieldParentescoPlaceholder}
                          className={inputClass}
                        />
                        <div className="flex flex-col gap-1">
                          <input
                            value={editTelefone}
                            onChange={(e) => {
                              setEditTelefone(formatTelefone(e.target.value));
                              setEditTelefoneError(null);
                            }}
                            onBlur={() =>
                              setEditTelefoneError(
                                isValidTelefone(editTelefone) ? null : dict.errorTelefoneInvalid,
                              )
                            }
                            placeholder={dict.fieldTelefonePlaceholder}
                            className={inputClass}
                          />
                          {editTelefoneError && (
                            <span className={errorClass}>{editTelefoneError}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          disabled={isPending || !!editTelefoneError}
                          onClick={() => handleSaveAutorizado(a.id)}
                          className="rounded-md bg-btn-primary-bg text-btn-primary-ink px-3 py-1.5 text-xs font-medium transition hover:opacity-90 disabled:opacity-50"
                        >
                          {dict.submit}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingAutorizadoId(null)}
                          className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-surface-row-header"
                        >
                          {dict.cancel}
                        </button>
                      </div>
                    </li>
                  ) : (
                    <li key={a.id} className="flex items-center justify-between px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-ink">{a.nome}</span>
                        <span className="text-xs text-ink-muted">
                          {a.parentesco}
                          {a.telefone ? ` · ${a.telefone}` : ''}
                        </span>
                      </div>
                      <div className="flex shrink-0 gap-3">
                        <button
                          type="button"
                          onClick={() => startEditAutorizado(a)}
                          className="text-sm font-medium text-primary-700 hover:underline"
                        >
                          {dict.editAction}
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleRemoveAutorizado(a.id)}
                          className="rounded-md bg-btn-danger-bg text-btn-danger-ink px-3 py-1.5 text-xs font-medium transition hover:opacity-90 disabled:opacity-50"
                        >
                          {dict.autorizadosRemoveButton}
                        </button>
                      </div>
                    </li>
                  ),
                )}
              </ul>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  value={novoAutorizadoNome}
                  onChange={(e) => setNovoAutorizadoNome(e.target.value)}
                  placeholder={dict.fieldNomePlaceholder}
                  className={inputClass}
                />
                <input
                  value={novoAutorizadoParentesco}
                  onChange={(e) => setNovoAutorizadoParentesco(e.target.value)}
                  placeholder={dict.fieldParentescoPlaceholder}
                  className={inputClass}
                />
                <div className="flex flex-col gap-1">
                  <input
                    value={novoAutorizadoTelefone}
                    onChange={(e) => {
                      setNovoAutorizadoTelefone(formatTelefone(e.target.value));
                      setNovoAutorizadoTelefoneError(null);
                    }}
                    onBlur={() =>
                      setNovoAutorizadoTelefoneError(
                        isValidTelefone(novoAutorizadoTelefone) ? null : dict.errorTelefoneInvalid,
                      )
                    }
                    placeholder={dict.fieldTelefonePlaceholder}
                    className={inputClass}
                  />
                  {novoAutorizadoTelefoneError && (
                    <span className={errorClass}>{novoAutorizadoTelefoneError}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                disabled={isPending || !!novoAutorizadoTelefoneError}
                onClick={handleAddAutorizado}
                className="self-start rounded-lg bg-btn-primary-bg text-btn-primary-ink px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
              >
                {dict.autorizadosAddButton}
              </button>
            </div>
          )}

          <div className="mt-2 flex gap-3 border-t border-line pt-4">
            <button
              type="submit"
              disabled={isPending || respHasBlockingErrors}
              className="rounded-lg bg-btn-primary-bg text-btn-primary-ink px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {isPending ? dict.submitting : dict.submit}
            </button>
            <Link
              href="/alunos"
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
