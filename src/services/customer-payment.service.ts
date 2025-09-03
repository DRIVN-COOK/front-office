//customer-payment.service.ts
import { api } from '@drivn-cook/shared';

export type StartCustomerOrderPaymentPayload = {
  uiMode?: 'embedded' | 'hosted';
};

export type StartCustomerOrderPaymentResponse =
  | { clientSecret: string; sessionId: string }          // embedded
  | { id?: string; url: string; mode?: 'fallback' };     // hosted

export async function startCustomerOrderPayment(orderId: string, payload: StartCustomerOrderPaymentPayload = { uiMode: 'embedded' }) {
  const { data } = await api.post<StartCustomerOrderPaymentResponse>(
    `/payments/customer-orders/${orderId}/checkout-session`,
    payload
  );
  return data;
}

export async function confirmPayment(sessionId: string) {
  const { data } = await api.post(`/payments/confirm`, { sessionId });
  return data;
}
