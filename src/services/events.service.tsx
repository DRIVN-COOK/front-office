import { api } from '@drivn-cook/shared'

export type Event = {
  id: string
  title: string
  description?: string
  date?: string
  capacity?: number
}

export async function listEvents(params?: Record<string, any>) {
  // public
  const { data } = await api.get<Event[]>('/events', { params })
  return data
}

export async function getEvent(id: string) {
  // public
  const { data } = await api.get<Event>(`/events/${id}`)
  return data
}

// Franchisé (auth)
export async function createEvent(payload: Partial<Event>) {
  const { data } = await api.post('/events', payload)
  return data
}
export async function updateEvent(id: string, payload: Partial<Event>) {
  const { data } = await api.put(`/events/${id}`, payload)
  return data
}
export async function deleteEvent(id: string) {
  const { data } = await api.delete(`/events/${id}`)
  return data
}
