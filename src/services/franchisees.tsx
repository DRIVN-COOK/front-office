import { api } from '@drivn-cook/shared'

export type FranchiseeApplyPayload = {
  companyName: string
  phone: string
  depotId: string
  acceptTerms: boolean
}

export type FranchiseeApplyResponse = {
  checkoutUrl?: string
  franchiseeId?: string
}

export async function applyForFranchise(payload: FranchiseeApplyPayload) {
  const { data } = await api.post<FranchiseeApplyResponse>('/franchisees/apply', payload)
  return data
}

export async function confirmEntryFee(sessionId: string) {
  const { data } = await api.post<{ ok: true; franchiseeId?: string }>(
    '/franchisees/confirm-entry-fee',
    { sessionId }
  )
  return data
}
