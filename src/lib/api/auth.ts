import type { ApiErrorEnvelope } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

/**
 * The API now sets the refresh token as an httpOnly cookie. Only the
 * access token comes back in the JSON body — the refresh token never
 * touches JavaScript.
 */
export interface AuthResult {
  user: AuthUser;
  accessToken: string;
}

export class AuthApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function authFetch<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    let envelope: ApiErrorEnvelope | undefined;
    try {
      envelope = (await res.json()) as ApiErrorEnvelope;
    } catch {
      /* not JSON */
    }
    throw new AuthApiError(
      res.status,
      envelope?.error?.code ?? 'UNKNOWN',
      envelope?.error?.message ?? `Request failed with status ${res.status}`,
      envelope?.error?.details,
    );
  }

  return (await res.json()) as T;
}

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export function registerUser(body: RegisterInput): Promise<AuthResult> {
  return authFetch<AuthResult>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function loginUser(body: LoginInput): Promise<AuthResult> {
  return authFetch<AuthResult>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function refreshSession(): Promise<AuthResult> {
  return authFetch<AuthResult>('/api/auth/refresh', { method: 'POST' });
}

export function logoutUser(accessToken: string): Promise<void> {
  return authFetch<void>('/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function getMe(accessToken: string): Promise<AuthUser> {
  return authFetch<AuthUser>('/api/auth/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function requestPasswordReset(email: string): Promise<void> {
  return authFetch<void>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token: string, password: string): Promise<void> {
  return authFetch<void>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}
