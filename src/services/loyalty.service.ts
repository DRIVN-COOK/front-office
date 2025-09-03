// src/services/loyalty.api.ts
import axios from "axios";
import type { LoyaltyCard, LoyaltyTransaction } from "@drivn-cook/shared";
type Paginated<T> = { items: T[]; page: number; pageSize: number; total: number };

const API = "/api";

export async function listCards(params: {
  page?: number;
  pageSize?: number;
  customerId?: string;
  cardNumber?: string;
}): Promise<Paginated<LoyaltyCard>> {
  const { data } = await axios.get(`${API}/loyalty-cards`, { params });
  return data;
}

export async function getCardById(id: string): Promise<LoyaltyCard> {
  const { data } = await axios.get(`${API}/loyalty-cards/${id}`);
  return data;
}

export async function getFirstCardForCustomer(customerId: string): Promise<LoyaltyCard | null> {
  const res = await listCards({ page: 1, pageSize: 1, customerId });
  return res.items[0] ?? null;
}

export async function listTransactions(params: {
  page?: number;
  pageSize?: number;
  loyaltyCardId?: string;
  customerId?: string;
}): Promise<Paginated<LoyaltyTransaction>> {
  const { data } = await axios.get(`${API}/loyalty-transactions`, { params });
  return data;
}

export async function mutatePoints(payload: {
  loyaltyCardId: string;
  customerId?: string;
  type: LoyaltyTransaction["type"]; // EARN | SPEND | ADJUST
  points: number;
  refType?: string | null;
  refId?: string | null;
}): Promise<LoyaltyTransaction> {
  const { data } = await axios.post(`${API}/loyalty-transactions/earn-or-spend`, payload);
  return data;
}

export async function revertTransaction(id: string): Promise<void> {
  await axios.delete(`${API}/loyalty-transactions/${id}`);
}
