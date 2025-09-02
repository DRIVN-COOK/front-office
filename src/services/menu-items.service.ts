// src/services/menuItemService.ts
import { api } from '@drivn-cook/shared';
import type { MenuItem, PaginatedResult } from '@drivn-cook/shared';

/**
 * Liste publique des items de menu (pagination + filtre d’activité).
 * NB: l’instance `api` embarque déjà baseURL/withCredentials via setApiBaseUrl().
 */
export async function listMenuItems(params: {
  page?: number;
  pageSize?: number;
  active?: boolean; // ?active=true|false
} = {}): Promise<PaginatedResult<MenuItem>> {
  const { data } = await api.get('/menu-items', { params });
  return data;
}

/** Détail public d’un item de menu. */
export async function getMenuItem(id: string): Promise<MenuItem> {
  const { data } = await api.get(`/menu-items/${id}`);
  return data;
}
