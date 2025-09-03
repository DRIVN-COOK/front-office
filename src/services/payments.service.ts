// src/services/payment.service.ts
import { api } from '@drivn-cook/shared';

export type StartFranchiseEntryPayload = {
  companyName: string;
  siren: string;
  phone: string;
  depotId: string;
  uiMode?: 'embedded' | 'hosted';
};

export type StartFranchiseEntryResponse = {
  // Hosted Checkout (redirection)
  checkoutUrl?: string;
  // Embedded Checkout
  clientSecret?: string;
  sessionId?: string;
};

export async function startFranchiseEntryPayment(
  payload: StartFranchiseEntryPayload
): Promise<StartFranchiseEntryResponse> {
  const res = await api.post<StartFranchiseEntryResponse>(
    '/payments/checkout/franchise-entry',
    payload
  );
  return res.data;
}

export async function confirmPayment(sessionId: string) {
  await api.post('/payments/confirm', { sessionId });
}
