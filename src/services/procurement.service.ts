// src/services/procurement.service.ts
import { api, type Paged } from '@drivn-cook/shared'
import type { PurchaseOrder } from '@drivn-cook/shared' // types centralisés

export type ListPOParams = {
  page?: number
  pageSize?: number
  status?: 'DRAFT' | 'SUBMITTED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
  franchiseeId?: string                  
}
export async function listPurchaseOrders(params?: ListPOParams) {
  const { data } = await api.get<Paged<PurchaseOrder>>('/purchase-orders', { params })
  return data
}

export async function getPurchaseOrder(id: string) {
  const { data } = await api.get<PurchaseOrder>(`/purchase-orders/${id}`)
  return data
}

// Brouillon
export async function createPurchaseOrder(payload: { franchiseeId: string; warehouseId: string }) {
  const { data } = await api.post<PurchaseOrder>('/purchase-orders', payload)
  return data
}

// Éditer brouillon (ex: changer d’entrepôt)
export async function updatePurchaseOrder(id: string, payload: { warehouseId?: string }) {
  const { data } = await api.put<PurchaseOrder>(`/purchase-orders/${id}`, payload)
  return data
}

// Soumettre (contrôle 80/20)
export async function submitPurchaseOrder(id: string) {
  const { data } = await api.post<PurchaseOrder>(`/purchase-orders/${id}/submit`)
  return data
}

// Annuler
export async function cancelPurchaseOrder(id: string) {
  await api.delete(`/purchase-orders/${id}`)
}
