'use server';

import { getApiUrl } from '@/lib/api/config';
import { getSession } from '@/lib/auth/session';
import { NEST_ROUTES } from '@/lib/api/routes';
import { ApiError, extractApiErrorMessage } from '@/lib/api/errors';
import type {
  CreateSchoolClassPayload,
  EmployeeOption,
  SchoolClass,
  SchoolClassListResult,
  StatusFilter,
  UpdateSchoolClassPayload,
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

export async function listSchoolClasses(params: {
  page?: number;
  limit?: number;
  status?: StatusFilter;
  schoolYear?: number;
  q?: string;
}): Promise<SchoolClassListResult> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.status) query.set('status', params.status);
  if (params.schoolYear) query.set('schoolYear', String(params.schoolYear));
  if (params.q) query.set('q', params.q);

  const qs = query.toString();
  return apiRequest<SchoolClassListResult>(
    `${NEST_ROUTES.schoolClasses.list}${qs ? `?${qs}` : ''}`,
  );
}

export async function getSchoolClass(id: string): Promise<SchoolClass> {
  return apiRequest<SchoolClass>(NEST_ROUTES.schoolClasses.findOne(id));
}

export async function createSchoolClass(payload: CreateSchoolClassPayload): Promise<SchoolClass> {
  return apiRequest<SchoolClass>(NEST_ROUTES.schoolClasses.create, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateSchoolClass(
  id: string,
  payload: UpdateSchoolClassPayload,
): Promise<SchoolClass> {
  return apiRequest<SchoolClass>(NEST_ROUTES.schoolClasses.update(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deactivateSchoolClass(id: string): Promise<SchoolClass> {
  return apiRequest<SchoolClass>(NEST_ROUTES.schoolClasses.remove(id), { method: 'DELETE' });
}

export async function activateSchoolClass(id: string): Promise<SchoolClass> {
  return apiRequest<SchoolClass>(NEST_ROUTES.schoolClasses.reactivate(id), { method: 'PATCH' });
}

export async function listActiveEmployees(): Promise<EmployeeOption[]> {
  const result = await apiRequest<{ data: EmployeeOption[] }>(
    `${NEST_ROUTES.employees.list}?status=ACTIVE&limit=200`,
  );
  return result.data;
}
