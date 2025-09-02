import { api } from '@drivn-cook/shared'

export type CreateCustomerPayload = {
  email: string
  name?: string
  phone?: string
}

export async function createCustomer(payload: CreateCustomerPayload) {
  // public (côté API, POST /customers est exposé)
  const { data } = await api.post('/customers', payload)
  return data
}
