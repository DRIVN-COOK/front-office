import { api } from '@drivn-cook/shared'

export type Credentials = { email: string; password: string }
export type RegisterPayload = { email: string; password: string; name?: string }

export async function login(payload: Credentials) {
  const { data } = await api.post('/auth/login', payload)         // public
  return data
}

export async function register(payload: RegisterPayload) {
  const { data } = await api.post('/auth/register', payload)       // public
  return data
}

export async function refresh() {
  const { data } = await api.post('/auth/refresh', {})             // public
  return data
}

export async function logout() {
  const { data } = await api.post('/auth/logout', {})              // auth
  return data
}

export async function me() {
  const { data } = await api.get('/auth/me')                       // auth
  return data
}
