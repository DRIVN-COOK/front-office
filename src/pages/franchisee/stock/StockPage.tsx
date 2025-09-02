// src/pages/franchisee/stock/StockPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { api } from '@drivn-cook/shared';

type DecimalString = string;

type SourceType = 'WAREHOUSE' | 'TRUCK';

type Truck = { id: string; vin?: string; plateNumber?: string; model?: string };
type Warehouse = { id: string; name: string };

type InventoryRowApi = {
  productId: string;
  onHand: DecimalString | number;
  reserved: DecimalString | number;
  product?: {
    name: string;
    sku?: string;
    unit?: 'KG' | 'L' | 'UNIT' | string;
  } | null;
};

type InventoryRow = {
  productId: string;
  name: string;
  sku?: string;
  unit?: string;
  onHand: number;
  reserved: number;
  available: number;
};

type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

// ----------- CONFIG ENDPOINTS (adapte au besoin) -----------
const EP = {
  warehouses: '/warehouses',
  trucks: '/trucks',
  warehouseInventory: '/warehouse-inventory',
  truckInventory: '/truck-inventory',
};
// -----------------------------------------------------------

function toNum(v: number | string | null | undefined) {
  if (v == null) return 0;
  return typeof v === 'number' ? v : Number(v);
}
function fmtQty(n: number, unit?: string) {
  return `${n}${unit ? ` ${unit}` : ''}`;
}
function labelTruck(t: Truck) {
  return t.plateNumber ?? t.vin ?? t.model ?? t.id;
}

export default function StockPage() {
  // Source (onglet)
  const [src, setSrc] = useState<SourceType>('WAREHOUSE');

  // Filtres de portée
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [truckId, setTruckId] = useState<string>('');

  // Filtres de liste
  const [q, setQ] = useState('');
  const [inStockOnly, setInStockOnly] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // Données
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  // Charger listes portée (entrepôts + camions)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [wRes, tRes] = await Promise.all([
          api.get(EP.warehouses, { params: { page: 1, pageSize: 200 } }).catch(() => ({ data: { items: [] } })),
          api.get(EP.trucks, { params: { page: 1, pageSize: 200 } }).catch(() => ({ data: { items: [] } })),
        ]);
        if (cancelled) return;
        const w = (wRes.data?.items ?? []) as Warehouse[];
        const t = (tRes.data?.items ?? []) as Truck[];
        setWarehouses(w);
        setTrucks(t);
        if (!warehouseId && w.length > 0) setWarehouseId(w[0].id);
        if (!truckId && t.length > 0) setTruckId(t[0].id);
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Charger inventaire selon source/filtre
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const params: any = { page, pageSize };
        if (q.trim()) params.q = q.trim();
        if (inStockOnly) params.inStock = true;

        let url = '';
        if (src === 'WAREHOUSE') {
          if (!warehouseId) { setRows([]); setTotal(0); return; }
          url = EP.warehouseInventory;
          params.warehouseId = warehouseId;
        } else {
          if (!truckId) { setRows([]); setTotal(0); return; }
          url = EP.truckInventory;
          params.truckId = truckId;
        }

        const { data } = await api.get(url, { params });
        if (cancelled) return;

        const pageData = data as Paginated<InventoryRowApi>;
        const mapped = (pageData.items ?? []).map((r) => {
          const name = r.product?.name ?? r.productId;
          const sku = r.product?.sku;
          const unit = r.product?.unit;
          const onHand = toNum(r.onHand);
          const reserved = toNum(r.reserved);
          const available = Math.max(0, onHand - reserved);
          return { productId: r.productId, name, sku, unit, onHand, reserved, available };
        });

        setRows(mapped);
        setTotal(pageData.total ?? mapped.length);
      } catch (e) {
        console.error('inventory load error', e);
        setRows([]);
        setTotal(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [src, warehouseId, truckId, page, pageSize, q, inStockOnly]);

  // Reset page quand les filtres changent
  useEffect(() => { setPage(1); }, [src, warehouseId, truckId, q, inStockOnly]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Stocks</h1>
          <p className="text-neutral-500">Consultez les quantités disponibles par entrepôt ou par camion.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Onglets source */}
          <div className="inline-flex rounded-xl border border-neutral-300 overflow-hidden">
            <button
              className={`px-3 py-1.5 text-sm ${src === 'WAREHOUSE' ? 'bg-black text-white' : 'bg-white'}`}
              onClick={() => setSrc('WAREHOUSE')}
            >
              Entrepôt
            </button>
            <button
              className={`px-3 py-1.5 text-sm ${src === 'TRUCK' ? 'bg-black text-white' : 'bg-white'}`}
              onClick={() => setSrc('TRUCK')}
            >
              Camion
            </button>
          </div>

          {/* Sélecteurs de portée */}
          {src === 'WAREHOUSE' ? (
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-xl border border-neutral-300"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          ) : (
            <select
              value={truckId}
              onChange={(e) => setTruckId(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-xl border border-neutral-300"
            >
              {trucks.map((t) => (
                <option key={t.id} value={t.id}>{labelTruck(t)}</option>
              ))}
            </select>
          )}
        </div>
      </header>

      {/* Barre outils */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (nom, SKU…) "
          className="px-3 py-2 rounded-xl border border-neutral-300 w-full sm:w-80"
        />
        <label className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-neutral-300 bg-white">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
          />
          En stock uniquement
        </label>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Produit</th>
              <th className="py-2 pr-4">SKU</th>
              <th className="py-2 pr-4">Unité</th>
              <th className="py-2 pr-4 text-right">En main</th>
              <th className="py-2 pr-4 text-right">Réservé</th>
              <th className="py-2 pr-4 text-right">Disponible</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-10 text-center text-neutral-500">Chargement…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="py-10 text-center text-neutral-500">Aucun résultat.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.productId} className="border-b last:border-b-0">
                  <td className="py-2 pr-4 font-medium">{r.name}</td>
                  <td className="py-2 pr-4">{r.sku ?? '—'}</td>
                  <td className="py-2 pr-4">{r.unit ?? '—'}</td>
                  <td className="py-2 pr-4 text-right">{fmtQty(r.onHand, r.unit)}</td>
                  <td className="py-2 pr-4 text-right">{fmtQty(r.reserved, r.unit)}</td>
                  <td className={`py-2 pr-4 text-right ${r.available <= 0 ? 'text-red-600 font-semibold' : ''}`}>
                    {fmtQty(r.available, r.unit)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded border disabled:opacity-50"
          >
            ←
          </button>
          <span>{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded border disabled:opacity-50"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
