// src/pages/franchisee/procurement/PurchaseOrderListPage.tsx
import * as React from 'react'
import { useAuth } from '@drivn-cook/shared'
import {
  listPurchaseOrders,
  submitPurchaseOrder,
  cancelPurchaseOrder,
  type ListPOParams,
} from '../../../services/procurement.service'

function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: 'bg-yellow-100 text-yellow-800',
    SUBMITTED: 'bg-blue-100 text-blue-800',
    PREPARING: 'bg-purple-100 text-purple-800',
    READY: 'bg-teal-100 text-teal-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }
  const cls = map[status] ?? 'bg-gray-100 text-gray-800'
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{status}</span>
}

export default function PurchaseOrderListPage() {
  const { user } = useAuth() as any
  const myFranchiseeId: string | undefined =
    user?.franchiseeId || user?.franchisee?.id || undefined

  const [items, setItems] = React.useState<any[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [q, setQ] = React.useState<ListPOParams>({
    page: 1,
    pageSize: 20,
    status: undefined,
    franchiseeId: myFranchiseeId, // filtre par ma franchise
  })

  // Si l'user est hydraté après le premier render, injecte son franchiseeId
  React.useEffect(() => {
    if (myFranchiseeId && q.franchiseeId !== myFranchiseeId) {
      setQ(p => ({ ...p, page: 1, franchiseeId: myFranchiseeId }))
    }
  }, [myFranchiseeId]) // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = async () => {
    setLoading(true); setError(null)
    try {
      const data = await listPurchaseOrders(q)
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (e: any) {
      setError(e?.message ?? 'Erreur')
    } finally {
      setLoading(false)
    }
  }
  React.useEffect(() => { refresh() }, [q.page, q.pageSize, q.status, q.franchiseeId]) // eslint-disable-line react-hooks/exhaustive-deps

  const canCancel = (s: string) => !['DELIVERED', 'CANCELLED'].includes(s)

  const onSubmit = async (id: string) => {
    try {
      setLoading(true)
      await submitPurchaseOrder(id)
      await refresh()
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Erreur lors de la soumission')
      setLoading(false)
    }
  }

  const onCancel = async (id: string) => {
    if (!confirm('Annuler ce bon d’appro ?')) return
    try {
      setLoading(true)
      await cancelPurchaseOrder(id)
      await refresh()
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Erreur lors de l’annulation')
      setLoading(false)
    }
  }

  const attachedWarehouse = items[0]?.warehouse?.name || null

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bons d’appro</h1>
          {attachedWarehouse && (
            <div className="mt-1 text-sm text-neutral-600">
              Entrepôt rattaché : <span className="font-medium">{attachedWarehouse}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            className="border rounded px-2 py-1 text-sm"
            value={q.status ?? ''}
            onChange={(e) => setQ((p) => ({ ...p, page: 1, status: e.target.value ? (e.target.value as any) : undefined }))}
          >
            <option value="">Tous statuts</option>
            <option value="DRAFT">Brouillon</option>
            <option value="SUBMITTED">Soumis</option>
            <option value="PREPARING">En préparation</option>
            <option value="READY">Prêt</option>
            <option value="DELIVERED">Livré</option>
            <option value="CANCELLED">Annulé</option>
          </select>

          <select
            className="border rounded px-2 py-1 text-sm"
            value={q.pageSize ?? 20}
            onChange={(e) => setQ((p) => ({ ...p, page: 1, pageSize: Number(e.target.value) }))}
          >
            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}/page</option>)}
          </select>

          <button onClick={refresh} className="border rounded px-3 py-1 text-sm">Rafraîchir</button>
        </div>
      </div>

      {loading && <div>Chargement…</div>}
      {error && <div className="text-red-600 mb-3">{error}</div>}

      {!loading && (
        <>
          <div className="rounded-xl border divide-y overflow-hidden bg-white">
            {items.map((po: any) => (
              <div key={po.id} className="p-3 sm:p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">PO #{po.id}</div>
                  <div className="text-sm text-gray-600">
                    {po.franchisee?.name ? `${po.franchisee.name} • ` : ''}
                    {po.warehouse?.name ?? 'Entrepôt ?'}
                    {po.totalHT ? ` • Total HT: ${po.totalHT} €` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={po.status} />
                  {po.status === 'DRAFT' && (
                    <button
                      onClick={() => onSubmit(po.id)}
                      className="text-sm border rounded px-2 py-1 hover:bg-black hover:text-white"
                    >
                      Soumettre
                    </button>
                  )}
                  {canCancel(po.status) && (
                    <button
                      onClick={() => onCancel(po.id)}
                      className="text-sm border rounded px-2 py-1 hover:bg-red-600 hover:text-white"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            ))}
            {items.length === 0 && <div className="p-4 text-gray-600">Aucun bon d’appro.</div>}
          </div>

          {/* Pagination simple */}
          <div className="mt-3 flex items-center justify-between text-sm">
            <div>Total: {total}</div>
            <div className="flex items-center gap-2">
              <button
                disabled={(q.page ?? 1) <= 1}
                onClick={() => setQ((p) => ({ ...p, page: Math.max(1, (p.page ?? 1) - 1) }))}
                className="border rounded px-2 py-1 disabled:opacity-50"
              >
                Précédent
              </button>
              <span>Page {q.page}</span>
              <button
                disabled={(q.page ?? 1) * (q.pageSize ?? 20) >= total}
                onClick={() => setQ((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
                className="border rounded px-2 py-1 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
