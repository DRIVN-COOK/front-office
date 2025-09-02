import { api } from '@drivn-cook/shared'

export type OrderLinePayload = {
  orderId: string
  productId: string
  quantity: number
  unitPrice?: number
}

export async function listOrderLines(params?: Record<string, any>) {
  // auth
  const { data } = await api.get('/customer-order-lines', { params })
  return data
}

export async function addOrderLine(payload: OrderLinePayload) {
  // auth
  const { data } = await api.post('/customer-order-lines', payload)
  return data
}

export async function updateOrderLine(id: string, payload: Partial<OrderLinePayload>) {
  // auth
  const { data } = await api.put(`/customer-order-lines/${id}`, payload)
  return data
}

export async function deleteOrderLine(id: string) {
  // auth
  const { data } = await api.delete(`/customer-order-lines/${id}`)
  return data
}
