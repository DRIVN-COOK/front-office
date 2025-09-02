import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOrder, updateOrderStatus } from '../../../services/orders.service'

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const load = async () => {
    setLoading(true); setError(null)
    try { setOrder(await getOrder(id as string)) }
    catch (e: any) { setError(e?.message ?? 'Erreur') }
    finally { setLoading(false) }
  }

  React.useEffect(() => { load() }, [id])

  const onStatus = async (status: string) => {
    await updateOrderStatus(id as string, status)
    await load()
  }

  if (loading) return <div>Chargement…</div>
  if (error || !order) return <div className="text-red-600">{error ?? 'Introuvable'}</div>

  return (
    <div className="space-y-4">
      <Link to="/franchisée/orders" className="underline text-sm">&larr; Retour</Link>
      <h1 className="text-2xl font-bold">Commande #{order.id}</h1>
      <div>Status : <b>{order.status}</b></div>
      <div className="flex gap-2">
        <button onClick={() => onStatus('PREPARING')} className="px-3 py-1.5 border rounded-lg">Préparer</button>
        <button onClick={() => onStatus('READY')} className="px-3 py-1.5 border rounded-lg">Prête</button>
        <button onClick={() => onStatus('COMPLETED')} className="px-3 py-1.5 border rounded-lg">Terminée</button>
      </div>

      <div>
        <h2 className="font-semibold mb-2">Lignes</h2>
        <div className="rounded-xl border divide-y overflow-hidden">
          {(order.lines ?? []).map((l: any) => (
            <div key={l.id} className="p-3 flex items-center justify-between">
              <div>{l.menuItem?.name ?? l.menuItemId} × {l.qty}</div>
              <div>{(l.unitPriceHT * l.qty * (1 + (l.tvaPct ?? 0) / 100)).toFixed(2)} €</div>
            </div>
          ))}
          {(order.lines ?? []).length === 0 && <div className="p-3 text-gray-600">Aucune ligne.</div>}
        </div>
      </div>
    </div>
  )
}
