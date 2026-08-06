'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getApiUrl } from '@/lib/api/config';
import { getSession } from '@/lib/auth/session';
import { NEST_ROUTES } from '@/lib/api/routes';
import { ApiError, extractApiErrorMessage } from '@/lib/api/errors';
import type { DashboardSummary } from './types';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const token = await getSession();

  const res = await fetch(`${getApiUrl()}${NEST_ROUTES.dashboard.summary}`, {
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, extractApiErrorMessage(body, `Request failed (${res.status})`));
  }

  return res.json();
}

export async function getMe() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${process.env.API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;

    return res.json();
  } catch {
    // API is unreachable (e.g. not yet started or network error)
    return null;
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  redirect('/login');
}
