// src/pages/franchisee/orders/LiveOrdersBoardPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@drivn-cook/shared'
import type { Order } from '@drivn-cook/shared'
import { OrderStatus } from '@drivn-cook/shared' // <-- import valeur

type FilterMode = 'ONGOING' | 'PAST' | 'ALL'

// Statuts “en cours”
const ONGOING: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
]

// Statuts “passés”
const PAST: OrderStatus[] = [
  OrderStatus.FULFILLED,
  OrderStatus.CANCELLED,
]

function fmtDateTime(s?: string | null) {
  if (!s) return '—'
  const d = new Date(s)
  return d.toLocaleString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  })
}

function statusBadgeColor(s: OrderStatus) {
  switch (s) {
    case OrderStatus.PENDING:    return 'bg-neutral-100 text-neutral-700'
    case OrderStatus.CONFIRMED:  return 'bg-blue-100 text-blue-700'
    case OrderStatus.PREPARING:  return 'bg-amber-100 text-amber-700'
    case OrderStatus.READY:      return 'bg-emerald-100 text-emerald-700'
    case OrderStatus.FULFILLED:  return 'bg-green-100 text-green-700'
    case OrderStatus.CANCELLED:  return 'bg-red-100 text-red-700'
    default:                     return 'bg-neutral-100 text-neutral-700'
  }
}

export default function LiveOrdersBoardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<FilterMode>('ONGOING')
  const [q, setQ] = useState('') // petite recherche par id / franchisee
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Chargement
  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get('/customer-orders', {
        params: { page: 1, pageSize: 200, sort: 'placedAt:desc' },
      })
      const items: Order[] = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : [])
      setOrders(items)
    } catch (e) {
      console.error('load orders error', e)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Auto-refresh toutes les 15s si visible
  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load()
    }, 15000)
    return () => clearInterval(id)
  }, [autoRefresh])

  // Filtrage
  const filtered = useMemo(() => {
    let list = orders

    if (filter === 'ONGOING') {
      list = orders.filter(o => ONGOING.includes(o.status))
    } else if (filter === 'PAST') {
      list = orders.filter(o => PAST.includes(o.status))
    }

    const term = q.trim().toLowerCase()
    if (term) {
      list = list.filter(o =>
        o.id.toLowerCase().includes(term) ||
        (o.franchiseeId?.toLowerCase?.().includes(term))
      )
    }

    return list
  }, [orders, filter, q])

  // Split immédiates vs planifiées
  const immediate = useMemo(
    () => filtered
      .filter(o => !o.scheduledPickupAt) // à manger maintenant
      .sort((a, b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime()),
    [filtered]
  )
  const scheduled = useMemo(
    () => filtered
      .filter(o => !!o.scheduledPickupAt) // heure précise
      .sort((a, b) =>
        new Date(a.scheduledPickupAt || a.placedAt).getTime() -
        new Date(b.scheduledPickupAt || b.placedAt).getTime()
      ),
    [filtered]
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Commandes (Temps réel)</h1>
          <p className="text-neutral-500">
            À gauche : pour manger maintenant. À droite : avec heure précise.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex rounded-xl border border-neutral-300 overflow-hidden">
            <button
              className={`px-3 py-1.5 text-sm ${filter === 'ONGOING' ? 'bg-black text-white' : 'bg-white'}`}
              onClick={() => setFilter('ONGOING')}
              title="En cours (par défaut)"
            >
              En cours
            </button>
            <button
              className={`px-3 py-1.5 text-sm ${filter === 'PAST' ? 'bg-black text-white' : 'bg-white'}`}
              onClick={() => setFilter('PAST')}
              title="Commandes passées"
            >
              Passées
            </button>
            <button
              className={`px-3 py-1.5 text-sm ${filter === 'ALL' ? 'bg-black text-white' : 'bg-white'}`}
              onClick={() => setFilter('ALL')}
              title="Toutes"
            >
              Toutes
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl border border-neutral-300 bg-white">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh 15s
          </label>

          <button
            onClick={load}
            className="px-3 py-1.5 text-sm rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50"
          >
            Actualiser
          </button>
        </div>
      </header>

      {/* Barre de recherche */}
      <div className="mb-4">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (ID commande, ID franchisée)…"
          className="px-3 py-2 rounded-xl border border-neutral-300 w-full sm:w-96"
        />
      </div>

      {/* Deux colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne gauche — immédiates */}
        <section>
          <h2 className="text-lg font-semibold mb-3">À préparer maintenant</h2>
          <div className="space-y-3">
            {loading ? (
              <div className="p-4 text-neutral-500 border rounded-xl">Chargement…</div>
            ) : immediate.length === 0 ? (
              <div className="p-4 text-neutral-500 border rounded-xl">Aucune commande à afficher.</div>
            ) : (
              immediate.map((o) => (
                <div key={o.id} className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">Commande #{o.id.slice(0, 8)}</div>
                      <div className="text-xs text-neutral-500">
                        Passée le {fmtDateTime(o.placedAt)}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusBadgeColor(o.status)}`}>
                      {o.status}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm text-neutral-600">
                      Retrait: <strong>immédiat</strong>
                    </div>
                    <div className="text-sm font-semibold">
                      Total TTC: {Number(o.totalTTC).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Link
                      to={`/franchisée/orders/${o.id}`}
                      className="px-3 py-1.5 text-sm rounded-md border hover:bg-neutral-50"
                    >
                      Détails
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Colonne droite — planifiées */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Précommandes (heure précise)</h2>
          <div className="space-y-3">
            {loading ? (
              <div className="p-4 text-neutral-500 border rounded-xl">Chargement…</div>
            ) : scheduled.length === 0 ? (
              <div className="p-4 text-neutral-500 border rounded-xl">Aucune précommande à afficher.</div>
            ) : (
              scheduled.map((o) => (
                <div key={o.id} className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">Commande #{o.id.slice(0, 8)}</div>
                      <div className="text-xs text-neutral-500">
                        Pour le <strong>{fmtDateTime(o.scheduledPickupAt)}</strong>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusBadgeColor(o.status)}`}>
                      {o.status}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm text-neutral-600">
                      Passée le {fmtDateTime(o.placedAt)}
                    </div>
                    <div className="text-sm font-semibold">
                      Total TTC: {Number(o.totalTTC).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Link
                      to={`/franchisée/orders/${o.id}`}
                      className="px-3 py-1.5 text-sm rounded-md border hover:bg-neutral-50"
                    >
                      Détails
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
