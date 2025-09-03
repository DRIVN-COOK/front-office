import { api } from '@drivn-cook/shared';

export type FranchiseUserRole = 'OWNER' | 'MANAGER' | 'STAFF';

export type CreateFranchiseUserPayload = {
  userId: string;
  franchiseeId: string;
  roleInFranchise?: FranchiseUserRole; // le back attend roleInFranchise
};

/** Admin: attacher n'importe quel user à une franchise */
export async function addUserToFranchisee(payload: CreateFranchiseUserPayload) {
  const res = await api.post('/franchise-users', {
    userId: payload.userId,
    franchiseeId: payload.franchiseeId,
    roleInFranchise: payload.roleInFranchise ?? 'OWNER',
  });
  return res.data;
}

/** Self-service: l'utilisateur courant s'attache lui-même à la franchise (OWNER par défaut) */
export async function attachSelfToFranchisee(payload: {
  franchiseeId: string;
  roleInFranchise?: FranchiseUserRole;
}) {
  const res = await api.post('/franchise-users/attach-self', {
    franchiseeId: payload.franchiseeId,
    roleInFranchise: payload.roleInFranchise ?? 'OWNER',
  });
  return res.data;
}

/** (Optionnel) Lister les rattachements */
export async function listFranchiseUsers(params?: {
  userId?: string;
  franchiseeId?: string;
  page?: number;
  pageSize?: number;
}) {
  const res = await api.get('/franchise-users', { params });
  return res.data as {
    items: any[];
    page: number;
    pageSize: number;
    total: number;
  };
}

/** (Optionnel) Mettre à jour un rattachement */
export async function updateFranchiseUser(
  id: string,
  payload: {
    userId?: string;
    franchiseeId?: string;
    roleInFranchise?: FranchiseUserRole | null; // null pour effacer
  }
) {
  const res = await api.put(`/franchise-users/${id}`, payload);
  return res.data;
}

/** (Optionnel) Détacher un rattachement */
export async function detachFranchiseUser(id: string) {
  await api.delete(`/franchise-users/${id}`);
}

/** Profil enrichi (franchiseUsers + franchisee) */
export async function getMeFull<T = any>() {
  const res = await api.get<T>('/auth/me/full');
  return res.data;
}
