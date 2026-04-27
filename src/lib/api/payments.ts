import { apiFetchAuthed } from './client';

export type PaymentStatus = 'INITIATED' | 'SUCCEEDED' | 'FAILED' | 'REVERSED';

export interface InitPaymentResult {
  paymentId: string;
  gatewayRef: string;
  checkoutUrl: string;
}

export interface VerifyPaymentResult {
  status: PaymentStatus;
  orderStatus: string;
  orderNumber: string;
}

export function initPayment(orderId: string): Promise<InitPaymentResult> {
  return apiFetchAuthed<InitPaymentResult>('/api/payments/init', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}

export function verifyPayment(reference: string): Promise<VerifyPaymentResult> {
  return apiFetchAuthed<VerifyPaymentResult>(`/api/payments/verify/${encodeURIComponent(reference)}`);
}

export interface CheckOrderPaymentResult {
  orderStatus: string;
  orderNumber: string;
}

/**
 * Triggers a server-side verify against whatever gateway placed the
 * latest payment for this order. Used by the success page when the
 * webhook hasn't landed (e.g. localhost without ngrok).
 */
export function checkOrderPayment(orderRef: string): Promise<CheckOrderPaymentResult> {
  return apiFetchAuthed<CheckOrderPaymentResult>(
    `/api/payments/check-order/${encodeURIComponent(orderRef)}`,
    { method: 'POST' },
  );
}
