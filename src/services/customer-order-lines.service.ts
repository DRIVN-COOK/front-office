//customer-order-lines.service.ts
// Client-side service for CUSTOMER ORDERS (front-office)
import { api } from '@drivn-cook/shared';

// --- Types min nécessaires côté front (tu peux remplacer par ceux du shared si existants)
export type CreateCustomerOrderPayload = {
  customerId: string;
  franchiseeId: string;
  truckId?: string;
  warehouseId?: string;
  channel?: 'IN_PERSON' | 'ONLINE_PREORDER';
  scheduledPickupAt?: string | Date;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
};

export type CustomerOrder = {
  id: string;
  status: 'PENDING'|'CONFIRMED'|'PREPARING'|'READY'|'FULFILLED'|'CANCELLED';
  franchiseeId: string;
  customerId: string;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  placedAt: string;
};

export type CreateCustomerOrderLinePayload = {
  customerOrderId: string;
  menuItemId: string;
  qty: number;
  unitPriceHT: number;
  tvaPct: number;
  lineTotalHT: number;
};

export async function createCustomerOrder(payload: CreateCustomerOrderPayload) {
  const { data } = await api.post<CustomerOrder>('/customer-orders', payload);
  return data;
}

export async function addCustomerOrderLine(payload: CreateCustomerOrderLinePayload) {
  const { data } = await api.post('/customer-order-lines', payload);
  return data;
}

export async function updateCustomerOrderStatus(id: string, status: CustomerOrder['status']) {
  const { data } = await api.put(`/customer-orders/${id}/status`, { status });
  return data as CustomerOrder;
}
