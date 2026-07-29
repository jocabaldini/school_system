'use server';

import { getApiUrl } from '@/lib/api/config';
import { getSession } from '@/lib/auth/session';
import { NEST_ROUTES } from '@/lib/api/routes';
import { ApiError, extractApiErrorMessage } from '@/lib/api/errors';
import type {
  Aluno,
  AlunoListResult,
  AutorizadoBusca,
  AutorizadoPayload,
  CreateAlunoPayload,
  Responsavel,
  StatusFilter,
  UpdateAlunoPayload,
  UpdateResponsavelPayload,
  UpdateResponsavelResult,
} from './types';

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getSession();

  const res = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, extractApiErrorMessage(body, `Request failed (${res.status})`));
  }

  if (res.status === 204) return undefined as T;

  return res.json();
}

export async function listAlunos(params: {
  page?: number;
  limit?: number;
  status?: StatusFilter;
}): Promise<AlunoListResult> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.status) query.set('status', params.status);

  const qs = query.toString();
  return apiRequest<AlunoListResult>(`${NEST_ROUTES.alunos.list}${qs ? `?${qs}` : ''}`);
}

export async function getAluno(id: string): Promise<Aluno> {
  return apiRequest<Aluno>(NEST_ROUTES.alunos.findOne(id));
}

export async function createAluno(payload: CreateAlunoPayload): Promise<Aluno> {
  return apiRequest<Aluno>(NEST_ROUTES.alunos.create, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAluno(id: string, payload: UpdateAlunoPayload): Promise<Aluno> {
  return apiRequest<Aluno>(NEST_ROUTES.alunos.update(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deactivateAluno(id: string): Promise<Aluno> {
  return apiRequest<Aluno>(NEST_ROUTES.alunos.remove(id), { method: 'DELETE' });
}

export async function activateAluno(id: string): Promise<Aluno> {
  return apiRequest<Aluno>(NEST_ROUTES.alunos.reactivate(id), { method: 'PATCH' });
}

export async function searchResponsaveis(q: string): Promise<Responsavel[]> {
  const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
  return apiRequest<Responsavel[]>(`${NEST_ROUTES.responsaveis.search}${qs}`);
}

// Server action errors lose their class identity when they cross back to the client (Next.js
// reconstructs a plain Error from the thrown value, message included but not the ApiError
// subclass/status), so callers can't do `err instanceof ApiError` after an awaited action call.
// This action returns a discriminated result instead of throwing, so the caller can react to a
// 409 (cpf already used by another responsavel) specifically, e.g. with an inline field error.
export async function updateResponsavel(
  id: string,
  payload: UpdateResponsavelPayload,
): Promise<UpdateResponsavelResult> {
  try {
    const data = await apiRequest<Responsavel>(NEST_ROUTES.responsaveis.update(id), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return { ok: true, data };
  } catch (err) {
    if (err instanceof ApiError) {
      return { ok: false, status: err.status, message: err.message };
    }
    throw err;
  }
}

export async function listAutorizados(alunoId: string): Promise<AutorizadoBusca[]> {
  return apiRequest<AutorizadoBusca[]>(NEST_ROUTES.alunos.autorizados.list(alunoId));
}

export async function createAutorizado(
  alunoId: string,
  payload: AutorizadoPayload,
): Promise<AutorizadoBusca> {
  return apiRequest<AutorizadoBusca>(NEST_ROUTES.alunos.autorizados.create(alunoId), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAutorizado(
  alunoId: string,
  autorizadoId: string,
  payload: AutorizadoPayload,
): Promise<AutorizadoBusca> {
  return apiRequest<AutorizadoBusca>(NEST_ROUTES.alunos.autorizados.update(alunoId, autorizadoId), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function removeAutorizado(alunoId: string, autorizadoId: string): Promise<void> {
  await apiRequest<void>(NEST_ROUTES.alunos.autorizados.remove(alunoId, autorizadoId), {
    method: 'DELETE',
  });
}
