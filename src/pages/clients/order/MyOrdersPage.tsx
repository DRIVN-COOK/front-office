// src/pages/client/order/MyOrdersPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type DecimalString = string;
type ISODateString = string;
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'FULFILLED' | 'CANCELLED';

interface OrderListItem {
  id: string;
  placedAt: ISODateString;
  status: OrderStatus;
  totalHT: DecimalString;
  totalTVA: DecimalString;
  totalTTC: DecimalString;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

function eur(n: number | string) {
  const v = typeof n === 'number' ? n : Number(n);
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v);
}
function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  } catch {
    return iso;
  }
}
function statusBadgeClasses(s: OrderStatus) {
  switch (s) {
    case 'PENDING': return 'bg-neutral-100 text-neutral-700';
    case 'CONFIRMED': return 'bg-blue-100 text-blue-700';
    case 'PREPARING': return 'bg-amber-100 text-amber-800';
    case 'READY': return 'bg-indigo-100 text-indigo-700';
    case 'FULFILLED': return 'bg-green-100 text-green-700';
    case 'CANCELLED': return 'bg-red-100 text-red-700';
    default: return 'bg-neutral-100 text-neutral-700';
  }
}

/** API: liste des commandes de l’utilisateur courant */
async function listMyOrders(params: {
  page?: number;
  pageSize?: number;
  status?: OrderStatus | 'ALL';
} = {}): Promise<PaginatedResult<OrderListItem>> {
  const qs = new URLSearchParams();
  qs.set('mine', 'true');
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  if (params.status && params.status !== 'ALL') qs.set('status', params.status);
  const res = await fetch(`/api/customer-orders?${qs.toString()}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to load orders: ${res.status}`);
  return res.json();
}

export default function MyOrdersPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<OrderListItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listMyOrders({ page, pageSize, status })
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
        const maxPage = Math.max(1, Math.ceil(data.total / pageSize));
        if (page > maxPage) setPage(1);
      })
      .catch((e) => setError(e?.message || 'Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, [page, pageSize, status]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Mes commandes</h1>
          <p className="text-neutral-500">Consultez l’historique et le statut de vos commandes.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as any); setPage(1); }}
            className="rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="CONFIRMED">Confirmée</option>
            <option value="PREPARING">En préparation</option>
            <option value="READY">Prête</option>
            <option value="FULFILLED">Livrée</option>
            <option value="CANCELLED">Annulée</option>
          </select>
        </div>
      </header>

      <section className="mt-6">
        {loading ? (
          <div className="py-16 text-center text-neutral-500">Chargement…</div>
        ) : error ? (
          <div className="py-16 text-center text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-neutral-500">Aucune commande.</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-sm text-neutral-600 dark:text-neutral-300">
                  <th className="py-2 border-b border-neutral-200 dark:border-neutral-800">N°</th>
                  <th className="py-2 border-b border-neutral-200 dark:border-neutral-800">Passée le</th>
                  <th className="py-2 border-b border-neutral-200 dark:border-neutral-800">Statut</th>
                  <th className="py-2 border-b border-neutral-200 dark:border-neutral-800">Total TTC</th>
                  <th className="py-2 border-b border-neutral-200 dark:border-neutral-800"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((o) => (
                  <tr key={o.id} className="text-sm">
                    <td className="py-3 border-b border-neutral-100 dark:border-neutral-800 font-mono">{o.id}</td>
                    <td className="py-3 border-b border-neutral-100 dark:border-neutral-800">{fmtDate(o.placedAt)}</td>
                    <td className="py-3 border-b border-neutral-100 dark:border-neutral-800">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusBadgeClasses(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 border-b border-neutral-100 dark:border-neutral-800 font-medium">
                      {eur(o.totalTTC)}
                    </td>
                    <td className="py-3 border-b border-neutral-100 dark:border-neutral-800 text-right">
                      <button
                        onClick={() => navigate(`/client/order/confirmation/${o.id}`)}
                        className="px-3 py-1 border rounded text-sm"
                      >
                        Voir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            ←
          </button>
          <span className="text-sm">Page {page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            →
          </button>
        </nav>
      )}
    </div>
  );
}
