'use server';

import { getApiUrl } from '@/lib/api/config';
import { getSession } from '@/lib/auth/session';
import { NEST_ROUTES } from '@/lib/api/routes';
import { ApiError, extractApiErrorMessage } from '@/lib/api/errors';
import type {
  AuthorizedPickup,
  AuthorizedPickupPayload,
  CreateStudentPayload,
  Guardian,
  StatusFilter,
  Student,
  StudentListResult,
  UpdateGuardianPayload,
  UpdateGuardianResult,
  UpdateStudentPayload,
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

export async function listStudents(params: {
  page?: number;
  limit?: number;
  status?: StatusFilter;
}): Promise<StudentListResult> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.status) query.set('status', params.status);

  const qs = query.toString();
  return apiRequest<StudentListResult>(`${NEST_ROUTES.students.list}${qs ? `?${qs}` : ''}`);
}

export async function getStudent(id: string): Promise<Student> {
  return apiRequest<Student>(NEST_ROUTES.students.findOne(id));
}

export async function createStudent(payload: CreateStudentPayload): Promise<Student> {
  return apiRequest<Student>(NEST_ROUTES.students.create, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateStudent(id: string, payload: UpdateStudentPayload): Promise<Student> {
  return apiRequest<Student>(NEST_ROUTES.students.update(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deactivateStudent(id: string): Promise<Student> {
  return apiRequest<Student>(NEST_ROUTES.students.remove(id), { method: 'DELETE' });
}

export async function activateStudent(id: string): Promise<Student> {
  return apiRequest<Student>(NEST_ROUTES.students.reactivate(id), { method: 'PATCH' });
}

export async function searchGuardians(q: string): Promise<Guardian[]> {
  const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
  return apiRequest<Guardian[]>(`${NEST_ROUTES.guardians.search}${qs}`);
}

// Server action errors lose their class identity when they cross back to the client (Next.js
// reconstructs a plain Error from the thrown value, message included but not the ApiError
// subclass/status), so callers can't do `err instanceof ApiError` after an awaited action call.
// This action returns a discriminated result instead of throwing, so the caller can react to a
// 409 (cpf already used by another guardian) specifically, e.g. with an inline field error.
export async function updateGuardian(
  id: string,
  payload: UpdateGuardianPayload,
): Promise<UpdateGuardianResult> {
  try {
    const data = await apiRequest<Guardian>(NEST_ROUTES.guardians.update(id), {
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

export async function listAuthorizedPickups(studentId: string): Promise<AuthorizedPickup[]> {
  return apiRequest<AuthorizedPickup[]>(NEST_ROUTES.students.authorizedPickups.list(studentId));
}

export async function createAuthorizedPickup(
  studentId: string,
  payload: AuthorizedPickupPayload,
): Promise<AuthorizedPickup> {
  return apiRequest<AuthorizedPickup>(NEST_ROUTES.students.authorizedPickups.create(studentId), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAuthorizedPickup(
  studentId: string,
  pickupId: string,
  payload: AuthorizedPickupPayload,
): Promise<AuthorizedPickup> {
  return apiRequest<AuthorizedPickup>(
    NEST_ROUTES.students.authorizedPickups.update(studentId, pickupId),
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export async function removeAuthorizedPickup(studentId: string, pickupId: string): Promise<void> {
  await apiRequest<void>(NEST_ROUTES.students.authorizedPickups.remove(studentId, pickupId), {
    method: 'DELETE',
  });
}
