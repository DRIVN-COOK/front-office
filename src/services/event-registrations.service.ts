// src/services/registrations.api.ts
import { api } from '@drivn-cook/shared'
import type { EventRegistration } from '@drivn-cook/shared'
import { EventRegStatus } from '@drivn-cook/shared'

// Liste des inscriptions d'un évènement
export async function getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
  const { data } = await api.get<EventRegistration[]>(`/events/${eventId}/registrations`)
  return data
}

// (optionnel) inscrire un customer
export async function createRegistration(eventId: string, customerId: string): Promise<EventRegistration> {
  const { data } = await api.post<EventRegistration>(`/events/${eventId}/registrations`, { customerId })
  return data
}

// (optionnel) changer le statut
export async function updateRegistrationStatus(
  eventId: string,
  registrationId: string,
  status: EventRegStatus
): Promise<EventRegistration> {
  const { data } = await api.patch<EventRegistration>(
    `/events/${eventId}/registrations/${registrationId}`,
    { status }
  )
  return data
}
