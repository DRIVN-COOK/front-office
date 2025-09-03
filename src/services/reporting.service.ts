import { api } from '@drivn-cook/shared'

// Sales summaries
export async function listSalesSummaries(params?: Record<string, any>) {
  // auth
  const { data } = await api.get('/sales-summaries', { params })
  return data
}
export async function getSalesSummary(id: string) {
  const { data } = await api.get(`/sales-summaries/${id}`)
  return data
}
export async function rebuildSalesSummaries(payload: { from?: string; to?: string } = {}) {
  const { data } = await api.post('/sales-summaries/rebuild', payload) // auth
  return data
}

// Revenue share reports
export async function listRevenueShareReports(params?: Record<string, any>) {
  // auth
  const { data } = await api.get('/revenue-share-reports', { params })
  return data
}
export async function getRevenueShareReport(id: string) {
  const { data } = await api.get(`/revenue-share-reports/${id}`)
  return data
}
export async function downloadRevenueSharePdf(id: string) {
  const res = await api.get(`/revenue-share-reports/${id}/pdf`, { responseType: 'blob' }) // auth
  return res.data as Blob
}
