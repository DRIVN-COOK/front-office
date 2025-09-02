import React from 'react'
import { listPurchaseOrders } from '../../../services/procurement.service'

export default function PurchaseOrderListPage() {
  const [items, setItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const refresh = async () => {
    setLoading(true); setError(null)
    try {
      const data = await listPurchaseOrders({ sort: '-createdAt', limit: 50 })
      setItems(data?.items ?? data ?? [])
    } catch (e: any) { setError(e?.message ?? 'Erreur') }
    finally { setLoading(false) }
  }
  React.useEffect(() => { refresh() }, [])

  if (loading) return <div>Chargement…</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Bons d’appro</h1>
      <div className="rounded-xl border divide-y overflow-hidden">
        {items.map((po: any) => (
          <div key={po.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">#{po.id}</div>
              <div className="text-sm text-gray-600">{po.status}</div>
            </div>
            {/* Ajouter edit/submit quand tu veux l'édition */}
          </div>
        ))}
        {items.length === 0 && <div className="p-3 text-gray-600">Aucun bon d’appro.</div>}
      </div>
    </div>
  )
}
