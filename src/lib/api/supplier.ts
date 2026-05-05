import { apiFetchAuthed } from './client';

/// Shape returned by GET /api/suppliers/me — the supplier's own profile
/// + onboarding stage. Used to drive the dashboard, sidebar greeting,
/// and the 10-stage progress bar.
export interface SupplierMe {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  companyName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  country: string | null;
  address: string | null;
  currentStage: number;
  maxStage: number;
  minimumPIQsRequired: number;
  createdAt: string;
  updatedAt: string;
}

export function supplierGetMe(): Promise<SupplierMe> {
  return apiFetchAuthed<SupplierMe>('/api/suppliers/me');
}

export function supplierUpdateMe(patch: {
  companyName?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  country?: string | null;
  address?: string | null;
}): Promise<SupplierMe> {
  return apiFetchAuthed<SupplierMe>('/api/suppliers/me', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
