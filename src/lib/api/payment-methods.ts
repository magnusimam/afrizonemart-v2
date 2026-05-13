import { HttpApiError } from './client';
import type { ApiErrorEnvelope } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/// Tracker #46 — types mirror the API service. The shape is the
/// merged response containing both method config rows AND any
/// matching bank-transfer accounts for the current currency.

export type PaymentMethodCode =
  | 'CARD'
  | 'MOBILE_MONEY'
  | 'BANK_TRANSFER'
  | 'USSD'
  | 'CRYPTO'
  | 'PAY_ON_DELIVERY';

export interface PaymentMethodConfig {
  id: string;
  code: PaymentMethodCode;
  label: string;
  description: string;
  icon: string;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  /// Per-method bag — shape depends on `code`. The component that
  /// renders each method narrows + casts as needed.
  details: Record<string, unknown>;
}

export interface PaymentBankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  currency: string;
  country: string | null;
  instructions: string | null;
}

export interface PublicPaymentMethodsResponse {
  methods: PaymentMethodConfig[];
  bankAccounts: PaymentBankAccount[];
}

export async function fetchPublicPaymentMethods(opts: {
  currency: string;
  country?: string | null;
}): Promise<PublicPaymentMethodsResponse> {
  const qs = new URLSearchParams({ currency: opts.currency.toUpperCase() });
  if (opts.country) qs.set('country', opts.country.toUpperCase());
  const res = await fetch(`${API_BASE}/api/payment-methods?${qs.toString()}`, {
    headers: { 'Content-Type': 'application/json' },
  });
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
  return (await res.json()) as PublicPaymentMethodsResponse;
}
