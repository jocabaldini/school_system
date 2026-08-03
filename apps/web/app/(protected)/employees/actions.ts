'use server';

import { getApiUrl } from '@/lib/api/config';
import { getSession } from '@/lib/auth/session';
import { NEST_ROUTES } from '@/lib/api/routes';
import { ApiError, extractApiErrorMessage } from '@/lib/api/errors';
import type {
  CreateEmployeePayload,
  Employee,
  EmployeeListResult,
  EmployeeResult,
  StatusFilter,
  UpdateEmployeePayload,
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

export async function listEmployees(params: {
  page?: number;
  limit?: number;
  status?: StatusFilter;
  q?: string;
}): Promise<EmployeeListResult> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.status) query.set('status', params.status);
  if (params.q) query.set('q', params.q);

  const qs = query.toString();
  return apiRequest<EmployeeListResult>(`${NEST_ROUTES.employees.list}${qs ? `?${qs}` : ''}`);
}

export async function getEmployee(id: string): Promise<Employee> {
  return apiRequest<Employee>(NEST_ROUTES.employees.findOne(id));
}

export async function createEmployee(payload: CreateEmployeePayload): Promise<EmployeeResult> {
  try {
    const data = await apiRequest<Employee>(NEST_ROUTES.employees.create, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { ok: true, data };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, status: err.status, message: err.message };
    throw err;
  }
}

export async function updateEmployee(
  id: string,
  payload: UpdateEmployeePayload,
): Promise<EmployeeResult> {
  try {
    const data = await apiRequest<Employee>(NEST_ROUTES.employees.update(id), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return { ok: true, data };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, status: err.status, message: err.message };
    throw err;
  }
}

export async function deactivateEmployee(id: string): Promise<Employee> {
  return apiRequest<Employee>(NEST_ROUTES.employees.remove(id), { method: 'DELETE' });
}

export async function activateEmployee(id: string): Promise<Employee> {
  return apiRequest<Employee>(NEST_ROUTES.employees.reactivate(id), { method: 'PATCH' });
}
