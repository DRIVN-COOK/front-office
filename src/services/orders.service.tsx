// src/services/orderService.ts — VERSION COMPLÈTE CORRIGÉE
import { api } from '@drivn-cook/shared';
import type { PaginatedResult } from '@drivn-cook/shared'; // si tu l’as dans shared, sinon fais un type local
import { OrderStatus } from '@drivn-cook/shared';

// ⬇️ types LOCAUX (pas depuis shared)
import type { Order, OrderListItem, NewOrderRequest } from '@drivn-cook/shared';
// si tu n’as pas l’alias '@', remplace par: '../types/order'

/** Liste (générique) */
export async function listOrders(params?: Record<string, any>) {
  const { data } = await api.get('/customer-orders', { params });
  return data as PaginatedResult<OrderListItem>;
}

/** Mes commandes */
export async function listMyOrders(params?: {
  page?: number;
  pageSize?: number;
  status?: OrderStatus | 'ALL';
}) {
  const query: Record<string, any> = { mine: true };
  if (params?.page) query.page = params.page;
  if (params?.pageSize) query.pageSize = params.pageSize;
  if (params?.status && params.status !== 'ALL') query.status = params.status;

  const { data } = await api.get('/customer-orders', { params: query });
  return data as PaginatedResult<OrderListItem>;
}

/** Détail */
export async function getOrder(id: string) {
  const { data } = await api.get(`/customer-orders/${id}`);
  return data as Order;
}

/** Création */
export async function createOrder(payload: NewOrderRequest) {
  const { data } = await api.post('/customer-orders', payload);
  return data as Order;
}

/** MAJ statut (si route supportée) */
export async function updateOrderStatus(id: string, status: OrderStatus) {
  if (!Object.values(OrderStatus).includes(status)) {
    throw new Error(`Statut invalide: ${status}`);
  }
  const { data } = await api.put(`/customer-orders/${id}/status`, { status });
  return data as Order;
}

/** Annulation (si route supportée) */
export async function cancelOrder(id: string) {
  const { data } = await api.delete(`/customer-orders/${id}`);
  return data as { ok: true } | Order;
}
