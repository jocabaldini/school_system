'use server';

import { getApiUrl } from '@/lib/api/config';
import { getSession } from '@/lib/auth/session';
import { NEST_ROUTES } from '@/lib/api/routes';
import { ApiError, extractApiErrorMessage } from '@/lib/api/errors';
import type { Settings, UpdateSettingsPayload } from './types';

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

export async function getSettings(): Promise<Settings> {
  return apiRequest<Settings>(NEST_ROUTES.settings.get);
}

export async function updateSettings(payload: UpdateSettingsPayload): Promise<Settings> {
  return apiRequest<Settings>(NEST_ROUTES.settings.update, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
