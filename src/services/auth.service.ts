import { api } from '@drivn-cook/shared';

export async function getMeFull<T = any>() {
  const res = await api.get<T>('/auth/me/full');
  return res.data;
}

export async function refreshTokens(payload: { refreshToken: string }) {
  const res = await api.post('/auth/refresh', payload);
  return res.data as { accessToken: string; refreshToken: string };
}

export async function logout(payload: { refreshToken: string }) {
  await api.post('/auth/logout', payload);
}
