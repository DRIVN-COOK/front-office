import { api } from '@drivn-cook/shared'


export async function listPayments(params?: Record<string, any>) {
  // auth
  const { data } = await api.get('/payments', { params })
  return data
}
export async function createPayment(payload: any) {
  const { data } = await api.post('/payments', payload) // auth
  return data
}
export async function capturePayment(id: string) {
  const { data } = await api.post(`/payments/${id}/capture`, {}) // auth
  return data
}
export async function refundPayment(id: string) {
  const { data } = await api.post(`/payments/${id}/refund`, {}) // auth
  return data
}
