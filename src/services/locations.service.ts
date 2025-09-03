import { api } from '@drivn-cook/shared'

export type Location = {
  id: string
  name: string
  address?: string
  city?: string
}

export async function listLocations(params?: Record<string, any>) {
  // public
  const { data } = await api.get<Location[]>('/locations', { params })
  return data
}

export async function getLocation(id: string) {
  // public
  const { data } = await api.get<Location>(`/locations/${id}`)
  return data
}
