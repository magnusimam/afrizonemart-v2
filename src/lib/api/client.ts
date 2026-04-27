import { useAuthStore } from '@/stores/authStore';
import type { ApiErrorEnvelope } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class HttpApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface AuthedFetchOptions extends RequestInit {
  /** Set to false to skip the 401-refresh-and-retry dance. */
  retryOn401?: boolean;
}

/**
 * Token-aware fetch: attaches the current access token from the auth
 * store, and on a 401 calls /api/auth/refresh once (the httpOnly cookie
 * goes with it via credentials: include), then retries the original
 * request with the new token. If refresh itself fails, the store is
 * cleared and the 401 is surfaced to the caller.
 */
export async function apiFetchAuthed<T>(
  path: string,
  options: AuthedFetchOptions = {},
): Promise<T> {
  const { retryOn401 = true, ...init } = options;
  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 401 && retryOn401) {
    const newToken = await useAuthStore.getState().refresh();
    if (newToken) {
      return apiFetchAuthed<T>(path, { ...options, retryOn401: false });
    }
  }

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    let envelope: ApiErrorEnvelope | undefined;
    try {
      envelope = (await res.json()) as ApiErrorEnvelope;
    } catch {
      /* not JSON */
    }
    throw new HttpApiError(
      res.status,
      envelope?.error?.code ?? 'UNKNOWN',
      envelope?.error?.message ?? `Request failed with status ${res.status}`,
      envelope?.error?.details,
    );
  }

  return (await res.json()) as T;
}
