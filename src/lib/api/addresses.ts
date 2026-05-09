import type { ApiErrorEnvelope } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface SavedAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  country: string;
  label: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressInput {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  country: string;
  label?: string | null;
  isDefault?: boolean;
}

export class AddressApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'AddressApiError';
    this.status = status;
    this.code = code;
  }
}

async function addrFetch<T>(
  path: string,
  accessToken: string,
  init: Omit<RequestInit, 'headers'> = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
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
    throw new AddressApiError(
      res.status,
      envelope?.error?.code ?? 'UNKNOWN',
      envelope?.error?.message ?? `Request failed with status ${res.status}`,
    );
  }
  return (await res.json()) as T;
}

export function listAddresses(
  accessToken: string,
): Promise<{ items: SavedAddress[] }> {
  return addrFetch<{ items: SavedAddress[] }>('/api/addresses', accessToken, {
    method: 'GET',
  });
}

export function createAddress(
  accessToken: string,
  body: AddressInput,
): Promise<SavedAddress> {
  return addrFetch<SavedAddress>('/api/addresses', accessToken, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateAddress(
  accessToken: string,
  id: string,
  body: Partial<AddressInput>,
): Promise<SavedAddress> {
  return addrFetch<SavedAddress>(`/api/addresses/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteAddress(
  accessToken: string,
  id: string,
): Promise<void> {
  return addrFetch<void>(`/api/addresses/${id}`, accessToken, {
    method: 'DELETE',
  });
}
