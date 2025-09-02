import { api } from '@drivn-cook/shared'
import type { PurchaseOrder } from '@drivn-cook/shared' // dispo dans shared/contracts/purchaseOrder

export async function listPurchaseOrders(params?: Record<string, any>) {
  // auth
  const { data } = await api.get<PurchaseOrder[]>('/purchase-orders', { params })
  return data
}
export async function getPurchaseOrder(id: string) {
  const { data } = await api.get<PurchaseOrder>(`/purchase-orders/${id}`)
  return data
}
export async function createPurchaseOrder(payload: Partial<PurchaseOrder>) {
  const { data } = await api.post('/purchase-orders', payload)
  return data
}
export async function updatePurchaseOrder(id: string, payload: Partial<PurchaseOrder>) {
  const { data } = await api.put(`/purchase-orders/${id}`, payload)
  return data
}
export async function deletePurchaseOrder(id: string) {
  const { data } = await api.delete(`/purchase-orders/${id}`)
  return data
}
