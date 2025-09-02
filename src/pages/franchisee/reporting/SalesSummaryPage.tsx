import React from 'react'
import { listSalesSummaries } from '../../../services/reporting.service'

export default function SalesSummaryPage() {
  const [items, setItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    (async () => {
      try {
        const data = await listSalesSummaries({ sort: '-from', limit: 30 })
        setItems(data?.items ?? data ?? [])
      } catch (e: any) { setError(e?.message ?? 'Erreur') }
      finally { setLoading(false) }
    })()
  }, [])

  if (loading) return <div>Chargement…</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Résumés de ventes</h1>
      <div className="rounded-xl border divide-y overflow-hidden">
        {items.map((s: any) => (
          <div key={s.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{s.from} → {s.to}</div>
              <div className="text-sm text-gray-600">
                Commandes: {s.totalOrders ?? '—'} • CA: {s.totalSales?.toFixed?.(2)} €
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="p-3 text-gray-600">Aucun résumé.</div>}
      </div>
    </div>
  )
}
