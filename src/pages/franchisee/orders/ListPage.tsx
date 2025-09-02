import React from 'react'
import { Link } from 'react-router-dom'
import { listOrders, updateOrderStatus } from '../../../services/orders.service'

export default function OrdersListPage() {
  const [items, setItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const refresh = async () => {
    setLoading(true); setError(null)
    try {
      const data = await listOrders({ sort: '-createdAt', limit: 50 })
      setItems(data?.items ?? data ?? [])
    } catch (e: any) {
      setError(e?.message ?? 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { refresh() }, [])

  const markReady = async (id: string) => {
    await updateOrderStatus(id, 'READY') // adapte selon vos enums
    await refresh()
  }

  if (loading) return <div>Chargement…</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Commandes</h1>
      <div className="rounded-xl border divide-y overflow-hidden">
        {items.map((o: any) => (
          <div key={o.id} className="p-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="font-medium truncate">#{o.id}</div>
              <div className="text-sm text-gray-600">{o.status}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => markReady(o.id)} className="px-3 py-1.5 rounded-lg border">Marquer prêt</button>
              <Link to={`/franchisée/orders/${o.id}`} className="underline">Détail</Link>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="p-3 text-gray-600">Aucune commande.</div>}
      </div>
    </div>
  )
}
