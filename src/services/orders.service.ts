// src/services/orders.service.ts
import { api } from '@drivn-cook/shared'

// src/services/orders.service.ts
import type { Order, Paged } from '@drivn-cook/shared'

export type ListOrdersParams = {
  franchiseeId?: string
  status?: Order['status'] | string
  page?: number
  pageSize?: number
  scheduled?: boolean
  from?: string // ISO date (optionnel)
  to?: string   // ISO date (optionnel)
  q?: string    // recherche plein texte (si supportée côté back)
}

/** Liste paginée des commandes (franchisée). */
export async function listOrders(params?: ListOrdersParams) {
  const { data } = await api.get<Paged<Order>>('/orders', { params })
  return data
}

/** Détail d’une commande. */
export async function getOrder(id: string) {
  const { data } = await api.get<Order>(`/orders/${id}`)
  return data
}

/** Met à jour le statut d’une commande. */
export async function updateOrderStatus(id: string, status: Order['status']) {
  // Si ton back a un endpoint spécifique (ex: POST /orders/:id/status), adapte ici.
  const { data } = await api.put<Order>(`/orders/${id}`, { status })
  return data
}


// ### Types minimes côté front (tu peux les remplacer par tes types du shared si tu les as)
export type CreatePOPayload = {
  franchiseeId: string
  warehouseId: string
}

export type AddPOLinePayload = {
  purchaseOrderId: string
  productId: string
  qty: number
  unitPriceHT: number
  tvaPct: number
  isCoreItem?: boolean // true = article "cœur de gamme" (pour la règle 80/20)
}

// Réponse minimale attendue (remplace par le type exact si tu l’as dans @drivn-cook/shared)
export type PurchaseOrder = {
  id: string
  status?: string
  totalHT?: number
  totalTTC?: number
  // ...autres champs si besoin
}

/**
 * POST /purchase-orders
 * Crée un bon de commande (status DRAFT)
 */
export async function createPurchaseOrder(payload: CreatePOPayload, opts?: { signal?: AbortSignal }) {
  const res = await api.post<PurchaseOrder>('/purchase-orders', payload, { signal: opts?.signal })
  return res.data
}

/**
 * POST /purchase-order-lines
 * Ajoute une ligne au bon de commande
 */
export async function addPurchaseOrderLine(payload: AddPOLinePayload, opts?: { signal?: AbortSignal }) {
  const res = await api.post('/purchase-order-lines', payload, { signal: opts?.signal })
  return res.data
}

/**
 * POST /purchase-orders/:id/submit
 * Soumet le bon de commande (applique la règle 80/20 côté back)
 */
export async function submitPurchaseOrder(purchaseOrderId: string, opts?: { signal?: AbortSignal }) {
  const res = await api.post<PurchaseOrder>(`/purchase-orders/${purchaseOrderId}/submit`, null, {
    signal: opts?.signal,
  })
  return res.data
}

// (optionnel) utile pour le checkout
export async function getPurchaseOrder(purchaseOrderId: string, opts?: { signal?: AbortSignal }) {
  const res = await api.get<PurchaseOrder>(`/purchase-orders/${purchaseOrderId}`, {
    signal: opts?.signal,
  })
  return res.data
}
