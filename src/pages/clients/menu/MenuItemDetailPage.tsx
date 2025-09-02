// src/pages/clients/menu/MenuItemDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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

  // (optionnel, si un jour l'API expose le stock au niveau détail)
  inStock?: boolean;
  availableQty?: number;
  stockStatus?: 'IN_STOCK' | 'LOW' | 'OUT';
}

function toNum(v: number | string | null | undefined) {
  if (v == null) return 0;
  return typeof v === 'number' ? v : Number(v);
}
function eur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

async function getMenuItem(id: string): Promise<MenuItem> {
  const res = await fetch(`/api/menu-items/${id}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`MenuItem ${id} not found`);
  return res.json();
}

export default function MenuItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [qty, setQty] = useState(1);

  // charge l'article
  useEffect(() => {
    if (!id) return;
    getMenuItem(id)
      .then(setItem)
      .catch(() => navigate('/client/menu', { replace: true }));
  }, [id, navigate]);

  // ajoute au panier via localStorage + notifie le Header
  function addToCart(mi: MenuItem, q: number) {
    if (!mi.isActive || q < 1) return;

    try {
      const s = localStorage.getItem('cart');
      const arr: Array<{ item: MenuItem; qty: number }> = s ? JSON.parse(s) : [];
      const idx = arr.findIndex((l) => l.item?.id === mi.id);
      if (idx === -1) arr.push({ item: mi, qty: q });
      else arr[idx] = { ...arr[idx], qty: arr[idx].qty + q };

      localStorage.setItem('cart', JSON.stringify(arr));
      window.dispatchEvent(new Event('cart:update')); // met à jour le badge du Header
      // feedback simple
      alert(`Ajouté ${q} × ${mi.name} au panier`);
    } catch (e) {
      console.error('Panier localStorage error:', e);
    }
  }

  if (!item) return <div className="mx-auto max-w-3xl px-4 py-10">Chargement…</div>;

  const ht = toNum(item.priceHT);
  const tva = toNum(item.tvaPct);
  const ttc = ht * (1 + tva / 100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button onClick={() => navigate(-1)} className="text-sm underline">← Retour</button>

      <div className="mt-4 grid gap-6 grid-cols-1 sm:grid-cols-2">
        <div className="rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 aspect-square">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400">
              Image indisponible
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold">{item.name}</h1>
          {item.description && (
            <p className="mt-2 text-neutral-600 dark:text-neutral-300">{item.description}</p>
          )}

          <div className="mt-4">
            <div className="text-2xl font-semibold">{eur(ttc)}</div>
            <div className="text-xs text-neutral-500">HT {eur(ht)} • TVA {tva}%</div>
            {!item.isActive && (
              <div className="mt-2 text-sm text-yellow-700">
                Cet article est temporairement indisponible.
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              className="w-24 rounded-xl border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900"
            />
            <button
              onClick={() => addToCart(item, qty)}
              disabled={!item.isActive}
              className={`rounded-xl px-5 py-2 font-medium transition
                ${item.isActive
                  ? 'bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'}`}
            >
              Ajouter au panier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
