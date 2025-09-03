// src/services/user.service.ts
import { api, type Paged, type User as SharedUser } from '@drivn-cook/shared';

/** On ne manipule jamais le hash côté front */
export type UserPublic = Omit<SharedUser, 'passwordHash'>;
/** Type pratique pour le rôle, basé sur le type User partagé */
export type Role = SharedUser['role'];

export type ListUsersParams = {
  q?: string;
  role?: Role;
  page?: number;
  pageSize?: number;
};

export async function listUsers(params?: ListUsersParams) {
  const res = await api.get<Paged<UserPublic>>('/users', { params });
  return res.data;
}

export async function getUser(id: string) {
  // Le back peut renvoyer passwordHash sur /users/:id ; on normalise en UserPublic
  const res = await api.get<SharedUser>(`/users/${id}`);
  const { passwordHash: _omit, ...rest } = res.data;
  return rest as UserPublic;
}

/** Création : password OU passwordHash (le back gère le re-hash si besoin) */
export type CreateUserPayload = {
  email: string;
  role: Role;
  firstName?: string | null;
  lastName?: string | null;
  password?: string;
  passwordHash?: string;
};

export async function createUser(payload: CreateUserPayload) {
  const res = await api.post<UserPublic>('/users', payload);
  return res.data;
}

export type UpdateUserPayload = {
  email?: string;
  role?: Role;
  firstName?: string | null;
  lastName?: string | null;
  password?: string;
  passwordHash?: string;
};

export async function updateUser(id: string, payload: UpdateUserPayload) {
  const res = await api.put<UserPublic>(`/users/${id}`, payload);
  return res.data;
}

export async function deleteUser(id: string) {
  await api.delete(`/users/${id}`);
}

