import React from 'react'
import { listLoyaltyCards, createLoyaltyTransaction } from '../../../services/loyalty.service'

export default function LoyaltyCardsPage() {
  const [items, setItems] = React.useState<any[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  const refresh = async () => {
    setLoading(true); setError(null)
    try { const data = await listLoyaltyCards(); setItems(data?.items ?? data ?? []) }
    catch (e: any) { setError(e?.message ?? 'Erreur') }
    finally { setLoading(false) }
  }
  React.useEffect(() => { refresh() }, [])

  const addPoints = async (cardId: string, amount: number) => {
    await createLoyaltyTransaction({ cardId, amount })
    await refresh()
  }

  if (loading) return <div>Chargement…</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Cartes de fidélité</h1>
      <div className="rounded-xl border divide-y overflow-hidden">
        {items.map((c: any) => (
          <div key={c.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">#{c.id}</div>
              <div className="text-sm text-gray-600">Client: {c.customerId} • Points: <b>{c.points ?? 0}</b></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => addPoints(c.id, +1)} className="px-3 py-1.5 border rounded">+1</button>
              <button onClick={() => addPoints(c.id, -1)} className="px-3 py-1.5 border rounded">-1</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="p-3 text-gray-600">Aucune carte.</div>}
      </div>
    </div>
  )
}
