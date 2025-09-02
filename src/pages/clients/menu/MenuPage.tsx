// src/pages/client/menu/MenuPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/** Types locaux (garde comme dans ta page actuelle) */
type ISODateString = string;
type DecimalString = string;

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  priceHT: DecimalString;
  tvaPct: DecimalString;
  imageUrl?: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;

  // Optionnel si l’API expose le stock
  inStock?: boolean;
  availableQty?: number;
  stockStatus?: 'IN_STOCK' | 'LOW' | 'OUT';
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

function toNum(v: number | string | null | undefined) {
  if (v == null) return 0;
  return typeof v === 'number' ? v : Number(v);
}
function eur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}
function priceTTC(item: MenuItem) {
  const ht = toNum(item.priceHT);
  const tva = toNum(item.tvaPct);
  return ht * (1 + tva / 100);
}

async function listMenuItems(params: {
  page?: number;
  pageSize?: number;
  active?: boolean;
} = {}): Promise<PaginatedResult<MenuItem>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  if (typeof params.active === 'boolean') qs.set('active', String(params.active));
  const res = await fetch(`/api/menu-items?${qs.toString()}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to load menu items: ${res.status}`);
  return res.json();
}

/** ———————————————
 *  PAGE (sans panier intégré)
 * ——————————————— */
export default function MenuPage() {
  const navigate = useNavigate();

  // Liste menu
  const [items, setItems] = useState<MenuItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [onlyActive, setOnlyActive] = useState(true);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  // Charger menu
  useEffect(() => {
    (async () => {
      const data = await listMenuItems({
        page,
        pageSize,
        active: onlyActive ? true : undefined,
      });
      setItems(data.items);
      setTotal(data.total);
      const newTotalPages = Math.max(1, Math.ceil(data.total / pageSize));
      if (page > newTotalPages) setPage(1);
    })().catch(console.error);
  }, [page, pageSize, onlyActive]);

  /** Ajout au panier → localStorage + évènement pour rafraîchir le badge Header */
  const addToCart = (item: MenuItem, qty = 1) => {
    const out =
      !item.isActive ||
      item.stockStatus === 'OUT' ||
      item.inStock === false ||
      (typeof item.availableQty === 'number' && item.availableQty <= 0);
    if (out) return;

    try {
      const s = localStorage.getItem('cart');
      const arr: Array<{ item: MenuItem; qty: number }> = s ? JSON.parse(s) : [];
      const idx = arr.findIndex((l) => l.item.id === item.id);
      if (idx === -1) arr.push({ item, qty });
      else arr[idx] = { ...arr[idx], qty: arr[idx].qty + qty };
      localStorage.setItem('cart', JSON.stringify(arr));
      window.dispatchEvent(new Event('cart:update')); // pour le badge du Header
    } catch {
      // silencieux
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Menu</h1>
          <p className="text-neutral-500">Choisissez vos articles et ajoutez-les au panier.</p>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900">
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={(e) => {
                setOnlyActive(e.target.checked);
                setPage(1);
              }}
            />
            Afficher uniquement les articles actifs
          </label>
        </div>
      </header>

      {/* Grille */}
      <section className="mt-6">
        {items.length === 0 ? (
          <div className="text-center text-neutral-500 py-16">Aucun article trouvé.</div>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => {
              const ttc = priceTTC(item);
              const out =
                !item.isActive ||
                item.stockStatus === 'OUT' ||
                item.inStock === false ||
                (typeof item.availableQty === 'number' && item.availableQty <= 0);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border bg-white dark:bg-neutral-900 shadow p-4 flex flex-col"
                >
                  <div className="aspect-[4/3] mb-3 bg-neutral-100 rounded-xl overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-neutral-400">
                        Image indisponible
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{item.description}</p>
                    )}
                    {!item.isActive && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded mt-2 inline-block">
                        Indisponible
                      </span>
                    )}
                    {(item.stockStatus === 'OUT' ||
                      item.inStock === false ||
                      (typeof item.availableQty === 'number' && item.availableQty <= 0)) && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded mt-2 inline-block">
                        Rupture de stock
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-bold">{eur(ttc)}</span>
                    <button
                      disabled={out}
                      onClick={() => addToCart(item, 1)}
                      className="px-3 py-1 rounded bg-black text-white disabled:bg-neutral-400"
                    >
                      Ajouter
                    </button>
                  </div>

                  <button
                    onClick={() => navigate(`/client/menu/${item.id}`)}
                    className="mt-2 px-3 py-1 border rounded text-sm"
                  >
                    Détails
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ⛔️ Plus de section “Panier” ici */}
    </div>
  );
}
