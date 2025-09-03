import { api } from '@drivn-cook/shared'

export async function listInvoices(params?: Record<string, any>) {
  // auth
  const { data } = await api.get('/invoices', { params })
  return data
}
export async function getInvoice(id: string) {
  const { data } = await api.get(`/invoices/${id}`)
  return data
}
export async function downloadInvoicePdf(id: string) {
  const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }) // auth
  return res.data as Blob
}
export async function createInvoice(payload: any) {
  const { data } = await api.post('/invoices', payload) // auth
  return data
}
