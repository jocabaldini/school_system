'use server';

import { getApiUrl } from '@/lib/api/config';
import { getSession } from '@/lib/auth/session';
import { NEST_ROUTES } from '@/lib/api/routes';
import { ApiError, extractApiErrorMessage } from '@/lib/api/errors';
import type {
  CreateFuncionarioPayload,
  Funcionario,
  FuncionarioListResult,
  FuncionarioResult,
  StatusFilter,
  UpdateFuncionarioPayload,
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

export async function listFuncionarios(params: {
  page?: number;
  limit?: number;
  status?: StatusFilter;
  q?: string;
}): Promise<FuncionarioListResult> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.status) query.set('status', params.status);
  if (params.q) query.set('q', params.q);

  const qs = query.toString();
  return apiRequest<FuncionarioListResult>(`${NEST_ROUTES.funcionarios.list}${qs ? `?${qs}` : ''}`);
}

export async function getFuncionario(id: string): Promise<Funcionario> {
  return apiRequest<Funcionario>(NEST_ROUTES.funcionarios.findOne(id));
}

export async function createFuncionario(
  payload: CreateFuncionarioPayload,
): Promise<FuncionarioResult> {
  try {
    const data = await apiRequest<Funcionario>(NEST_ROUTES.funcionarios.create, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { ok: true, data };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, status: err.status, message: err.message };
    throw err;
  }
}

export async function updateFuncionario(
  id: string,
  payload: UpdateFuncionarioPayload,
): Promise<FuncionarioResult> {
  try {
    const data = await apiRequest<Funcionario>(NEST_ROUTES.funcionarios.update(id), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return { ok: true, data };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, status: err.status, message: err.message };
    throw err;
  }
}

export async function deactivateFuncionario(id: string): Promise<Funcionario> {
  return apiRequest<Funcionario>(NEST_ROUTES.funcionarios.remove(id), { method: 'DELETE' });
}

export async function activateFuncionario(id: string): Promise<Funcionario> {
  return apiRequest<Funcionario>(NEST_ROUTES.funcionarios.reactivate(id), { method: 'PATCH' });
}
